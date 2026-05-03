import { useState, useRef, useCallback } from 'react'
import { isSupportedDocument, supportedDocumentLabel, supportedDocumentAccept } from '../utils/fileValidation'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface FileUploadProps {
  onFileSelect: (file: File) => Promise<void> | void
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
 */
function FileUpload({
  onFileSelect,
  onError,
  accept = supportedDocumentAccept(),
  maxSizeBytes = 50 * 1024 * 1024,
}: FileUploadProps) {
  const { t } = useUiPreferences()
  const [isDragging, setIsDragging] = useState(false)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!isSupportedDocument(file.name)) {
      return t('upload.invalid', { formats: supportedDocumentLabel() })
    }
    if (file.size > maxSizeBytes) {
      return t('upload.tooLarge', { size: Math.round(maxSizeBytes / 1024 / 1024) })
    }
    return null
  }, [maxSizeBytes, t])

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }
    Promise.resolve(onFileSelect(file))
      .then(() => setFileInfo({ name: file.name, size: file.size }))
      .catch(error => onError(error instanceof Error ? error.message : t('upload.failed')))
  }, [validateFile, onFileSelect, onError, t])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFile])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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
          aippt-dropzone border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging
            ? 'is-dragging scale-[1.02]'
            : ''
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
          if (e.key === 'Enter' || e.key === ' ') handleClick()
        }}
        aria-label={t('upload.aria')}
      >
        {/* 上传图标 */}
        <div className={`
          mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3
          transition-all duration-300
          ${isDragging 
            ? 'bg-gradient-to-br from-primary-400 to-accent-500 shadow-warm' 
            : 'bg-warm-100'
          }
        `}>
          <svg
            className={`h-7 w-7 transition-colors duration-300 ${isDragging ? 'text-white' : 'text-warm-400'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* 提示文字 */}
        <p className={`text-sm font-medium transition-colors duration-300 ${isDragging ? 'text-primary-700' : 'text-warm-600'}`}>
          {isDragging ? t('upload.release') : t('upload.drop')}
        </p>
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          {t('upload.support', { formats: supportedDocumentLabel() })}
        </p>

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
        <div className="mt-3 p-3 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center">
                <svg className="h-5 w-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-warm-800 truncate max-w-[180px]">{fileInfo.name}</p>
                <p className="text-xs text-warm-500">{formatFileSize(fileInfo.size)}</p>
              </div>
            </div>
            <span className="badge-success text-xs">{t('upload.uploaded')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
