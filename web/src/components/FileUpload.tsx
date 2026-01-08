import { useState, useRef, useCallback } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onError: (error: string) => void
  accept?: string
  maxSizeBytes?: number
}

interface FileInfo {
  name: string
  size: number
}

/**
 * 文件上传组件
 * 支持点击和拖拽上传，文件类型验证（仅 .md）
 * 
 * Requirements: 2.1, 2.3
 */
function FileUpload({
  onFileSelect,
  onError,
  accept = '.md',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 验证文件类型
   * Property 1: File Upload Validation - validates .md extension
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.md')) {
      return '仅支持 .md 文件格式'
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `文件大小超过限制 (最大 ${Math.round(maxSizeBytes / 1024 / 1024)}MB)`
    }

    return null
  }, [maxSizeBytes])

  /**
   * 处理文件选择
   */
  const handleFile = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }

    setFileInfo({
      name: file.name,
      size: file.size,
    })
    onFileSelect(file)
  }, [validateFile, onFileSelect, onError])

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  /**
   * 处理文件拖放
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  /**
   * 处理点击上传区域
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      {/* 拖拽上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-gray-100'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick()
          }
        }}
        aria-label="点击或拖拽上传 Markdown 文件"
      >
        {/* 上传图标 */}
        <svg
          className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* 提示文字 */}
        <p className={`mt-2 text-sm ${isDragging ? 'text-blue-600' : 'text-gray-600'}`}>
          {isDragging ? '释放文件以上传' : '点击或拖拽 Markdown 文件到此处'}
        </p>
        <p className="mt-1 text-xs text-gray-500">仅支持 .md 文件</p>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileInputChange}
          aria-hidden="true"
        />
      </div>

      {/* 文件信息显示 */}
      {fileInfo && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 truncate max-w-[200px]">
                  {fileInfo.name}
                </p>
                <p className="text-xs text-blue-700">
                  {formatFileSize(fileInfo.size)}
                </p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">已上传</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload

/**
 * 导出验证函数供测试使用
 */
export function validateMarkdownFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.md')
}
