import { useState, useRef, useEffect } from 'react'
import { ExportFormat } from '../types'

interface ExportButtonProps {
  disabled?: boolean
  isExporting?: boolean
  onExport: (format: ExportFormat) => void
}

/**
 * 导出按钮组件 - 橙黄主题
 */
function ExportButton({ disabled = false, isExporting = false, onExport }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: ExportFormat) => {
    setIsOpen(false)
    onExport(format)
  }

  const buttonDisabled = disabled || isExporting

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !buttonDisabled && setIsOpen(!isOpen)}
        disabled={buttonDisabled}
        className={`
          inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
          font-medium text-sm transition-all duration-300
          ${buttonDisabled
            ? 'bg-warm-100 text-warm-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 shadow-warm hover:shadow-warm-lg'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>导出中...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>导出</span>
            <svg className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && !buttonDisabled && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-lg ring-1 ring-warm-200 z-10 overflow-hidden" role="listbox">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-warm-700 hover:bg-primary-50 transition-colors"
              role="option"
            >
              <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-warm-800">PDF 格式</div>
                <div className="text-xs text-warm-500">适合打印和分享</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleExport('pptx')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-warm-700 hover:bg-primary-50 transition-colors"
              role="option"
            >
              <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-warm-800">PPTX 格式</div>
                <div className="text-xs text-warm-500">可在 PowerPoint 中编辑</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportButton
