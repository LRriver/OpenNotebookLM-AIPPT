import { EditSession } from '../types'

interface CenterPanelProps {
  isEditMode: boolean
  editSession: EditSession | null
  children?: React.ReactNode
}

/**
 * 中间面板 - 设置和编辑区
 * 根据是否处于编辑模式显示不同内容：
 * - 非编辑模式：显示设置表单
 * - 编辑模式：显示图片编辑界面
 */
function CenterPanel({ isEditMode, editSession, children }: CenterPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {isEditMode && editSession ? (
        // 编辑模式
        <div className="flex-1 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">编辑幻灯片</h2>
            <p className="text-sm text-gray-600 mt-1">
              对当前幻灯片进行修改
            </p>
          </div>

          {/* 编辑区域占位 - 将在后续任务中实现 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">编辑功能将在后续任务中实现</p>
            <p className="text-sm text-gray-400 mt-2">
              Slide ID: {editSession.slideId}
            </p>
          </div>
        </div>
      ) : (
        // 设置模式
        <div className="flex-1 p-6">
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
