import { useState, useCallback } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import { editImage } from '../services/editService'
import { EditSession, EditHistoryItem, Slide } from '../types'

/**
 * 编辑会话管理 Hook
 * 实现多轮编辑逻辑，每次编辑基于最新版本，保存所有历史版本
 * Requirements: 7.4, 7.5, 7.6, 8.2
 */
export function useEdit() {
  const { state, startEdit, updateEdit, endEdit, updateSlide, selectSlide } = useAppState()
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  /**
   * 开始编辑一个幻灯片
   */
  const beginEdit = useCallback((slide: Slide) => {
    // 获取图片的 base64 数据
    const imageBase64 = slide.imageBase64 || ''
    const imageUrl = slide.imageUrl || (imageBase64 ? `data:image/png;base64,${imageBase64}` : '')

    const session: EditSession = {
      slideId: slide.id,
      originalImage: imageBase64 || imageUrl,
      currentImage: imageBase64 || imageUrl,
      history: [],
      userInput: ''
    }

    startEdit(session)
    setEditError(null)
  }, [startEdit])

  /**
   * 提交编辑指令
   * 每次编辑基于最新版本
   */
  const submitEdit = useCallback(async (instruction: string) => {
    if (!state.editingSlide) return

    setIsEditing(true)
    setEditError(null)

    try {
      // 获取当前图片的 base64（去掉 data:image/png;base64, 前缀）
      let currentBase64 = state.editingSlide.currentImage
      if (currentBase64.startsWith('data:')) {
        currentBase64 = currentBase64.split(',')[1]
      }

      const response = await editImage({
        image_base64: currentBase64,
        instruction,
        config: {
          api_key: state.apiConfig.apiKey,
          base_url: state.apiConfig.baseUrl,
          quality: state.generationConfig.quality,
          aspect_ratio: state.generationConfig.aspectRatio
        }
      })

      if (response.success && response.image_base64) {
        // 保存当前版本到历史
        const historyItem: EditHistoryItem = {
          imageUrl: state.editingSlide.currentImage.startsWith('data:')
            ? state.editingSlide.currentImage
            : `data:image/png;base64,${state.editingSlide.currentImage}`,
          imageBase64: currentBase64,
          instruction,
          timestamp: Date.now()
        }

        // 更新编辑会话
        updateEdit({
          currentImage: response.image_base64,
          history: [...state.editingSlide.history, historyItem],
          userInput: ''
        })
      } else {
        throw new Error(response.message || '编辑失败')
      }
    } catch (error) {
      setEditError(error instanceof Error ? error.message : '编辑失败')
    } finally {
      setIsEditing(false)
    }
  }, [state.editingSlide, state.apiConfig, state.generationConfig, updateEdit])

  /**
   * 回退到历史版本
   */
  const revertToVersion = useCallback((historyItem: EditHistoryItem) => {
    if (!state.editingSlide) return

    // 找到历史记录的索引
    const index = state.editingSlide.history.findIndex(
      h => h.timestamp === historyItem.timestamp
    )

    if (index >= 0) {
      // 保留该版本之前的历史（不包括该版本）
      const newHistory = state.editingSlide.history.slice(0, index)

      updateEdit({
        currentImage: historyItem.imageBase64,
        history: newHistory
      })
    }
  }, [state.editingSlide, updateEdit])

  /**
   * 确认编辑 - 替换原图
   * 确认后立即更新预览，更新 slides 数组中对应项
   * Requirements: 7.5, 8.2
   */
  const confirmEdit = useCallback(() => {
    if (!state.editingSlide) return

    // 获取当前图片的 base64
    let currentBase64 = state.editingSlide.currentImage
    if (currentBase64.startsWith('data:')) {
      currentBase64 = currentBase64.split(',')[1]
    }

    const slideId = state.editingSlide.slideId

    // 更新幻灯片 - 这会立即更新预览面板
    updateSlide(slideId, {
      imageBase64: currentBase64,
      imageUrl: `data:image/png;base64,${currentBase64}`
    })

    // 保持选中状态，确保用户可以看到更新后的幻灯片
    selectSlide(slideId)

    // 结束编辑
    endEdit()
    setEditError(null)
  }, [state.editingSlide, updateSlide, selectSlide, endEdit])

  /**
   * 取消编辑 - 丢弃所有编辑
   * Requirements: 7.6
   */
  const cancelEdit = useCallback(() => {
    endEdit()
    setEditError(null)
  }, [endEdit])

  return {
    editSession: state.editingSlide,
    isEditing,
    editError,
    beginEdit,
    submitEdit,
    revertToVersion,
    confirmEdit,
    cancelEdit
  }
}
