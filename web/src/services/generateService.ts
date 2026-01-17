import { Slide, GenerationConfig, SSEEventType, FullApiConfig } from '../types'

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
  
  // 构建请求体 - 使用完整的 API 配置
  const requestBody = {
    content: config.content,
    config: {
      // 图像模型配置
      image: {
        api_key: config.fullApiConfig.image.apiKey,
        base_url: config.fullApiConfig.image.baseUrl,
        model: config.fullApiConfig.image.model
      },
      // 文本模型配置
      text: {
        api_key: config.fullApiConfig.text.apiKey,
        base_url: config.fullApiConfig.text.baseUrl,
        model: config.fullApiConfig.text.model,
        format: config.fullApiConfig.text.format,
        thinking_level: config.fullApiConfig.text.thinkingLevel
      },
      // 生成参数
      page_count: config.generationConfig.pageCount,
      quality: config.generationConfig.quality,
      aspect_ratio: config.generationConfig.aspectRatio,
      // PPT 内容配置
      language: config.generationConfig.language || '中文',
      style: config.generationConfig.style || '现代简约商务风格',
      target_audience: config.generationConfig.targetAudience || '专业人士'
    }
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
