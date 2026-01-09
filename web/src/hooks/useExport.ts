import { useState, useCallback } from 'react'
import { Slide, ExportFormat } from '../types'
import { exportPresentation, canExport } from '../services/exportService'

/**
 * 导出状态
 */
export interface ExportState {
  isExporting: boolean
  progress: number
  error: string | null
}

/**
 * 导出 Hook 返回值
 */
export interface UseExportReturn {
  state: ExportState
  canExport: boolean
  startExport: (format: ExportFormat) => Promise<void>
  clearError: () => void
}

/**
 * 导出功能 Hook
 * 
 * @param slides 幻灯片列表
 * @returns 导出状态和方法
 */
export function useExport(slides: Slide[]): UseExportReturn {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null
  })

  const canExportSlides = canExport(slides)

  const startExport = useCallback(async (format: ExportFormat) => {
    if (!canExportSlides) {
      setState(prev => ({
        ...prev,
        error: '没有可导出的幻灯片'
      }))
      return
    }

    setState({
      isExporting: true,
      progress: 0,
      error: null
    })

    try {
      await exportPresentation(
        { slides, format },
        {
          onStart: () => {
            setState(prev => ({ ...prev, progress: 5 }))
          },
          onProgress: (progress) => {
            setState(prev => ({ ...prev, progress }))
          },
          onComplete: () => {
            setState({
              isExporting: false,
              progress: 100,
              error: null
            })
          },
          onError: (error) => {
            setState({
              isExporting: false,
              progress: 0,
              error
            })
          }
        }
      )
    } catch {
      // Error already handled by callback
    }
  }, [slides, canExportSlides])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    state,
    canExport: canExportSlides,
    startExport,
    clearError
  }
}
