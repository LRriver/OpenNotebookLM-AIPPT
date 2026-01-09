/**
 * useAutoSave Hook - 自动保存状态到 localStorage
 * 
 * Requirements: 10.1
 * 
 * 监听状态变化，使用防抖机制保存到 localStorage
 */

import { useEffect, useRef, useCallback } from 'react'
import { StorageService } from '../services/storageService'
import { Slide, GenerationConfig } from '../types'

/**
 * 防抖延迟时间（毫秒）
 */
const DEBOUNCE_DELAY = 1000

/**
 * 自动保存 Hook 参数
 */
interface UseAutoSaveParams {
  fileContent: string
  fileName: string
  slides: Slide[]
  generationConfig: GenerationConfig
  enabled?: boolean
}

/**
 * 自动保存 Hook 返回值
 */
interface UseAutoSaveReturn {
  isSaving: boolean
  lastSaved: Date | null
  saveNow: () => void
}

/**
 * 自动保存 Hook
 * 
 * 监听状态变化，使用防抖机制自动保存到 localStorage
 */
export function useAutoSave({
  fileContent,
  fileName,
  slides,
  generationConfig,
  enabled = true
}: UseAutoSaveParams): UseAutoSaveReturn {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedRef = useRef<Date | null>(null)

  /**
   * 执行保存操作
   */
  const performSave = useCallback(() => {
    // 只有当有内容时才保存
    if (!fileContent && slides.length === 0) {
      return
    }

    isSavingRef.current = true
    
    const success = StorageService.saveProject(
      fileContent,
      fileName,
      slides,
      generationConfig
    )

    if (success) {
      lastSavedRef.current = new Date()
    }

    isSavingRef.current = false
  }, [fileContent, fileName, slides, generationConfig])

  /**
   * 立即保存（跳过防抖）
   */
  const saveNow = useCallback(() => {
    // 清除待执行的防抖保存
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    performSave()
  }, [performSave])

  /**
   * 防抖保存
   */
  const debouncedSave = useCallback(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      performSave()
      timeoutRef.current = null
    }, DEBOUNCE_DELAY)
  }, [performSave])

  /**
   * 监听状态变化，触发防抖保存
   */
  useEffect(() => {
    if (!enabled) {
      return
    }

    // 触发防抖保存
    debouncedSave()

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [fileContent, fileName, slides, generationConfig, enabled, debouncedSave])

  /**
   * 组件卸载时保存
   */
  useEffect(() => {
    return () => {
      // 组件卸载时，如果有待保存的内容，立即保存
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        performSave()
      }
    }
  }, [performSave])

  /**
   * 页面关闭前保存
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 页面关闭前立即保存
      if (enabled && (fileContent || slides.length > 0)) {
        StorageService.saveProject(
          fileContent,
          fileName,
          slides,
          generationConfig
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, fileContent, fileName, slides, generationConfig])

  return {
    isSaving: isSavingRef.current,
    lastSaved: lastSavedRef.current,
    saveNow
  }
}

export default useAutoSave
