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
 * 图像模型 API 配置
 */
export interface ImageApiConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * 文本模型 API 配置
 */
export interface TextApiConfig {
  apiKey: string
  baseUrl: string
  model: string
  format: 'gemini' | 'openai'
  thinkingLevel?: 'low' | 'high' | null
}

/**
 * 完整 API 配置（包含图像和文本模型）
 */
export interface FullApiConfig {
  image: ImageApiConfig
  text: TextApiConfig
}

/**
 * API 配置（向后兼容）
 * @deprecated 使用 FullApiConfig 代替
 */
export interface ApiConfig {
  apiKey: string
  baseUrl: string
}

/**
 * PPT 内容配置
 */
export interface PptContentConfig {
  language: string
  style: string
  targetAudience: string
}

/**
 * 生成配置
 */
export interface GenerationConfig {
  pageCount: number
  quality: '1K' | '2K' | '4K'
  aspectRatio: '16:9' | '4:3'
  // PPT 内容配置
  language?: string
  style?: string
  targetAudience?: string
}

/**
 * 应用全局状态
 */
export interface AppState {
  // 文件状态
  uploadedFile: File | null
  fileContent: string
  fileName: string

  // API 配置（完整版）
  fullApiConfig: FullApiConfig
  
  // API 配置（向后兼容）
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
  fullApiConfig?: FullApiConfig
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
  // 图像模型配置
  image_api_key: string
  image_base_url: string
  image_model: string
  // 文本模型配置
  text_api_key: string
  text_base_url: string
  text_model: string
  text_format: string
  text_thinking_level?: string | null
  // 生成参数
  page_count: number
  quality: string
  aspect_ratio: string
  // PPT 内容配置
  language?: string
  style?: string
  target_audience?: string
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
