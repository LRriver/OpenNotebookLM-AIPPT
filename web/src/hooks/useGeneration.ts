import { useRef, useCallback } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import {
  startGeneration,
  cancelGeneration,
  SSEProgressData,
  SSEErrorData
} from '../services/generateService'
import { Slide } from '../types'

/**
 * 生成功能 Hook
 * 
 * 封装 PPT 生成的所有逻辑，包括：
 * - 开始生成
 * - 取消生成
 * - 处理 SSE 事件
 * - 更新应用状态
 */
export function useGeneration() {
  const {
    state,
    startGeneration: startGenerationState,
    updateProgress,
    addSlide,
    completeGeneration,
    setGenerationError
  } = useAppState()
  
  // 保存 AbortController 引用
  const abortControllerRef = useRef<AbortController | null>(null)
  
  /**
   * 开始生成 PPT
   */
  const generate = useCallback(() => {
    // 检查是否已经在生成中
    if (state.isGenerating) {
      return
    }
    
    // 检查必要条件
    if (!state.fileContent) {
      setGenerationError('请先上传文件')
      return
    }
    
    if (!state.apiConfig.apiKey || !state.apiConfig.baseUrl) {
      setGenerationError('请先配置 API')
      return
    }
    
    // 更新状态为生成中
    startGenerationState()
    
    // 处理进度事件
    const handleProgress = (data: SSEProgressData) => {
      updateProgress(data.current, data.total, data.status, data.message)
    }
    
    // 处理幻灯片事件
    const handleSlide = (slide: Slide) => {
      addSlide(slide)
    }
    
    // 处理完成事件
    const handleComplete = () => {
      completeGeneration()
      abortControllerRef.current = null
    }
    
    // 处理错误事件
    const handleError = (data: SSEErrorData) => {
      if (data.fatal) {
        setGenerationError(data.message)
        abortControllerRef.current = null
      } else {
        // 非致命错误，只更新进度消息
        updateProgress(
          state.generationProgress.current,
          state.generationProgress.total,
          'error',
          data.message
        )
      }
    }
    
    // 开始生成
    abortControllerRef.current = startGeneration(
      {
        content: state.fileContent,
        apiConfig: state.apiConfig,
        generationConfig: state.generationConfig
      },
      {
        onProgress: handleProgress,
        onSlide: handleSlide,
        onComplete: handleComplete,
        onError: handleError
      }
    )
  }, [
    state.isGenerating,
    state.fileContent,
    state.apiConfig,
    state.generationConfig,
    state.generationProgress.current,
    state.generationProgress.total,
    startGenerationState,
    updateProgress,
    addSlide,
    completeGeneration,
    setGenerationError
  ])
  
  /**
   * 取消生成
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      cancelGeneration(abortControllerRef.current)
      abortControllerRef.current = null
      setGenerationError('生成已取消')
    }
  }, [setGenerationError])
  
  return {
    generate,
    cancel,
    isGenerating: state.isGenerating,
    progress: state.generationProgress,
    error: state.generationError,
    slides: state.slides
  }
}
