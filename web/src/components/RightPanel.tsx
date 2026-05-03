import { Slide, ExportFormat } from '../types'
import SlideList from './SlideList'
import ExportButton from './ExportButton'
import { SlideListSkeleton } from './Skeleton'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface RightPanelProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSlideSelect: (slideId: string) => void
  onSlideEdit?: (slideId: string) => void
  onExport?: (format: ExportFormat) => void
  isExporting?: boolean
  exportProgress?: number
  isLoading?: boolean
}

/**
 * 右侧面板 - 幻灯片预览区
 */
function RightPanel({ 
  slides, 
  selectedSlideId, 
  onSlideSelect, 
  onSlideEdit,
  onExport,
  isExporting = false,
  exportProgress = 0,
  isLoading = false
}: RightPanelProps) {
  const { t } = useUiPreferences()
  const canExport = slides.length > 0
  const selectedSlide = slides.find(slide => slide.id === selectedSlideId) || slides[0]

  return (
    <div className="h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-strong)]">{t('right.title')}</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isLoading
                ? t('right.subtitle.loading')
                : slides.length > 0
                  ? t('right.subtitle.pages', { count: slides.length })
                  : t('right.subtitle.empty')}
            </p>
          </div>
        </div>
        {onExport && (
          <ExportButton
            disabled={!canExport || isLoading}
            isExporting={isExporting}
            onExport={onExport}
          />
        )}
      </div>

      {isExporting && exportProgress > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-xl border border-primary-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-primary-700 font-medium">{t('right.exportProgress')}</span>
            <span className="text-primary-600">{exportProgress}%</span>
          </div>
          <div className="w-full bg-primary-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {selectedSlide && (
        <div className="mb-4">
          <div className="aspect-video bg-stone-950 rounded-lg overflow-hidden border border-stone-200">
            <img
              src={selectedSlide.imageUrl}
              alt={`Slide ${selectedSlide.pageNumber}`}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900">{t('right.currentPage', { page: selectedSlide.pageNumber })}</p>
              <p className="text-xs text-stone-500 line-clamp-2">{selectedSlide.prompt}</p>
            </div>
            {onSlideEdit && (
              <button
                type="button"
                onClick={() => onSlideEdit(selectedSlide.id)}
                className="shrink-0 px-3 py-2 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors"
              >
                {t('right.editCurrent')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 pt-3 border-t border-stone-200">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{t('right.thumbnails')}</span>
        <span className="text-xs text-stone-400">{t('right.pageCount', { count: slides.length })}</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <SlideListSkeleton count={3} />
        ) : slides.length > 0 ? (
          <SlideList
            slides={slides}
            selectedSlideId={selectedSlideId}
            onSlideSelect={onSlideSelect}
            onSlideEdit={onSlideEdit}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-warm-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-warm-500 text-sm">{t('right.emptyTitle')}</p>
              <p className="text-warm-400 text-xs mt-1">{t('right.emptySubtitle')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RightPanel
