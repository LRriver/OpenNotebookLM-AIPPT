import { useState, useEffect } from 'react'
import { GenerationConfig } from '../types'
import { 
  validatePageCount, 
  validateGenerationConfig 
} from '../utils/validation'

// Re-export for backward compatibility
export { validatePageCount, validateGenerationConfig }

interface GenerationConfigFormProps {
  onConfigChange?: (config: GenerationConfig) => void
  initialConfig?: GenerationConfig
}

/**
 * 默认生成配置
 */
export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  pageCount: 10,
  quality: '1K',
  aspectRatio: '16:9'
}

/**
 * 生成配置表单组件
 * - 页数选择器（1-20）
 * - 清晰度选择（1K/2K/4K，默认1K）
 * - 比例选择（16:9/4:3，默认16:9）
 */
function GenerationConfigForm({ onConfigChange, initialConfig }: GenerationConfigFormProps) {
  const [config, setConfig] = useState<GenerationConfig>(
    initialConfig || DEFAULT_GENERATION_CONFIG
  )
  
  const [errors, setErrors] = useState<{ pageCount?: string }>({})
  const [pageCountInput, setPageCountInput] = useState<string>(
    String(initialConfig?.pageCount || DEFAULT_GENERATION_CONFIG.pageCount)
  )

  // 当配置变化时通知父组件
  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setPageCountInput(inputValue)
    
    // 允许空输入（用户正在输入）
    if (inputValue === '') {
      setErrors({ pageCount: '页数不能为空' })
      return
    }
    
    const numValue = parseInt(inputValue, 10)
    const validation = validatePageCount(numValue)
    
    if (!validation.isValid) {
      setErrors({ pageCount: validation.error })
    } else {
      setErrors({})
      setConfig(prev => ({ ...prev, pageCount: numValue }))
    }
  }

  const handleQualityChange = (quality: '1K' | '2K' | '4K') => {
    setConfig(prev => ({ ...prev, quality }))
  }

  const handleAspectRatioChange = (aspectRatio: '16:9' | '4:3') => {
    setConfig(prev => ({ ...prev, aspectRatio }))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">生成参数</h3>
      
      {/* 页数选择器 */}
      <div>
        <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700 mb-1">
          页数 (1-20)
        </label>
        <input
          type="number"
          id="pageCount"
          name="pageCount"
          min={1}
          max={20}
          value={pageCountInput}
          onChange={handlePageCountChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.pageCount ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.pageCount && (
          <p className="mt-1 text-sm text-red-600">{errors.pageCount}</p>
        )}
      </div>

      {/* 清晰度选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          清晰度
        </label>
        <div className="flex gap-2">
          {(['1K', '2K', '4K'] as const).map((quality) => (
            <button
              key={quality}
              type="button"
              onClick={() => handleQualityChange(quality)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                config.quality === quality
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {quality}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          更高清晰度需要更长生成时间
        </p>
      </div>

      {/* 比例选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          画面比例
        </label>
        <div className="flex gap-2">
          {(['16:9', '4:3'] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => handleAspectRatioChange(ratio)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                config.aspectRatio === ratio
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {ratio}
              <span className="block text-xs mt-0.5 opacity-75">
                {ratio === '16:9' ? '宽屏' : '标准'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 当前配置摘要 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          当前配置：{config.pageCount} 页 · {config.quality} 清晰度 · {config.aspectRatio} 比例
        </p>
      </div>
    </div>
  )
}

export default GenerationConfigForm
