import { Slide, ExportFormat } from '../types'
import SlideList from './SlideList'
import ExportButton from './ExportButton'
import { SlideListSkeleton } from './Skeleton'

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
  const canExport = slides.length > 0

  return (
    <div className="h-full flex flex-col p-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-warm-900">幻灯片预览</h2>
            <p className="text-xs text-warm-500">
              {isLoading ? '加载中...' : slides.length > 0 ? `共 ${slides.length} 页` : '暂无幻灯片'}
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

      {/* Export Progress */}
      {isExporting && exportProgress > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-xl border border-primary-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-primary-700 font-medium">导出进度</span>
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

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto">
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
              <p className="text-warm-500 text-sm">上传文件并点击生成</p>
              <p className="text-warm-400 text-xs mt-1">幻灯片将显示在这里</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RightPanel
