import { ApiConfig, FullApiConfig, ImageApiConfig, TextApiConfig } from '../types'

const STORAGE_KEY = 'aippt_full_api_config'

const DEFAULT_IMAGE_CONFIG: ImageApiConfig = {
  apiKey: '',
  baseUrl: '',
  model: 'gpt-image-2'
}

const DEFAULT_TEXT_CONFIG: TextApiConfig = {
  apiKey: '',
  baseUrl: '',
  model: 'DeepSeek-V4-Pro',
  format: 'openai',
  thinkingLevel: null
}

export const DEFAULT_FULL_API_CONFIG: FullApiConfig = {
  image: DEFAULT_IMAGE_CONFIG,
  text: DEFAULT_TEXT_CONFIG,
  edit: { ...DEFAULT_IMAGE_CONFIG }
}

export function loadFullApiConfig(): FullApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const image = {
        apiKey: parsed.image?.apiKey || '',
        baseUrl: parsed.image?.baseUrl || '',
        model: parsed.image?.model || DEFAULT_IMAGE_CONFIG.model
      }
      return {
        image,
        text: {
          apiKey: parsed.text?.apiKey || image.apiKey || '',
          baseUrl: parsed.text?.baseUrl || image.baseUrl || '',
          model: parsed.text?.model || DEFAULT_TEXT_CONFIG.model,
          format: parsed.text?.format || DEFAULT_TEXT_CONFIG.format,
          thinkingLevel: parsed.text?.thinkingLevel ?? DEFAULT_TEXT_CONFIG.thinkingLevel
        },
        edit: {
          apiKey: parsed.edit?.apiKey || image.apiKey,
          baseUrl: parsed.edit?.baseUrl || image.baseUrl,
          model: parsed.edit?.model || image.model
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
    edit?: { apiKey?: string; baseUrl?: string; model?: string }
  }
} {
  const errors: {
    image?: { apiKey?: string; baseUrl?: string; model?: string }
    text?: { apiKey?: string; baseUrl?: string; model?: string }
    edit?: { apiKey?: string; baseUrl?: string; model?: string }
  } = {}

  const validateUrl = (value: string | undefined) => {
    if (!value?.trim()) return 'Base URL 不能为空'
    try { new URL(value) } catch { return '请输入有效的 URL 格式' }
    return undefined
  }
  
  const imageErrors: { apiKey?: string; baseUrl?: string; model?: string } = {}
  const imageUrlError = validateUrl(config.image.baseUrl)
  if (imageUrlError) imageErrors.baseUrl = imageUrlError
  if (!config.image.model?.trim()) imageErrors.model = '图像模型名称不能为空'
  if (Object.keys(imageErrors).length > 0) errors.image = imageErrors
  
  const textErrors: { apiKey?: string; baseUrl?: string; model?: string } = {}
  const textUrlError = validateUrl(config.text.baseUrl)
  if (textUrlError) textErrors.baseUrl = textUrlError
  if (!config.text.model?.trim()) textErrors.model = '文本模型名称不能为空'
  if (Object.keys(textErrors).length > 0) errors.text = textErrors

  if (config.edit) {
    const editErrors: { apiKey?: string; baseUrl?: string; model?: string } = {}
    const editUrlError = validateUrl(config.edit.baseUrl)
    if (editUrlError) editErrors.baseUrl = editUrlError
    if (!config.edit.model?.trim()) editErrors.model = '编辑模型名称不能为空'
    if (Object.keys(editErrors).length > 0) errors.edit = editErrors
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

export function loadApiConfig(): ApiConfig {
  const full = loadFullApiConfig()
  return { apiKey: full.image.apiKey, baseUrl: full.image.baseUrl }
}

export function saveApiConfig(config: { apiKey: string; baseUrl: string }): boolean {
  const full = loadFullApiConfig()
  full.image.apiKey = config.apiKey
  full.image.baseUrl = config.baseUrl
  if (!full.edit) full.edit = { ...full.image }
  full.edit.apiKey = config.apiKey
  full.edit.baseUrl = config.baseUrl
  saveFullApiConfig(full)
  return true
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
