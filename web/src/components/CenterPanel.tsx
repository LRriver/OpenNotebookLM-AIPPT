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
        <div className="flex-1 p-5 overflow-y-auto">
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
        <div className="flex-1 p-5 overflow-y-auto">
          {/* Section Header */}
          <div className="flex items-center space-x-2 mb-5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-warm-900">生成设置</h2>
              <p className="text-xs text-warm-500">配置 API 和生成参数</p>
            </div>
          </div>

          {/* 设置表单区域 */}
          <div className="space-y-5">
            {children || (
              <div className="border-2 border-dashed border-warm-200 rounded-xl p-8 text-center bg-warm-50/50">
                <div className="w-12 h-12 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-warm-500 text-sm">设置表单将在后续任务中实现</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CenterPanel
