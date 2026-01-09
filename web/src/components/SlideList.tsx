import { Slide } from '../types'
import SlideCard from './SlideCard'

interface SlideListProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSlideSelect: (slideId: string) => void
  onSlideEdit?: (slideId: string) => void
}

/**
 * 幻灯片列表组件
 * 垂直滚动列表，显示所有幻灯片缩略图
 */
function SlideList({ slides, selectedSlideId, onSlideSelect, onSlideEdit }: SlideListProps) {
  // 空状态
  if (slides.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          生成幻灯片后将在此处显示
        </p>
      </div>
    )
  }

  return (
    <div 
      className="space-y-4"
      data-testid="slide-list"
      role="list"
      aria-label="幻灯片列表"
    >
      {slides.map((slide) => (
        <SlideCard
          key={slide.id}
          slide={slide}
          isSelected={selectedSlideId === slide.id}
          onSelect={onSlideSelect}
          onEdit={onSlideEdit}
        />
      ))}
    </div>
  )
}

export default SlideList
