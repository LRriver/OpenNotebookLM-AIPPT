import { useState, useCallback } from 'react'
import { EditSession, EditHistoryItem } from '../types'
import EditHistory from './EditHistory'

interface EditPanelProps {
  editSession: EditSession
  isEditing: boolean
  onSubmit: (instruction: string) => void
  onConfirm: () => void
  onCancel: () => void
  onRevertToVersion: (historyItem: EditHistoryItem) => void
}

/**
 * 编辑面板组件
 * 显示当前编辑的图片、修改指令输入框、提交和取消按钮
 * Requirements: 7.1, 7.2
 */
function EditPanel({
  editSession,
  isEditing,
  onSubmit,
  onConfirm,
  onCancel,
  onRevertToVersion
}: EditPanelProps) {
  const [instruction, setInstruction] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (instruction.trim() && !isEditing) {
      onSubmit(instruction.trim())
      setInstruction('')
    }
  }, [instruction, isEditing, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (instruction.trim() && !isEditing) {
        onSubmit(instruction.trim())
        setInstruction('')
      }
    }
  }, [instruction, isEditing, onSubmit])

  // 获取当前显示的图片
  const currentImageSrc = editSession.currentImage.startsWith('data:')
    ? editSession.currentImage
    : `data:image/png;base64,${editSession.currentImage}`

  // 获取原始图片
  const originalImageSrc = editSession.originalImage.startsWith('data:')
    ? editSession.originalImage
    : `data:image/png;base64,${editSession.originalImage}`

  const hasChanges = editSession.history.length > 0

  return (
    <div className="flex flex-col h-full" data-testid="edit-panel">
      {/* 标题区域 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">编辑幻灯片</h2>
        <p className="text-sm text-gray-600 mt-1">
          输入修改指令，AI 将根据指令修改图片
        </p>
      </div>

      {/* 图片对比区域 */}
      <div className="flex gap-4 mb-4">
        {/* 原始图片 */}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-2 text-center">原始图片</p>
          <div className="border rounded-lg overflow-hidden bg-gray-100 aspect-video">
            <img
              src={originalImageSrc}
              alt="Original slide"
              className="w-full h-full object-contain"
              data-testid="original-image"
            />
          </div>
        </div>

        {/* 当前图片 */}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-2 text-center">
            {hasChanges ? '当前版本' : '原始图片'}
          </p>
          <div className="border rounded-lg overflow-hidden bg-gray-100 aspect-video relative">
            <img
              src={currentImageSrc}
              alt="Current slide"
              className="w-full h-full object-contain"
              data-testid="current-image"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>正在生成...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 编辑历史 */}
      {editSession.history.length > 0 && (
        <div className="mb-4">
          <EditHistory
            history={editSession.history}
            onRevert={onRevertToVersion}
          />
        </div>
      )}

      {/* 修改指令输入区域 */}
      <form onSubmit={handleSubmit} className="mb-4">
        <label
          htmlFor="edit-instruction"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          修改指令
        </label>
        <div className="flex gap-2">
          <textarea
            id="edit-instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：将背景颜色改为蓝色、添加公司 logo、调整文字大小..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={isEditing}
            data-testid="edit-instruction-input"
          />
        </div>
        <button
          type="submit"
          disabled={!instruction.trim() || isEditing}
          className={`
            mt-2 w-full px-4 py-2 rounded-lg font-medium transition-colors
            ${!instruction.trim() || isEditing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
          data-testid="submit-edit-button"
        >
          {isEditing ? '正在生成...' : '提交修改'}
        </button>
      </form>

      {/* 确认/取消按钮 */}
      <div className="flex gap-3 mt-auto pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={isEditing}
          className={`
            flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium transition-colors
            ${isEditing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
          data-testid="cancel-edit-button"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={isEditing || !hasChanges}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-colors
            ${isEditing || !hasChanges
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
            }
          `}
          data-testid="confirm-edit-button"
        >
          确认修改
        </button>
      </div>
    </div>
  )
}

export default EditPanel
