import { useState, useEffect } from 'react'
import { ApiConfig } from '../types'

const STORAGE_KEY = 'aippt_api_config'

interface ApiConfigFormProps {
  onConfigChange?: (config: ApiConfig) => void
  initialConfig?: ApiConfig
}

/**
 * 从 localStorage 加载 API 配置
 */
export function loadApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || ''
      }
    }
  } catch (e) {
    console.error('Failed to load API config from localStorage:', e)
  }
  return { apiKey: '', baseUrl: '' }
}

/**
 * 保存 API 配置到 localStorage
 */
export function saveApiConfig(config: ApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('Failed to save API config to localStorage:', e)
  }
}

/**
 * 验证 API 配置
 */
export function validateApiConfig(config: ApiConfig): { isValid: boolean; errors: { apiKey?: string; baseUrl?: string } } {
  const errors: { apiKey?: string; baseUrl?: string } = {}
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.apiKey = 'API Key 不能为空'
  }
  
  if (!config.baseUrl || config.baseUrl.trim() === '') {
    errors.baseUrl = 'Base URL 不能为空'
  } else {
    // 验证 URL 格式
    try {
      new URL(config.baseUrl)
    } catch {
      errors.baseUrl = '请输入有效的 URL 格式'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * API 配置表单组件
 * - API Key 输入框（密码类型）
 * - Base URL 输入框
 * - 保存到 localStorage
 */
function ApiConfigForm({ onConfigChange, initialConfig }: ApiConfigFormProps) {
  const [config, setConfig] = useState<ApiConfig>(() => {
    if (initialConfig) return initialConfig
    return loadApiConfig()
  })
  
  const [errors, setErrors] = useState<{ apiKey?: string; baseUrl?: string }>({})
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  // 当配置变化时通知父组件
  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = { ...config, apiKey: e.target.value }
    setConfig(newConfig)
    setSaved(false)
    
    // 清除该字段的错误
    if (errors.apiKey) {
      setErrors(prev => ({ ...prev, apiKey: undefined }))
    }
  }

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = { ...config, baseUrl: e.target.value }
    setConfig(newConfig)
    setSaved(false)
    
    // 清除该字段的错误
    if (errors.baseUrl) {
      setErrors(prev => ({ ...prev, baseUrl: undefined }))
    }
  }

  const handleSave = () => {
    const validation = validateApiConfig(config)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    saveApiConfig(config)
    setErrors({})
    setSaved(true)
    
    // 3秒后隐藏保存成功提示
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">API 配置</h3>
      
      {/* API Key 输入框 */}
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            id="apiKey"
            name="apiKey"
            value={config.apiKey}
            onChange={handleApiKeyChange}
            placeholder="输入您的 API Key"
            className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.apiKey ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
          >
            {showApiKey ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.apiKey && (
          <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>
        )}
      </div>

      {/* Base URL 输入框 */}
      <div>
        <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Base URL
        </label>
        <input
          type="text"
          id="baseUrl"
          name="baseUrl"
          value={config.baseUrl}
          onChange={handleBaseUrlChange}
          placeholder="https://api.example.com"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.baseUrl ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.baseUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.baseUrl}</p>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          保存配置
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
