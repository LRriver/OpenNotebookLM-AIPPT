/**
 * RestoreSessionDialog 组件 - 恢复会话对话框
 * 
 * Requirements: 10.2
 * 
 * 应用启动时提示用户是否恢复之前的会话
 */

import { RestoredProject } from '../hooks/useStateRestore'

interface RestoreSessionDialogProps {
  isOpen: boolean
  restoredProject: RestoredProject | null
  onRestore: () => void
  onDiscard: () => void
}

/**
 * 恢复会话对话框组件
 */
export function RestoreSessionDialog({
  isOpen,
  restoredProject,
  onRestore,
  onDiscard
}: RestoreSessionDialogProps) {
  if (!isOpen || !restoredProject) {
    return null
  }

  const slideCount = restoredProject.slides.length
  const fileName = restoredProject.fileName || '未命名文件'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onDiscard}
      />

      {/* 对话框 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* 图标 */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
          发现未完成的项目
        </h3>

        {/* 描述 */}
        <p className="text-sm text-gray-600 text-center mb-4">
          检测到您之前有未完成的工作，是否要恢复？
        </p>

        {/* 项目信息 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-gray-400"
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
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">
                {slideCount > 0
                  ? `${slideCount} 张幻灯片`
                  : '尚未生成幻灯片'}
              </p>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            开始新项目
          </button>
          <button
            onClick={onRestore}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            恢复项目
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestoreSessionDialog
