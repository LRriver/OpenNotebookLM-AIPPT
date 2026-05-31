export interface UploadDocumentResponse {
  success: boolean
  content: string
  filename: string
  file_size?: number
  message?: string
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `上传失败: ${response.status}`)
  }

  return response.json()
}
