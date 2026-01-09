import { Slide } from '../types'
import SlideList from './SlideList'

interface RightPanelProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSlideSelect: (slideId: string) => void
  onSlideEdit?: (slideId: string) => void
}

/**
 * 右侧面板 - 幻灯片预览区
 * 显示所有生成的幻灯片缩略图列表，支持滚动
 */
function RightPanel({ slides, selectedSlideId, onSlideSelect, onSlideEdit }: RightPanelProps) {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">幻灯片预览</h2>
        <p className="text-sm text-gray-600 mt-1">
          {slides.length > 0 ? `共 ${slides.length} 页` : '暂无幻灯片'}
        </p>
      </div>

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
