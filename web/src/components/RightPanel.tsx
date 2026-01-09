import { Slide, ExportFormat } from '../types'
import SlideList from './SlideList'
import ExportButton from './ExportButton'

interface RightPanelProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSlideSelect: (slideId: string) => void
  onSlideEdit?: (slideId: string) => void
  onExport?: (format: ExportFormat) => void
  isExporting?: boolean
  exportProgress?: number
}

/**
 * 右侧面板 - 幻灯片预览区
 * 显示所有生成的幻灯片缩略图列表，支持滚动
 */
function RightPanel({ 
  slides, 
  selectedSlideId, 
  onSlideSelect, 
  onSlideEdit,
  onExport,
  isExporting = false,
  exportProgress = 0
}: RightPanelProps) {
  const canExport = slides.length > 0

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">幻灯片预览</h2>
          <p className="text-sm text-gray-600 mt-1">
            {slides.length > 0 ? `共 ${slides.length} 页` : '暂无幻灯片'}
          </p>
        </div>
        {onExport && (
          <ExportButton
            disabled={!canExport}
            isExporting={isExporting}
            onExport={onExport}
          />
        )}
      </div>

      {/* Export Progress */}
      {isExporting && exportProgress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>导出进度</span>
            <span>{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Slides List - Scrollable Container */}
      <div className="flex-1 overflow-y-auto">
        <SlideList
          slides={slides}
          selectedSlideId={selectedSlideId}
          onSlideSelect={onSlideSelect}
          onSlideEdit={onSlideEdit}
        />
      </div>
    </div>
  )
}

export default RightPanel
