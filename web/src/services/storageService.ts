/**
 * StorageService - 封装 localStorage 操作
 * 用于持久化应用状态
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { Slide, ApiConfig, GenerationConfig } from '../types'

/**
 * localStorage 持久化结构
 */
export interface PersistedState {
  version: number
  apiConfig: ApiConfig
  currentProject: {
    fileContent: string
    fileName: string
    slides: Slide[]
    generationConfig: GenerationConfig
  } | null
}

/**
 * 存储键名常量
 */
const STORAGE_KEYS = {
  STATE: 'aippt_persisted_state',
  API_CONFIG: 'aippt_api_config'
} as const

/**
 * 当前持久化版本号
 * 用于处理数据结构升级
 */
const CURRENT_VERSION = 1

/**
 * 默认 API 配置
 */
const DEFAULT_API_CONFIG: ApiConfig = {
  apiKey: '',
  baseUrl: ''
}

/**
 * 默认生成配置
 */
const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  pageCount: 10,
  quality: '1K',
  aspectRatio: '16:9'
}

/**
 * StorageService 类
 * 提供状态持久化的所有操作
 */
export class StorageService {
  /**
   * 保存完整状态到 localStorage
   */
  static saveState(state: PersistedState): boolean {
    try {
      const serialized = JSON.stringify(state)
      localStorage.setItem(STORAGE_KEYS.STATE, serialized)
      return true
    } catch (error) {
      console.error('Failed to save state to localStorage:', error)
      return false
    }
  }

  /**
   * 从 localStorage 加载状态
   */
  static loadState(): PersistedState | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.STATE)
      if (!serialized) {
        return null
      }
      
      const state = JSON.parse(serialized) as PersistedState
      
      // 版本检查和迁移
      if (state.version !== CURRENT_VERSION) {
        return StorageService.migrateState(state)
      }
      
      return state
    } catch (error) {
      console.error('Failed to load state from localStorage:', error)
      return null
    }
  }

  /**
   * 保存项目数据
   */
  static saveProject(
    fileContent: string,
    fileName: string,
    slides: Slide[],
    generationConfig: GenerationConfig
  ): boolean {
    try {
      const currentState = StorageService.loadState()
      const newState: PersistedState = {
        version: CURRENT_VERSION,
        apiConfig: currentState?.apiConfig || DEFAULT_API_CONFIG,
        currentProject: {
          fileContent,
          fileName,
          slides,
          generationConfig
        }
      }
      return StorageService.saveState(newState)
    } catch (error) {
      console.error('Failed to save project:', error)
      return false
    }
  }

  /**
   * 保存 API 配置
   */
  static saveApiConfig(config: ApiConfig): boolean {
    try {
      const currentState = StorageService.loadState()
      const newState: PersistedState = {
        version: CURRENT_VERSION,
        apiConfig: config,
        currentProject: currentState?.currentProject || null
      }
      return StorageService.saveState(newState)
    } catch (error) {
      console.error('Failed to save API config:', error)
      return false
    }
  }

  /**
   * 加载 API 配置
   */
  static loadApiConfig(): ApiConfig {
    const state = StorageService.loadState()
    return state?.apiConfig || DEFAULT_API_CONFIG
  }

  /**
   * 加载项目数据
   */
  static loadProject(): PersistedState['currentProject'] {
    const state = StorageService.loadState()
    return state?.currentProject || null
  }

  /**
   * 清除项目数据（保留 API 配置）
   */
  static clearProject(): boolean {
    try {
      const currentState = StorageService.loadState()
      const newState: PersistedState = {
        version: CURRENT_VERSION,
        apiConfig: currentState?.apiConfig || DEFAULT_API_CONFIG,
        currentProject: null
      }
      return StorageService.saveState(newState)
    } catch (error) {
      console.error('Failed to clear project:', error)
      return false
    }
  }

  /**
   * 清除所有数据
   */
  static clearAll(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEYS.STATE)
      localStorage.removeItem(STORAGE_KEYS.API_CONFIG)
      return true
    } catch (error) {
      console.error('Failed to clear all data:', error)
      return false
    }
  }

  /**
   * 检查是否有保存的项目
   */
  static hasProject(): boolean {
    const state = StorageService.loadState()
    return state?.currentProject !== null && state?.currentProject !== undefined
  }

  /**
   * 检查是否有保存的幻灯片
   */
  static hasSlides(): boolean {
    const project = StorageService.loadProject()
    return project !== null && project.slides.length > 0
  }

  /**
   * 状态迁移（用于版本升级）
   */
  private static migrateState(oldState: PersistedState): PersistedState {
    // 目前只有版本 1，未来可以在这里添加迁移逻辑
    return {
      ...oldState,
      version: CURRENT_VERSION
    }
  }

  /**
   * 获取存储使用情况
   */
  static getStorageInfo(): { used: number; available: boolean } {
    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.STATE) || ''
      return {
        used: new Blob([serialized]).size,
        available: true
      }
    } catch {
      return {
        used: 0,
        available: false
      }
    }
  }
}

/**
 * 导出便捷函数
 */
export const saveState = StorageService.saveState
export const loadState = StorageService.loadState
export const saveProject = StorageService.saveProject
export const saveApiConfig = StorageService.saveApiConfig
export const loadApiConfig = StorageService.loadApiConfig
export const loadProject = StorageService.loadProject
export const clearProject = StorageService.clearProject
export const clearAll = StorageService.clearAll
export const hasProject = StorageService.hasProject
export const hasSlides = StorageService.hasSlides

export default StorageService
