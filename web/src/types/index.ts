/**
 * 幻灯片数据结构
 */
export interface Slide {
  id: string
  pageNumber: number
  imageUrl: string
  imageBase64?: string
  prompt: string
}

/**
 * 编辑历史记录项
 */
export interface EditHistoryItem {
  imageUrl: string
  imageBase64: string
  instruction: string
  timestamp: number
}

/**
 * 编辑会话状态
 */
export interface EditSession {
  slideId: string
  originalImage: string
  currentImage: string
  history: EditHistoryItem[]
  userInput: string
}

/**
 * API 配置
 */
export interface ApiConfig {
  apiKey: string
  baseUrl: string
}

/**
 * 生成配置
 */
export interface GenerationConfig {
  pageCount: number
  quality: '1K' | '2K' | '4K'
  aspectRatio: '16:9' | '4:3'
}

/**
 * 应用全局状态
 */
export interface AppState {
  // 文件状态
  uploadedFile: File | null
  fileContent: string
  fileName: string

  // API 配置
  apiConfig: ApiConfig

  // 生成配置
  generationConfig: GenerationConfig

  // 生成状态
  slides: Slide[]
  isGenerating: boolean
  generationProgress: number
  generationError: string | null

  // 编辑状态
  editingSlide: EditSession | null
  selectedSlideId: string | null
}

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
 * 生成请求配置
 */
export interface GenerationRequestConfig {
  api_key: string
  base_url: string
  page_count: number
  quality: string
  aspect_ratio: string
}

/**
 * 编辑请求配置
 */
export interface EditRequestConfig {
  api_key: string
  base_url: string
  quality: string
  aspect_ratio: string
}

/**
 * SSE 事件类型
 */
export type SSEEventType = 'progress' | 'slide' | 'complete' | 'error'

/**
 * SSE 事件数据
 */
export interface SSEEvent {
  type: SSEEventType
  data: unknown
}

/**
 * 导出格式
 */
export type ExportFormat = 'pdf' | 'pptx'
