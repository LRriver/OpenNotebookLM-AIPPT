import { useState, useEffect } from 'react'
import { FullApiConfig, ImageApiConfig, TextApiConfig } from '../types'

const STORAGE_KEY = 'aippt_full_api_config'

interface ApiConfigFormProps {
  onConfigChange?: (config: FullApiConfig) => void
  initialConfig?: FullApiConfig
}

const DEFAULT_IMAGE_CONFIG: ImageApiConfig = {
  apiKey: '',
  baseUrl: '',
  model: 'gemini-3-pro-image-preview'
}

const DEFAULT_TEXT_CONFIG: TextApiConfig = {
  apiKey: '',
  baseUrl: '',
  model: 'gemini-3-pro-preview',
  format: 'gemini',
  thinkingLevel: 'high'
}

export const DEFAULT_FULL_API_CONFIG: FullApiConfig = {
  image: DEFAULT_IMAGE_CONFIG,
  text: DEFAULT_TEXT_CONFIG
}

export function loadFullApiConfig(): FullApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        image: {
          apiKey: parsed.image?.apiKey || '',
          baseUrl: parsed.image?.baseUrl || '',
          model: parsed.image?.model || DEFAULT_IMAGE_CONFIG.model
        },
        text: {
          apiKey: parsed.text?.apiKey || '',
          baseUrl: parsed.text?.baseUrl || '',
          model: parsed.text?.model || DEFAULT_TEXT_CONFIG.model,
          format: parsed.text?.format || DEFAULT_TEXT_CONFIG.format,
          thinkingLevel: parsed.text?.thinkingLevel ?? DEFAULT_TEXT_CONFIG.thinkingLevel
        }
      }
    }
  } catch (e) {
    console.error('Failed to load API config from localStorage:', e)
  }
  return DEFAULT_FULL_API_CONFIG
}

export function saveFullApiConfig(config: FullApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('Failed to save API config to localStorage:', e)
  }
}

