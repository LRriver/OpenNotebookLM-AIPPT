/**
 * useStateRestore Hook - 应用启动时恢复状态
 * 
 * Requirements: 10.2
 * 
 * 从 localStorage 恢复之前的会话状态
 */

import { useEffect, useState, useCallback } from 'react'
import { StorageService } from '../services/storageService'
import { Slide, GenerationConfig } from '../types'

/**
 * 恢复的项目数据
 */
export interface RestoredProject {
  fileContent: string
  fileName: string
  slides: Slide[]
  generationConfig: GenerationConfig
}

/**
 * 状态恢复 Hook 返回值
 */
interface UseStateRestoreReturn {
  isRestoring: boolean
  hasRestoredData: boolean
  restoredProject: RestoredProject | null
  restoreProject: () => RestoredProject | null
  dismissRestore: () => void
}

/**
 * 状态恢复 Hook
 * 
 * 应用启动时检查 localStorage 并恢复之前的会话状态
 */
export function useStateRestore(): UseStateRestoreReturn {
  const [isRestoring, setIsRestoring] = useState(true)
  const [hasRestoredData, setHasRestoredData] = useState(false)
  const [restoredProject, setRestoredProject] = useState<RestoredProject | null>(null)

  /**
   * 检查并加载保存的状态
   */
  useEffect(() => {
    const checkSavedState = () => {
      setIsRestoring(true)
      
      try {
        const savedState = StorageService.loadState()
        
        if (savedState?.currentProject) {
          const project = savedState.currentProject
          
          // 验证数据完整性
          if (project.fileContent || project.slides.length > 0) {
            setRestoredProject({
              fileContent: project.fileContent,
              fileName: project.fileName,
              slides: project.slides,
              generationConfig: project.generationConfig
            })
            setHasRestoredData(true)
          }
        }
      } catch (error) {
        console.error('Failed to restore state:', error)
      } finally {
        setIsRestoring(false)
      }
    }

    checkSavedState()
  }, [])

  /**
   * 恢复项目数据
   */
  const restoreProject = useCallback((): RestoredProject | null => {
    if (!restoredProject) {
      return null
    }
    
    // 返回恢复的数据
    return restoredProject
  }, [restoredProject])

  /**
   * 放弃恢复（清除恢复数据但不清除 localStorage）
   */
  const dismissRestore = useCallback(() => {
    setRestoredProject(null)
    setHasRestoredData(false)
  }, [])

  return {
    isRestoring,
    hasRestoredData,
    restoredProject,
    restoreProject,
    dismissRestore
  }
}

/**
 * 检查是否有可恢复的数据（静态方法）
 */
export function checkHasRestoredData(): boolean {
  return StorageService.hasProject()
}

/**
 * 直接加载保存的项目（静态方法）
 */
export function loadSavedProject(): RestoredProject | null {
  const project = StorageService.loadProject()
  
  if (!project) {
    return null
  }

  return {
    fileContent: project.fileContent,
    fileName: project.fileName,
    slides: project.slides,
    generationConfig: project.generationConfig
  }
}

export default useStateRestore
