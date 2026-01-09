import { Slide, ExportFormat } from '../types'

/**
 * 导出请求配置
 */
export interface ExportRequestConfig {
  slides: Slide[]
  format: ExportFormat
}

/**
 * 导出进度回调
 */
export interface ExportCallbacks {
  onStart?: () => void
  onProgress?: (progress: number) => void
  onComplete?: (filename: string) => void
  onError?: (error: string) => void
}

/**
 * 获取文件扩展名对应的 MIME 类型
 */
function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    default:
      return 'application/octet-stream'
  }
}

/**
 * 获取默认文件名
 */
function getDefaultFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `presentation_${timestamp}.${format}`
}

/**
 * 导出演示文稿
 * 
 * @param config 导出配置
 * @param callbacks 回调函数
 * @returns Promise<void>
 */
export async function exportPresentation(
  config: ExportRequestConfig,
  callbacks?: ExportCallbacks
): Promise<void> {
  const { slides, format } = config

  // 验证输入
  if (!slides || slides.length === 0) {
    callbacks?.onError?.('没有可导出的幻灯片')
    throw new Error('没有可导出的幻灯片')
  }

  callbacks?.onStart?.()
  callbacks?.onProgress?.(10)

  try {
    // 构建请求体
    const requestBody = {
      slides: slides.map(slide => ({
        image_base64: slide.imageBase64 || extractBase64FromDataUrl(slide.imageUrl)
      })),
      format
    }

    callbacks?.onProgress?.(30)

    // 发起请求
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    callbacks?.onProgress?.(70)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '导出失败' }))
      throw new Error(errorData.detail || `导出失败: ${response.status}`)
    }

    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = getDefaultFilename(format)
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    callbacks?.onProgress?.(90)

    // 下载文件
    const blob = await response.blob()
    downloadBlob(blob, filename, getMimeType(format))

    callbacks?.onProgress?.(100)
    callbacks?.onComplete?.(filename)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '导出失败'
    callbacks?.onError?.(errorMessage)
    throw error
  }
}

/**
 * 从 Data URL 中提取 Base64 数据
 */
function extractBase64FromDataUrl(dataUrl: string): string {
  if (!dataUrl) return ''
  
  // 如果已经是纯 base64，直接返回
  if (!dataUrl.startsWith('data:')) {
    return dataUrl
  }
  
  // 提取 base64 部分
  const base64Match = dataUrl.match(/^data:[^;]+;base64,(.+)$/)
  return base64Match ? base64Match[1] : dataUrl
}

/**
 * 下载 Blob 文件
 */
function downloadBlob(blob: Blob, filename: string, mimeType: string): void {
  // 创建 Blob URL
  const blobWithType = new Blob([blob], { type: mimeType })
  const url = URL.createObjectURL(blobWithType)

  // 创建下载链接
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  // 触发下载
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 验证幻灯片是否可以导出
 */
export function canExport(slides: Slide[]): boolean {
  return slides.length > 0 && slides.every(slide => 
    slide.imageUrl || slide.imageBase64
  )
}
