import { useState } from 'react'
import FileUpload from './FileUpload'
import FilePreview from './FilePreview'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface LeftPanelProps {
  fileName: string | null
  fileContent: string
  onFileSelect: (file: File) => Promise<void> | void
}

/**
 * 左侧面板 - 文件上传区
 * 包含文件拖拽上传区域和文件内容预览
 */
function LeftPanel({ fileName, fileContent, onFileSelect }: LeftPanelProps) {
  const { t } = useUiPreferences()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setUploadError(null)
    return onFileSelect(file)
  }

  const handleError = (error: string) => {
    setUploadError(error)
  }

  return (
    <div className="h-full flex flex-col p-5 lg:p-6">
      {/* Section Header */}
      <div className="mb-5 flex items-center space-x-3">
        <div className="aippt-section-icon aippt-section-icon-warm !h-10 !w-10">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-[var(--text-strong)]">{t('left.title')}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t('left.subtitle')}</p>
        </div>
      </div>

      {/* File Upload Component */}
      <FileUpload
        onFileSelect={handleFileSelect}
        onError={handleError}
      />

      {/* Error Message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="h-3 w-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* File Content Preview */}
      {fileContent && (
        <div className="mt-5 flex-1 overflow-hidden flex flex-col">
          <div className="mb-3 flex items-center space-x-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--text)]">{t('left.loaded')}</span>
          </div>
          <FilePreview
            fileName={fileName || ''}
            content={fileContent}
          />
        </div>
      )}
    </div>
  )
}

export default LeftPanel
