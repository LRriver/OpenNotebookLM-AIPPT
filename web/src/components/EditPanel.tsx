import { useState, useCallback } from 'react'
import { EditSession, EditHistoryItem } from '../types'
import EditHistory from './EditHistory'
import ImageLightbox from './ImageLightbox'
import { useUiPreferences } from '../contexts/useUiPreferences'

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
  onRevertToVersion,
}: EditPanelProps) {
  const { t } = useUiPreferences()
  const [instruction, setInstruction] = useState('')
  const [previewImage, setPreviewImage] = useState<{
    src: string
    alt: string
    downloadName: string
  } | null>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (instruction.trim() && !isEditing) {
        onSubmit(instruction.trim())
        setInstruction('')
      }
    },
    [instruction, isEditing, onSubmit]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (instruction.trim() && !isEditing) {
          onSubmit(instruction.trim())
          setInstruction('')
        }
      }
    },
    [instruction, isEditing, onSubmit]
  )

  // 获取当前显示的图片
  const currentImageSrc = editSession.currentImage.startsWith('data:')
    ? editSession.currentImage
    : `data:image/png;base64,${editSession.currentImage}`

  // 获取原始图片
  const originalImageSrc = editSession.originalImage.startsWith('data:')
    ? editSession.originalImage
    : `data:image/png;base64,${editSession.originalImage}`

  const hasChanges = editSession.history.length > 0
  const shouldShowResult = hasChanges || isEditing

  return (
    <div className="flex flex-col h-full" data-testid="edit-panel">
      {/* 标题区域 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-strong)]">{t('edit.title')}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t('edit.subtitle')}</p>
      </div>

      {/* 图片审阅区域 */}
      <div className="space-y-5 mb-4">
        {/* 原始图片 */}
        <div>
          <p className="text-sm font-semibold text-[var(--text)] mb-3 text-center">
            {t('edit.original')}
          </p>
          <button
            type="button"
            onClick={() =>
              setPreviewImage({
                src: originalImageSrc,
                alt: t('edit.original'),
                downloadName: 'slide-original.png',
              })
            }
            className="group w-full overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            data-testid="original-image-open"
          >
            <span className="relative block aspect-video">
              <img
                src={originalImageSrc}
                alt="Original slide"
                className="w-full h-full object-contain"
                data-testid="original-image"
              />
              <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus:opacity-100">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V5a1 1 0 011-1h3m8 0h3a1 1 0 011 1v3M4 16v3a1 1 0 001 1h3m8 0h3a1 1 0 001-1v-3"
                  />
                </svg>
              </span>
            </span>
          </button>
        </div>

        {/* 生成结果 */}
        {shouldShowResult && (
          <div>
            <p className="text-sm font-semibold text-[var(--text)] mb-3 text-center">
              {t('edit.result')}
            </p>
            <button
              type="button"
              onClick={() =>
                setPreviewImage({
                  src: currentImageSrc,
                  alt: t('edit.result'),
                  downloadName: 'slide-edited.png',
                })
              }
              disabled={isEditing && !hasChanges}
              className="group w-full overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-wait"
              data-testid="current-image-open"
            >
              <span className="relative block aspect-video">
                <img
                  src={currentImageSrc}
                  alt="Current slide"
                  className="w-full h-full object-contain"
                  data-testid="current-image"
                />
                <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus:opacity-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V5a1 1 0 011-1h3m8 0h3a1 1 0 011 1v3M4 16v3a1 1 0 001 1h3m8 0h3a1 1 0 001-1v-3"
                    />
                  </svg>
                </span>
                {isEditing && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="flex items-center gap-2 text-white">
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
                      <span>{t('edit.generating')}</span>
                    </span>
                  </span>
                )}
              </span>
            </button>
            {hasChanges && (
              <p className="mt-2 text-xs text-[var(--text-muted)] text-center">
                {t('edit.resultHint')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 修改指令输入区域 */}
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="edit-instruction"
            className="block text-sm font-semibold text-[var(--text)] mb-2"
          >
            {t('edit.instruction')}
          </label>
          <textarea
            id="edit-instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('edit.placeholder')}
            className="input-field min-h-[7.5rem] resize-y"
            rows={4}
            disabled={isEditing}
            data-testid="edit-instruction-input"
          />
          <button
            type="submit"
            disabled={!instruction.trim() || isEditing}
            className="btn-primary mt-3 w-full"
            data-testid="submit-edit-button"
          >
            {isEditing ? t('edit.generating') : t('edit.submit')}
          </button>
        </form>

        {/* 编辑历史 */}
        {editSession.history.length > 0 && (
          <EditHistory history={editSession.history} onRevert={onRevertToVersion} />
        )}
      </div>

      {/* 确认/取消按钮 */}
      <div className="flex gap-3 mt-auto pt-4 border-t border-[var(--border-soft)]">
        <button
          onClick={onCancel}
          disabled={isEditing}
          className="btn-secondary flex-1"
          data-testid="cancel-edit-button"
        >
          {t('edit.cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={isEditing || !hasChanges}
          className={`
            flex-1 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300
            ${
              isEditing || !hasChanges
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }
          `}
          data-testid="confirm-edit-button"
        >
          {t('edit.confirm')}
        </button>
      </div>

      {previewImage && (
        <ImageLightbox
          isOpen={Boolean(previewImage)}
          src={previewImage.src}
          alt={previewImage.alt}
          downloadName={previewImage.downloadName}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}

export default EditPanel
