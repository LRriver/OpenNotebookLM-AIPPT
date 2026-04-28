import {
  Slide,
  GenerationConfig,
  SSEEventType,
  FullApiConfig,
  DeckOutline,
  ConfirmedSlidePrompt
} from '../types'
import { buildModelProfiles } from './modelProfileService'

/**
 * SSE 事件数据类型
 */
export interface SSEProgressData {
  status: string
  current: number
  total: number
  message: string
}

export interface SSESlideData {
  id: string
  page_number: number
  image_base64: string
  prompt: string
}

export interface SSEErrorData {
  fatal?: boolean
  page?: number
  message: string
}

export interface SSECompleteData {
  status: string
  message: string
}

/**
 * SSE 事件回调接口
 */
export interface SSECallbacks {
  onProgress: (data: SSEProgressData) => void
  onSlide: (slide: Slide) => void
  onComplete: (data: SSECompleteData) => void
  onError: (data: SSEErrorData) => void
}

/**
 * 生成请求配置
 */
export interface GenerateRequestConfig {
  content: string
  fullApiConfig: FullApiConfig
  generationConfig: GenerationConfig
  slidePrompts?: ConfirmedSlidePrompt[]
}

export interface OutlineRequestConfig {
  content: string
  fullApiConfig: FullApiConfig
  generationConfig: GenerationConfig
}

export interface PromptPlanRequestConfig extends OutlineRequestConfig {
  outline: DeckOutline
}

/**
 * 解析 SSE 数据行
 */
function parseSSELine(line: string): { type: SSEEventType; data: unknown } | null {
  if (!line.startsWith('data: ')) {
    return null
  }
  
  try {
    const jsonStr = line.slice(6) // 移除 'data: ' 前缀
    const parsed = JSON.parse(jsonStr)
    return {
      type: parsed.type as SSEEventType,
      data: parsed.data
    }
  } catch (e) {
    console.error('Failed to parse SSE data:', e)
    return null
  }
}

/**
 * 将后端返回的 slide 数据转换为前端 Slide 类型
 */
function convertToSlide(data: SSESlideData): Slide {
  return {
    id: data.id,
    pageNumber: data.page_number,
    imageUrl: `data:image/png;base64,${data.image_base64}`,
    imageBase64: data.image_base64,
    prompt: data.prompt
  }
}

function hasCompleteModelConfig(config: FullApiConfig): boolean {
  const editConfig = config.edit || config.image
  return Boolean(
    config.text.apiKey && config.text.baseUrl &&
    config.image.apiKey && config.image.baseUrl &&
    editConfig.apiKey && editConfig.baseUrl
  )
}

function buildCompleteModelProfiles(config: FullApiConfig) {
  if (!hasCompleteModelConfig(config)) {
    return undefined
  }
  return buildModelProfiles(config)
}

function buildBackendConfig(fullApiConfig: FullApiConfig, generationConfig: GenerationConfig) {
  const modelProfiles = buildCompleteModelProfiles(fullApiConfig)
  return {
    image: {
      api_key: fullApiConfig.image.apiKey,
      base_url: fullApiConfig.image.baseUrl,
      model: fullApiConfig.image.model
    },
    text: {
      api_key: fullApiConfig.text.apiKey,
      base_url: fullApiConfig.text.baseUrl,
      model: fullApiConfig.text.model,
      format: fullApiConfig.text.format,
      thinking_level: fullApiConfig.text.thinkingLevel
    },
    ...(modelProfiles ? { model_profiles: modelProfiles } : {}),
    page_count: generationConfig.pageCount,
    quality: generationConfig.quality,
    aspect_ratio: generationConfig.aspectRatio,
    language: generationConfig.language || '中文',
    style: generationConfig.style || '现代简约商务风格',
    target_audience: generationConfig.targetAudience || '专业人士',
    user_requirements: generationConfig.userRequirements || ''
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.detail || data?.message || `HTTP error! status: ${response.status}`
    throw new Error(message)
  }
  return data as T
}

export async function requestDeckOutline(config: OutlineRequestConfig): Promise<DeckOutline> {
  const data = await postJson<{ success: boolean; outline?: DeckOutline; message?: string }>(
    '/api/generate-outline',
    {
      content: config.content,
      config: buildBackendConfig(config.fullApiConfig, config.generationConfig)
    }
  )
  if (!data.success || !data.outline) {
    throw new Error(data.message || '生成设计大纲失败')
  }
  return data.outline
}

export async function requestSlidePrompts(config: PromptPlanRequestConfig): Promise<ConfirmedSlidePrompt[]> {
  const data = await postJson<{ success: boolean; slide_prompts?: ConfirmedSlidePrompt[]; message?: string }>(
    '/api/generate-prompts',
    {
      content: config.content,
      config: buildBackendConfig(config.fullApiConfig, config.generationConfig),
      outline: config.outline
    }
  )
  if (!data.success || !data.slide_prompts) {
    throw new Error(data.message || '生成逐页设计失败')
  }
  return data.slide_prompts
}

/**
 * 开始 PPT 生成
 * 
 * 使用 fetch API 处理 SSE 流式响应
 * 
 * @param config 生成配置
 * @param callbacks SSE 事件回调
 * @returns AbortController 用于取消请求
 */
export function startGeneration(
  config: GenerateRequestConfig,
  callbacks: SSECallbacks
): AbortController {
  const abortController = new AbortController()
  
  const requestBody = {
    content: config.content,
    config: buildBackendConfig(config.fullApiConfig, config.generationConfig),
    ...(config.slidePrompts ? { slide_prompts: config.slidePrompts } : {})
  }
  
  // 发起请求
  fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify(requestBody),
    signal: abortController.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }
      
      const decoder = new TextDecoder()
      let buffer = ''
      
      let done = false
      while (!done) {
        const result = await reader.read()
        done = result.done
        
        if (done) {
          break
        }
        
        // 解码并添加到缓冲区
        buffer += decoder.decode(result.value, { stream: true })
        
        // 按行处理
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个不完整的行
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          const event = parseSSELine(trimmedLine)
          if (!event) continue
          
          // 根据事件类型调用相应回调
          switch (event.type) {
            case 'progress':
              callbacks.onProgress(event.data as SSEProgressData)
              break
            case 'slide': {
              const slideData = event.data as SSESlideData
              callbacks.onSlide(convertToSlide(slideData))
              break
            }
            case 'complete':
              callbacks.onComplete(event.data as SSECompleteData)
              break
            case 'error':
              callbacks.onError(event.data as SSEErrorData)
              break
          }
        }
      }
      
      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        const event = parseSSELine(buffer.trim())
        if (event) {
          switch (event.type) {
            case 'progress':
              callbacks.onProgress(event.data as SSEProgressData)
              break
            case 'slide': {
              const slideData = event.data as SSESlideData
              callbacks.onSlide(convertToSlide(slideData))
              break
            }
            case 'complete':
              callbacks.onComplete(event.data as SSECompleteData)
              break
            case 'error':
              callbacks.onError(event.data as SSEErrorData)
              break
          }
        }
      }
    })
    .catch((error) => {
      if (error.name === 'AbortError') {
        // 请求被取消，不需要处理
        return
      }
      
      callbacks.onError({
        fatal: true,
        message: `请求失败: ${error.message}`
      })
    })
  
  return abortController
}

/**
 * 取消生成
 */
export function cancelGeneration(abortController: AbortController): void {
  abortController.abort()
}
