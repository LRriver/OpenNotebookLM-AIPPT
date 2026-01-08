import { useState } from 'react'
import FileUpload from './FileUpload'
import FilePreview from './FilePreview'

interface LeftPanelProps {
  fileName: string | null
  fileContent: string
  onFileSelect: (file: File) => void
}

/**
 * 左侧面板 - 文件上传区
 * 包含文件拖拽上传区域和文件内容预览
 */
function LeftPanel({ fileName, fileContent, onFileSelect }: LeftPanelProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setUploadError(null)
    onFileSelect(file)
  }

  const handleError = (error: string) => {
    setUploadError(error)
  }

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">上传文件</h2>

      {/* File Upload Component */}
      <FileUpload
        onFileSelect={handleFileSelect}
        onError={handleError}
      />

      {/* Error Message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* File Content Preview */}
      {fileContent && (
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
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
