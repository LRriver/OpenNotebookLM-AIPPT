import { useState, useEffect } from 'react'
import { GenerationConfig } from '../types'
import { validatePageCount, validateGenerationConfig } from '../utils/validation'

export { validatePageCount, validateGenerationConfig }

interface GenerationConfigFormProps {
  onConfigChange?: (config: GenerationConfig) => void
  initialConfig?: GenerationConfig
}

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  pageCount: 10,
  quality: '1K',
  aspectRatio: '16:9',
  language: '中文',
  style: '现代简约商务风格',
  targetAudience: '专业人士'
}

const STYLE_PRESETS = [
  '现代简约商务风格',
  '科技感未来风格',
  '学术专业风格',
  '创意艺术风格',
  '清新自然风格',
  '经典传统风格'
]

const AUDIENCE_PRESETS = [
  '专业人士',
  '学生群体',
  '企业管理层',
  '技术开发者',
  '普通大众',
  '投资者'
]

/**
 * 生成配置表单组件 - 橙黄主题
 */
function GenerationConfigForm({ onConfigChange, initialConfig }: GenerationConfigFormProps) {
  const [config, setConfig] = useState<GenerationConfig>(initialConfig || DEFAULT_GENERATION_CONFIG)
  const [errors, setErrors] = useState<{ pageCount?: string }>({})
  const [pageCountInput, setPageCountInput] = useState<string>(
    String(initialConfig?.pageCount || DEFAULT_GENERATION_CONFIG.pageCount)
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setPageCountInput(inputValue)
    
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, language: e.target.value }))
  }

  const handleStyleChange = (style: string) => {
    setConfig(prev => ({ ...prev, style }))
  }

  const handleAudienceChange = (audience: string) => {
    setConfig(prev => ({ ...prev, targetAudience: audience }))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-warm-800">生成参数</span>
      </div>
      
      {/* 页数选择器 */}
      <div>
        <label htmlFor="pageCount" className="block text-xs font-medium text-warm-600 mb-1.5">
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
          className={`w-full px-4 py-2.5 text-sm border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${
            errors.pageCount ? 'border-red-400 bg-red-50' : 'border-warm-200 bg-white'
          }`}
        />
        {errors.pageCount && (
          <p className="mt-1 text-xs text-red-500">{errors.pageCount}</p>
        )}
      </div>

      {/* 清晰度选择 */}
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-2">清晰度</label>
        <div className="flex gap-2">
          {(['1K', '2K', '4K'] as const).map((quality) => (
            <button
              key={quality}
              type="button"
              onClick={() => handleQualityChange(quality)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
                config.quality === quality
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white border-transparent shadow-warm'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-primary-300'
              }`}
            >
              {quality}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-warm-400">更高清晰度需要更长生成时间</p>
      </div>

      {/* 比例选择 */}
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-2">画面比例</label>
        <div className="flex gap-2">
          {(['16:9', '4:3'] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => handleAspectRatioChange(ratio)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 ${
                config.aspectRatio === ratio
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white border-transparent shadow-warm'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-primary-300'
              }`}
            >
              <span>{ratio}</span>
              <span className="block text-xs mt-0.5 opacity-75">
                {ratio === '16:9' ? '宽屏' : '标准'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 高级设置折叠区 */}
      <div className="border-t border-warm-200 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-warm-700 hover:text-primary-600 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          PPT 内容设置
        </button>
        
        {showAdvanced && (
          <div className="mt-4 space-y-4 pl-6">
            {/* 语言设置 */}
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1.5">输出语言</label>
              <input
                type="text"
                value={config.language || ''}
                onChange={handleLanguageChange}
                placeholder="中文"
                className="w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>

            {/* 风格设置 */}
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-2">PPT 风格</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleStyleChange(style)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                      config.style === style
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-warm-600 border-warm-200 hover:border-purple-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={config.style || ''}
                onChange={(e) => handleStyleChange(e.target.value)}
                placeholder="或输入自定义风格..."
                className="mt-2 w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>

            {/* 目标受众设置 */}
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-2">目标受众</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_PRESETS.map((audience) => (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => handleAudienceChange(audience)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                      config.targetAudience === audience
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-warm-600 border-warm-200 hover:border-primary-300'
                    }`}
                  >
                    {audience}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={config.targetAudience || ''}
                onChange={(e) => handleAudienceChange(e.target.value)}
                placeholder="或输入自定义受众..."
                className="mt-2 w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* 当前配置摘要 */}
      <div className="p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
        <p className="text-xs text-warm-700 font-medium">
          当前配置：{config.pageCount} 页 · {config.quality} 清晰度 · {config.aspectRatio} 比例
          {config.language && ` · ${config.language}`}
        </p>
        {config.style && (
          <p className="text-xs text-warm-500 mt-1">风格：{config.style}</p>
        )}
        {config.targetAudience && (
          <p className="text-xs text-warm-500">受众：{config.targetAudience}</p>
        )}
      </div>
    </div>
  )
}

export default GenerationConfigForm
