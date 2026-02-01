import { useState } from 'react'
import { Slide } from '../types'
import LazyImage from './LazyImage'

interface SlideCardProps {
  slide: Slide
  isSelected: boolean
  onSelect: (slideId: string) => void
  onEdit?: (slideId: string) => void
}

/**
 * 幻灯片卡片组件 - 橙黄主题
 */
function SlideCard({ slide, isSelected, onSelect, onEdit }: SlideCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    onSelect(slide.id)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(slide.id)
    }
  }

  const imageSrc = slide.imageUrl || (slide.imageBase64 ? `data:image/png;base64,${slide.imageBase64}` : null)

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected
          ? 'ring-2 ring-primary-400 shadow-warm-lg scale-[1.02]'
          : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
        }
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`slide-card-${slide.id}`}
      data-selected={isSelected}
    >
      {/* 幻灯片缩略图 */}
      <div className="relative bg-warm-100 aspect-video">
        {imageSrc ? (
          <LazyImage
            src={imageSrc}
            alt={`Slide ${slide.pageNumber}`}
            className="w-full h-full object-contain"
            placeholderClassName="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 bg-warm-200 rounded-xl flex items-center justify-center mx-auto">
                <svg className="h-5 w-5 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-2 text-warm-400 text-xs">加载中...</p>
            </div>
          </div>
        )}

        {/* 页码标签 */}
        <div className="absolute top-2 left-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-sm">
          {slide.pageNumber}
        </div>

        {/* 悬停时显示编辑按钮 */}
        {isHovered && onEdit && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-center justify-center transition-opacity duration-300">
            <button
              onClick={handleEditClick}
              className="bg-white text-warm-800 px-4 py-2 rounded-xl shadow-lg hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 flex items-center gap-2 font-medium"
              data-testid={`edit-button-${slide.id}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              编辑
            </button>
          </div>
        )}

        {/* 选中状态指示器 */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="bg-white text-primary-500 rounded-full p-1 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 幻灯片信息 */}
      <div className="p-3 bg-white border-t border-warm-100">
        <p className="text-xs text-warm-500 line-clamp-2" title={slide.prompt || '无描述'}>
          {slide.prompt || '无描述'}
        </p>
      </div>
    </div>
  )
}

export default SlideCard
