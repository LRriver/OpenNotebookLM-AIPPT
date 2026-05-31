import { useState, useEffect } from 'react'
import { GenerationConfig } from '../types'
import { validatePageCount } from '../utils/generationConfig'
import { DEFAULT_GENERATION_CONFIG } from '../utils/generationConfig'
import { audiencePresets, stylePresets } from '../i18n'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface GenerationConfigFormProps {
  onConfigChange?: (config: GenerationConfig) => void
  initialConfig?: GenerationConfig
}

/**
 * 生成配置表单组件 - 橙黄主题
 */
function GenerationConfigForm({ onConfigChange, initialConfig }: GenerationConfigFormProps) {
  const { language, t } = useUiPreferences()
  const [config, setConfig] = useState<GenerationConfig>(initialConfig || DEFAULT_GENERATION_CONFIG)
  const [errors, setErrors] = useState<{ pageCount?: string }>({})
  const [pageCountInput, setPageCountInput] = useState<string>(
    String(initialConfig?.pageCount || DEFAULT_GENERATION_CONFIG.pageCount)
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setPageCountInput(inputValue)
    
    if (inputValue === '') {
      setErrors({ pageCount: t('generation.pageRequired') })
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

  const handleUserRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(prev => ({ ...prev, userRequirements: e.target.value }))
  }

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-white/35 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="aippt-section-icon aippt-section-icon-warm !w-9 !h-9">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-strong)]">{t('generation.title')}</h3>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {t('generation.summary', { pages: config.pageCount, quality: config.quality, ratio: config.aspectRatio })}
            </p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-5 border-t border-[var(--card-border)] p-4">
      {/* 页数选择器 */}
      <div>
        <label htmlFor="pageCount" className="block text-xs font-medium text-warm-600 mb-1.5">
          {t('generation.pageCount')}
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
        <label className="block text-xs font-medium text-warm-600 mb-2">{t('generation.quality')}</label>
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
        <p className="mt-1.5 text-xs text-warm-400">{t('generation.qualityHint')}</p>
      </div>

      {/* 比例选择 */}
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-2">{t('generation.aspectRatio')}</label>
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
                {ratio === '16:9' ? t('generation.wide') : t('generation.standard')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 语言设置 */}
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-1.5">{t('generation.outputLanguage')}</label>
        <input
          type="text"
          value={config.language || ''}
          onChange={handleLanguageChange}
          placeholder={t('generation.outputLanguagePlaceholder')}
          className="w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
      </div>

      {/* 风格设置 */}
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-2">{t('generation.style')}</label>
        <div className="flex flex-wrap gap-2">
          {stylePresets[language].map((style) => (
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
          placeholder={t('generation.styleCustom')}
          className="mt-2 w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
      </div>

      {/* 目标受众设置 */}
      <div>
        <label className="block text-xs font-medium text-warm-600 mb-2">{t('generation.audience')}</label>
        <div className="flex flex-wrap gap-2">
          {audiencePresets[language].map((audience) => (
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
          placeholder={t('generation.audienceCustom')}
          className="mt-2 w-full px-4 py-2.5 text-sm border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="userRequirements" className="block text-xs font-medium text-warm-600 mb-1.5">
          {t('generation.requirements')}
        </label>
        <textarea
          id="userRequirements"
          name="userRequirements"
          value={config.userRequirements || ''}
          onChange={handleUserRequirementsChange}
          rows={4}
          placeholder={t('generation.requirementsPlaceholder')}
          className="w-full px-4 py-3 text-sm border border-warm-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-y"
        />
      </div>

      {/* 当前配置摘要 */}
      <div className="p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
        <p className="text-xs text-warm-700 font-medium">
          {t('generation.summary', { pages: config.pageCount, quality: config.quality, ratio: config.aspectRatio })}
          {config.language && ` · ${config.language}`}
        </p>
        {config.style && (
          <p className="text-xs text-warm-500 mt-1">{t('generation.summaryStyle', { style: config.style })}</p>
        )}
        {config.targetAudience && (
          <p className="text-xs text-warm-500">{t('generation.summaryAudience', { audience: config.targetAudience })}</p>
        )}
        {config.userRequirements && (
          <p className="text-xs text-warm-500 line-clamp-2">{t('generation.summaryRequirements', { requirements: config.userRequirements })}</p>
        )}
      </div>
        </div>
      )}
    </section>
  )
}

export default GenerationConfigForm