export function validateFullApiConfig(config: FullApiConfig): { 
  isValid: boolean
  errors: {
    image?: { apiKey?: string; baseUrl?: string; model?: string }
    text?: { apiKey?: string; baseUrl?: string; model?: string }
  }
} {
  const errors: {
    image?: { apiKey?: string; baseUrl?: string; model?: string }
    text?: { apiKey?: string; baseUrl?: string; model?: string }
  } = {}
  
  const imageErrors: { apiKey?: string; baseUrl?: string; model?: string } = {}
  if (!config.image.apiKey?.trim()) imageErrors.apiKey = '图像模型 API Key 不能为空'
  if (!config.image.baseUrl?.trim()) {
    imageErrors.baseUrl = '图像模型 Base URL 不能为空'
  } else {
    try { new URL(config.image.baseUrl) } catch { imageErrors.baseUrl = '请输入有效的 URL 格式' }
  }
  if (!config.image.model?.trim()) imageErrors.model = '图像模型名称不能为空'
  if (Object.keys(imageErrors).length > 0) errors.image = imageErrors
  
  const textErrors: { apiKey?: string; baseUrl?: string; model?: string } = {}
  if (!config.text.apiKey?.trim()) textErrors.apiKey = '文本模型 API Key 不能为空'
  if (!config.text.baseUrl?.trim()) {
    textErrors.baseUrl = '文本模型 Base URL 不能为空'
  } else {
    try { new URL(config.text.baseUrl) } catch { textErrors.baseUrl = '请输入有效的 URL 格式' }
  }
  if (!config.text.model?.trim()) textErrors.model = '文本模型名称不能为空'
  if (Object.keys(textErrors).length > 0) errors.text = textErrors
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

export function loadApiConfig() {
  const full = loadFullApiConfig()
  return { apiKey: full.image.apiKey, baseUrl: full.image.baseUrl }
}

export function saveApiConfig(config: { apiKey: string; baseUrl: string }) {
  const full = loadFullApiConfig()
  full.image.apiKey = config.apiKey
  full.image.baseUrl = config.baseUrl
  saveFullApiConfig(full)
}

export function validateApiConfig(config: { apiKey: string; baseUrl: string }) {
  const errors: { apiKey?: string; baseUrl?: string } = {}
  if (!config.apiKey?.trim()) errors.apiKey = 'API Key 不能为空'
  if (!config.baseUrl?.trim()) {
    errors.baseUrl = 'Base URL 不能为空'
  } else {
    try { new URL(config.baseUrl) } catch { errors.baseUrl = '请输入有效的 URL 格式' }
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

/**
 * API 配置表单组件 - 橙黄主题
 */
function ApiConfigForm({ onConfigChange, initialConfig }: ApiConfigFormProps) {
  const [config, setConfig] = useState<FullApiConfig>(() => initialConfig || loadFullApiConfig())
  const [errors, setErrors] = useState<{
    image?: { apiKey?: string; baseUrl?: string; model?: string }
    text?: { apiKey?: string; baseUrl?: string; model?: string }
  }>({})
  const [showImageApiKey, setShowImageApiKey] = useState(false)
  const [showTextApiKey, setShowTextApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [useSharedConfig, setUseSharedConfig] = useState(() => {
    const loaded = loadFullApiConfig()
    return loaded.image.apiKey === loaded.text.apiKey && loaded.image.baseUrl === loaded.text.baseUrl
  })

  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  useEffect(() => {
    if (useSharedConfig) {
      setConfig(prev => ({
        ...prev,
        text: { ...prev.text, apiKey: prev.image.apiKey, baseUrl: prev.image.baseUrl }
      }))
    }
  }, [useSharedConfig])

  const handleImageConfigChange = (field: keyof ImageApiConfig, value: string) => {
    setConfig(prev => {
      const newConfig = { ...prev, image: { ...prev.image, [field]: value } }
      if (useSharedConfig && (field === 'apiKey' || field === 'baseUrl')) {
        newConfig.text = { ...newConfig.text, [field]: value }
      }
      return newConfig
    })
    setSaved(false)
    if (errors.image?.[field]) {
      setErrors(prev => ({ ...prev, image: { ...prev.image, [field]: undefined } }))
    }
  }

  const handleTextConfigChange = (field: keyof TextApiConfig, value: string | null) => {
    setConfig(prev => ({ ...prev, text: { ...prev.text, [field]: value } }))
    setSaved(false)
    if (errors.text?.[field as keyof typeof errors.text]) {
      setErrors(prev => ({ ...prev, text: { ...prev.text, [field]: undefined } }))
    }
  }

  const handleSave = () => {
    const validation = validateFullApiConfig(config)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    saveFullApiConfig(config)
    setErrors({})
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-2.5 text-sm border rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
    ${hasError ? 'border-red-400 bg-red-50' : 'border-warm-200 bg-white'}
  `

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-warm-800">API 配置</span>
        </div>
        <label className="flex items-center gap-2 text-xs text-warm-600 cursor-pointer">
          <input
            type="checkbox"
            checked={useSharedConfig}
            onChange={(e) => setUseSharedConfig(e.target.checked)}
            className="w-4 h-4 rounded border-warm-300 text-primary-500 focus:ring-primary-400"
          />
          共享配置
        </label>
      </div>
      
      {/* 图像模型配置 */}
      <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100 space-y-3">
        <h4 className="text-sm font-semibold text-primary-800 flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          图像生成模型
        </h4>
        
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1.5">API Key</label>
          <div className="relative">
            <input
              type={showImageApiKey ? 'text' : 'password'}
              value={config.image.apiKey}
              onChange={(e) => handleImageConfigChange('apiKey', e.target.value)}
              placeholder="输入图像模型 API Key"
              className={inputClass(!!errors.image?.apiKey)}
            />
            <button
              type="button"
              onClick={() => setShowImageApiKey(!showImageApiKey)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-warm-400 hover:text-warm-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showImageApiKey ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
          </div>
          {errors.image?.apiKey && <p className="mt-1 text-xs text-red-500">{errors.image.apiKey}</p>}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1.5">Base URL</label>
          <input
            type="text"
            value={config.image.baseUrl}
            onChange={(e) => handleImageConfigChange('baseUrl', e.target.value)}
            placeholder="https://api.example.com"
            className={inputClass(!!errors.image?.baseUrl)}
          />
          {errors.image?.baseUrl && <p className="mt-1 text-xs text-red-500">{errors.image.baseUrl}</p>}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1.5">模型名称</label>
          <input
            type="text"
            value={config.image.model}
            onChange={(e) => handleImageConfigChange('model', e.target.value)}
            placeholder="gemini-3-pro-image-preview"
            className={inputClass(!!errors.image?.model)}
          />
          {errors.image?.model && <p className="mt-1 text-xs text-red-500">{errors.image.model}</p>}
        </div>
      </div>

      {/* 文本模型配置 */}
      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 space-y-3">
        <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          文本生成模型
        </h4>
        
        {!useSharedConfig && (
          <>
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showTextApiKey ? 'text' : 'password'}
                  value={config.text.apiKey}
                  onChange={(e) => handleTextConfigChange('apiKey', e.target.value)}
                  placeholder="输入文本模型 API Key"
                  className={inputClass(!!errors.text?.apiKey)}
                />
                <button
                  type="button"
                  onClick={() => setShowTextApiKey(!showTextApiKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-warm-400 hover:text-warm-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showTextApiKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.text?.apiKey && <p className="mt-1 text-xs text-red-500">{errors.text.apiKey}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1.5">Base URL</label>
              <input
                type="text"
                value={config.text.baseUrl}
                onChange={(e) => handleTextConfigChange('baseUrl', e.target.value)}
                placeholder="https://api.example.com"
                className={inputClass(!!errors.text?.baseUrl)}
              />
              {errors.text?.baseUrl && <p className="mt-1 text-xs text-red-500">{errors.text.baseUrl}</p>}
            </div>
          </>
        )}
        
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1.5">模型名称</label>
          <input
            type="text"
            value={config.text.model}
            onChange={(e) => handleTextConfigChange('model', e.target.value)}
            placeholder="gemini-3-pro-preview"
            className={inputClass(!!errors.text?.model)}
          />
          {errors.text?.model && <p className="mt-1 text-xs text-red-500">{errors.text.model}</p>}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-warm-600 mb-1.5">API 格式</label>
          <div className="flex gap-2">
            {(['gemini', 'openai'] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => handleTextConfigChange('format', format)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                  config.text.format === format
                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                    : 'bg-white text-warm-600 border-warm-200 hover:border-green-300'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        {config.text.format === 'gemini' && (
          <div>
            <label className="block text-xs font-medium text-warm-600 mb-1.5">思考深度</label>
            <div className="flex gap-2">
              {[
                { value: null, label: '关闭' },
                { value: 'low', label: '低' },
                { value: 'high', label: '高' }
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleTextConfigChange('thinkingLevel', option.value)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                    config.text.thinkingLevel === option.value
                      ? 'bg-green-500 text-white border-green-500 shadow-sm'
                      : 'bg-white text-warm-600 border-warm-200 hover:border-green-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-warm-400">仅支持 Gemini 3+ 系列模型</p>
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
        >
          保存配置
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            已保存
          </span>
        )}
      </div>
    </div>
  )
}

export default ApiConfigForm
