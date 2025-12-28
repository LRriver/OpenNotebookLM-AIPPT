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
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">上传文件</h2>

      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <p className="mt-2 text-sm text-gray-600">
          点击或拖拽 Markdown 文件到此处
        </p>
        <p className="mt-1 text-xs text-gray-500">仅支持 .md 文件</p>
        <input
          id="file-input"
          type="file"
          accept=".md"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* File Info */}
      {fileName && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">已上传文件</p>
          <p className="text-sm text-blue-700 mt-1 truncate">{fileName}</p>
        </div>
      )}

      {/* File Content Preview */}
      {fileContent && (
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium text-gray-700 mb-2">文件预览</h3>
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
              {fileContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeftPanel
