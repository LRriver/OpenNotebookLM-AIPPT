import { useState, useCallback } from 'react'
import { EditSession, Slide } from '../types'

interface PendingEditAction {
  type: 'switch' | 'cancel'
  targetSlide?: Slide
}

/**
 * 编辑冲突检测 Hook
 * 检测是否有未保存的编辑，切换时弹出确认对话框
 * Requirements: 8.1
 */
export function useEditConflict() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingEditAction | null>(null)

  /**
   * 检查是否有未保存的编辑
   * 如果编辑会话存在且有历史记录，则认为有未保存的编辑
   */
  const hasUnsavedEdits = useCallback((editSession: EditSession | null): boolean => {
    if (!editSession) return false
    // 如果有编辑历史，说明用户进行了修改
    return editSession.history.length > 0
  }, [])

  /**
   * 尝试切换到另一个幻灯片进行编辑
   * 如果有未保存的编辑，显示确认对话框
   * @returns true 如果可以直接切换，false 如果需要用户确认
   */
  const tryStartEdit = useCallback((
    currentEditSession: EditSession | null,
    targetSlide: Slide
  ): boolean => {
    // 如果没有当前编辑会话，可以直接开始
    if (!currentEditSession) {
      return true
    }

    // 如果是同一个幻灯片，不需要切换
    if (currentEditSession.slideId === targetSlide.id) {
      return true
    }

    // 检查是否有未保存的编辑
    if (hasUnsavedEdits(currentEditSession)) {
      // 保存待处理的操作
      setPendingAction({ type: 'switch', targetSlide })
      setShowConfirmDialog(true)
      return false
    }

    // 没有未保存的编辑，可以直接切换
    return true
  }, [hasUnsavedEdits])

  /**
   * 尝试取消当前编辑
   * 如果有未保存的编辑，显示确认对话框
   * @returns true 如果可以直接取消，false 如果需要用户确认
   */
  const tryCancelEdit = useCallback((
    currentEditSession: EditSession | null
  ): boolean => {
    // 如果没有当前编辑会话，不需要取消
    if (!currentEditSession) {
      return true
    }

    // 检查是否有未保存的编辑
    if (hasUnsavedEdits(currentEditSession)) {
      // 保存待处理的操作
      setPendingAction({ type: 'cancel' })
      setShowConfirmDialog(true)
      return false
    }

    // 没有未保存的编辑，可以直接取消
    return true
  }, [hasUnsavedEdits])

  /**
   * 用户确认放弃编辑
   */
  const confirmDiscard = useCallback(() => {
    setShowConfirmDialog(false)
    const action = pendingAction
    setPendingAction(null)
    return action
  }, [pendingAction])

  /**
   * 用户取消放弃编辑（继续编辑）
   */
  const cancelDiscard = useCallback(() => {
    setShowConfirmDialog(false)
    setPendingAction(null)
  }, [])

  return {
    showConfirmDialog,
    pendingAction,
    hasUnsavedEdits,
    tryStartEdit,
    tryCancelEdit,
    confirmDiscard,
    cancelDiscard
  }
}
