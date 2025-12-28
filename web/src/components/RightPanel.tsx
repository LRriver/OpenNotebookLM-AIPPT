import { Slide } from '../types'

interface RightPanelProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSlideSelect: (slideId: string) => void
}

/**
 * 右侧面板 - 幻灯片预览区
 * 显示所有生成的幻灯片缩略图列表，支持滚动
 */
function RightPanel({ slides, selectedSlideId, onSlideSelect }: RightPanelProps) {
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
        {slides.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={`
                  border rounded-lg overflow-hidden cursor-pointer transition-all
                  ${
                    selectedSlideId === slide.id
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
                onClick={() => onSlideSelect(slide.id)}
              >
                {/* Slide Thumbnail */}
                <div className="relative bg-gray-100 aspect-video">
                  {slide.imageUrl || slide.imageBase64 ? (
                    <img
                      src={slide.imageUrl || `data:image/png;base64,${slide.imageBase64}`}
                      alt={`Slide ${slide.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400 text-sm">加载中...</p>
                    </div>
                  )}
                  
                  {/* Page Number Badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    第 {slide.pageNumber} 页
                  </div>
                </div>

                {/* Slide Info */}
                <div className="p-3 bg-white">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {slide.prompt || '无描述'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RightPanel
