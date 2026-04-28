import { EditRequestConfig } from '../types'

export interface EditImageRequest {
  image_base64: string
  instruction: string
  config: EditRequestConfig
}

export interface EditImageResponse {
  success: boolean
  image_base64?: string
  message?: string
}

/**
 * 调用图生图编辑 API
 * Requirements: 7.2
 */
export async function editImage(request: EditImageRequest): Promise<EditImageResponse> {
  const response = await fetch('/api/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `编辑失败: ${response.status}`)
  }

  return response.json()
}
