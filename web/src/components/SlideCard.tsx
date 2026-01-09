import { useState } from 'react'
import { Slide } from '../types'

interface SlideCardProps {
  slide: Slide
  isSelected: boolean
  onSelect: (slideId: string) => void
  onEdit?: (slideId: string) => void
}

/**
 * 幻灯片卡片组件
 * 显示单个幻灯片的缩略图、页码标签
 * 支持选中状态高亮和悬停显示编辑按钮
 */
function SlideCard({ slide, isSelected, onSelect, onEdit }: SlideCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    onSelect(slide.id)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发选中事件
    if (onEdit) {
      onEdit(slide.id)
    }
  }

  // 获取图片源
  const imageSrc = slide.imageUrl || (slide.imageBase64 ? `data:image/png;base64,${slide.imageBase64}` : null)

  return (
    <div
      className={`
        relative border rounded-lg overflow-hidden cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`slide-card-${slide.id}`}
      data-selected={isSelected}
    >
      {/* 幻灯片缩略图 */}
      <div className="relative bg-gray-100 aspect-video">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`Slide ${slide.pageNumber}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-1 text-gray-400 text-xs">加载中...</p>
            </div>
          </div>
        )}

        {/* 页码标签 */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          第 {slide.pageNumber} 页
        </div>

        {/* 悬停时显示编辑按钮 */}
        {isHovered && onEdit && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-200">
            <button
              onClick={handleEditClick}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              data-testid={`edit-button-${slide.id}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              编辑
            </button>
          </div>
        )}

        {/* 选中状态指示器 */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="bg-blue-500 text-white rounded-full p-1">
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 幻灯片信息 */}
      <div className="p-3 bg-white">
        <p className="text-xs text-gray-600 line-clamp-2" title={slide.prompt || '无描述'}>
          {slide.prompt || '无描述'}
        </p>
      </div>
    </div>
  )
}

export default SlideCard
