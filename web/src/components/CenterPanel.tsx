import { EditSession, EditHistoryItem } from '../types'
import EditPanel from './EditPanel'

interface CenterPanelProps {
  isEditMode: boolean
  editSession: EditSession | null
  isEditing?: boolean
  onEditSubmit?: (instruction: string) => void
  onEditConfirm?: () => void
  onEditCancel?: () => void
  onRevertToVersion?: (historyItem: EditHistoryItem) => void
  children?: React.ReactNode
}

/**
 * 中间面板 - 设置和编辑区
 * 根据是否处于编辑模式显示不同内容：
 * - 非编辑模式：显示设置表单
 * - 编辑模式：显示图片编辑界面
 */
function CenterPanel({
  isEditMode,
  editSession,
  isEditing = false,
  onEditSubmit,
  onEditConfirm,
  onEditCancel,
  onRevertToVersion,
  children
}: CenterPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {isEditMode && editSession ? (
        // 编辑模式
        <div className="flex-1 p-6 overflow-y-auto">
          <EditPanel
            editSession={editSession}
            isEditing={isEditing}
            onSubmit={onEditSubmit || (() => {})}
            onConfirm={onEditConfirm || (() => {})}
            onCancel={onEditCancel || (() => {})}
            onRevertToVersion={onRevertToVersion || (() => {})}
          />
        </div>
      ) : (
        // 设置模式
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">生成设置</h2>
            <p className="text-sm text-gray-600 mt-1">
              配置 API 和生成参数
            </p>
          </div>

          {/* 设置表单区域 - 传入的 children 将显示在这里 */}
          <div className="space-y-6">
            {children || (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">设置表单将在后续任务中实现</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CenterPanel
