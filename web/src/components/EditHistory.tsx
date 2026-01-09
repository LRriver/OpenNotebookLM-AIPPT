import { EditHistoryItem } from '../types'

interface EditHistoryProps {
  history: EditHistoryItem[]
  onRevert: (historyItem: EditHistoryItem) => void
}

/**
 * 编辑历史组件
 * 显示编辑历史列表，支持点击回退到历史版本
 * Requirements: 8.3, 8.4
 */
function EditHistory({ history, onRevert }: EditHistoryProps) {
  if (history.length === 0) {
    return null
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50" data-testid="edit-history">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        编辑历史 ({history.length} 次修改)
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={`${item.timestamp}-${index}`}
            className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
            data-testid={`history-item-${index}`}
          >
            {/* 缩略图 */}
            <div className="w-16 h-9 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
              <img
                src={
                  item.imageUrl.startsWith('data:')
                    ? item.imageUrl
                    : `data:image/png;base64,${item.imageBase64}`
                }
                alt={`Version ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 修改信息 */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">
                {formatTimestamp(item.timestamp)}
              </p>
              <p
                className="text-sm text-gray-700 truncate"
                title={item.instruction}
              >
                {item.instruction}
              </p>
            </div>

            {/* 回退按钮 */}
            <button
              onClick={() => onRevert(item)}
              className="flex-shrink-0 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="回退到此版本"
              data-testid={`revert-button-${index}`}
            >
              回退
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EditHistory
