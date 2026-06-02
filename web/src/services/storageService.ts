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

const IMAGE_DB_NAME = 'aippt_slide_images'
const IMAGE_DB_STORE = 'slide_images'
const IMAGE_DB_VERSION = 1

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
 * @internal Used for initializing new projects
 */
const _DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  pageCount: 10,
  quality: '1K',
  aspectRatio: '16:9'
}

// Export for use in other modules if needed
export const DEFAULT_GENERATION_CONFIG = _DEFAULT_GENERATION_CONFIG

interface SlideImageRecord {
  key: string
  imageBase64: string
}

/**
 * StorageService 类
 * 提供状态持久化的所有操作
 */
export class StorageService {
  private static pendingImageSave: Promise<void> | null = null

  private static writeState(state: PersistedState, logError = true): boolean {
    try {
      const serialized = JSON.stringify(state)
      localStorage.setItem(STORAGE_KEYS.STATE, serialized)
      return true
    } catch (error) {
      if (logError) {
        console.error('Failed to save state to localStorage:', error)
      }
      return false
    }
  }

  private static extractBase64(slide: Slide): string {
    if (slide.imageBase64) {
      return slide.imageBase64
    }
    const match = slide.imageUrl?.match(/^data:[^;]+;base64,(.+)$/)
    return match?.[1] || ''
  }

  private static imageKey(fileName: string, slide: Slide): string {
    const projectName = fileName || 'untitled'
    return `${projectName}:${slide.id}`
  }

  private static compactSlides(fileName: string, slides: Slide[]): Slide[] {
    return slides.map(slide => ({
      ...slide,
      imageStorageKey: StorageService.extractBase64(slide)
        ? StorageService.imageKey(fileName, slide)
        : slide.imageStorageKey,
      imageUrl: slide.imageUrl?.startsWith('data:') ? '' : slide.imageUrl,
      imageBase64: undefined
    }))
  }

  private static canUseIndexedDb(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  private static openImageDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!StorageService.canUseIndexedDb()) {
        reject(new Error('IndexedDB is not available'))
        return
      }

      const request = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(IMAGE_DB_STORE)) {
          db.createObjectStore(IMAGE_DB_STORE, { keyPath: 'key' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Failed to open image store'))
    })
  }

  private static saveSlideImages(fileName: string, slides: Slide[]): Promise<void> {
    const records: SlideImageRecord[] = slides
      .map((slide) => ({
        key: StorageService.imageKey(fileName, slide),
        imageBase64: StorageService.extractBase64(slide)
      }))
      .filter((record) => record.imageBase64)

    if (records.length === 0 || !StorageService.canUseIndexedDb()) {
      return Promise.resolve()
    }

    return StorageService.openImageDb().then((db) => new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(IMAGE_DB_STORE, 'readwrite')
      const store = transaction.objectStore(IMAGE_DB_STORE)
      records.forEach((record) => store.put(record))
      transaction.oncomplete = () => {
        db.close()
        resolve()
      }
      transaction.onerror = () => {
        db.close()
        reject(transaction.error || new Error('Failed to save slide images'))
      }
    }))
  }

  private static loadSlideImage(key: string): Promise<string | null> {
    if (!StorageService.canUseIndexedDb()) {
      return Promise.resolve(null)
    }

    return StorageService.openImageDb().then((db) => new Promise<string | null>((resolve, reject) => {
      const transaction = db.transaction(IMAGE_DB_STORE, 'readonly')
      const store = transaction.objectStore(IMAGE_DB_STORE)
      const request = store.get(key)
      request.onsuccess = () => {
        db.close()
        resolve((request.result as SlideImageRecord | undefined)?.imageBase64 || null)
      }
      request.onerror = () => {
        db.close()
        reject(request.error || new Error('Failed to load slide image'))
      }
    })).catch(() => null)
  }

  private static clearImageStore(): void {
    if (!StorageService.canUseIndexedDb()) {
      return
    }
    const request = indexedDB.deleteDatabase(IMAGE_DB_NAME)
    request.onerror = () => {
      console.error('Failed to clear slide image store:', request.error)
    }
  }

  /**
   * 保存完整状态到 localStorage
   */
  static saveState(state: PersistedState): boolean {
    return StorageService.writeState(state)
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
      if (StorageService.writeState(newState, false)) {
        return true
      }

      StorageService.pendingImageSave = StorageService.saveSlideImages(fileName, slides).catch((error) => {
        console.error('Failed to save slide images to IndexedDB:', error)
      })
      const compactState: PersistedState = {
        ...newState,
        currentProject: {
          fileContent,
          fileName,
          slides: StorageService.compactSlides(fileName, slides),
          generationConfig
        }
      }
      return StorageService.writeState(compactState)
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
   * 加载项目数据，并从 IndexedDB 补回超出 localStorage 配额的大图
   */
  static async loadProjectWithImages(): Promise<PersistedState['currentProject']> {
    const project = StorageService.loadProject()
    if (!project) {
      return null
    }

    if (StorageService.pendingImageSave) {
      await StorageService.pendingImageSave
    }

    const slides = await Promise.all(project.slides.map(async (slide) => {
      if (slide.imageBase64 || slide.imageUrl) {
        return slide
      }
      if (!slide.imageStorageKey) {
        return slide
      }
      const imageBase64 = await StorageService.loadSlideImage(slide.imageStorageKey)
      if (!imageBase64) {
        return slide
      }
      return {
        ...slide,
        imageBase64,
        imageUrl: `data:image/png;base64,${imageBase64}`
      }
    }))

    return {
      ...project,
      slides
    }
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
      StorageService.clearImageStore()
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
      StorageService.clearImageStore()
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
export const loadProjectWithImages = StorageService.loadProjectWithImages
export const clearProject = StorageService.clearProject
export const clearAll = StorageService.clearAll
export const hasProject = StorageService.hasProject
export const hasSlides = StorageService.hasSlides

export default StorageService
