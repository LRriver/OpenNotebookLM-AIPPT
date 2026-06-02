import { EditHistoryItem } from '../types'
import { useUiPreferences } from '../contexts/useUiPreferences'

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
  const { language, t } = useUiPreferences()
  if (history.length === 0) {
    return null
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div
      className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-sm"
      data-testid="edit-history"
    >
      <h3 className="text-base font-semibold text-[var(--text-strong)] mb-3">
        {t('edit.historyTitle', { count: history.length })}
      </h3>
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {history.map((item, index) => (
          <div
            key={`${item.timestamp}-${index}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3 transition-colors hover:border-primary-300 sm:flex-nowrap"
            data-testid={`history-item-${index}`}
          >
            {/* 缩略图 */}
            <div className="w-24 h-14 flex-shrink-0 bg-black/5 rounded-lg overflow-hidden">
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
              <p className="text-xs text-[var(--text-muted)]">{formatTimestamp(item.timestamp)}</p>
              <p
                className="text-sm font-medium text-[var(--text)] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
                title={item.instruction}
              >
                {item.instruction}
              </p>
            </div>

            {/* 回退按钮 */}
            <button
              onClick={() => onRevert(item)}
              className="flex-shrink-0 rounded-lg border border-primary-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
              title={t('edit.revertTitle')}
              data-testid={`revert-button-${index}`}
            >
              {t('edit.revert')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EditHistory
