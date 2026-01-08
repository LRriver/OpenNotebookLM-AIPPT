import { ApiConfig, GenerationConfig } from '../types'

/**
 * API 配置验证结果
 */
export interface ApiConfigValidationResult {
  isValid: boolean
  errors: {
    apiKey?: string
    baseUrl?: string
  }
}

/**
 * 生成配置验证结果
 */
export interface GenerationConfigValidationResult {
  isValid: boolean
  errors: {
    pageCount?: string
    quality?: string
    aspectRatio?: string
  }
}

/**
 * 完整配置验证结果
 */
export interface FullConfigValidationResult {
  isValid: boolean
  apiConfigErrors: ApiConfigValidationResult['errors']
  generationConfigErrors: GenerationConfigValidationResult['errors']
}

/**
 * 验证 API 配置
 */
export function validateApiConfig(config: ApiConfig): ApiConfigValidationResult {
  const errors: ApiConfigValidationResult['errors'] = {}
  
  // API Key 验证
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.apiKey = 'API Key 不能为空'
  }
  
  // Base URL 验证
  if (!config.baseUrl || config.baseUrl.trim() === '') {
    errors.baseUrl = 'Base URL 不能为空'
  } else {
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
 * 验证页数
 */
export function validatePageCount(value: unknown): { isValid: boolean; error?: string } {
  // 类型检查
  if (typeof value !== 'number') {
    return { isValid: false, error: '页数必须是数字' }
  }
  
  // NaN 检查
  if (isNaN(value)) {
    return { isValid: false, error: '页数必须是有效数字' }
  }
  
  // 整数检查
  if (!Number.isInteger(value)) {
    return { isValid: false, error: '页数必须是整数' }
  }
  
  // 范围检查
  if (value < 1) {
    return { isValid: false, error: '页数不能小于 1' }
  }
  
  if (value > 20) {
    return { isValid: false, error: '页数不能大于 20' }
  }
  
  return { isValid: true }
}

/**
 * 验证生成配置
 */
export function validateGenerationConfig(config: GenerationConfig): GenerationConfigValidationResult {
  const errors: GenerationConfigValidationResult['errors'] = {}
  
  // 页数验证
  const pageCountValidation = validatePageCount(config.pageCount)
  if (!pageCountValidation.isValid) {
    errors.pageCount = pageCountValidation.error
  }
  
  // 清晰度验证
  const validQualities = ['1K', '2K', '4K']
  if (!validQualities.includes(config.quality)) {
    errors.quality = '清晰度必须是 1K、2K 或 4K'
  }
  
  // 比例验证
  const validRatios = ['16:9', '4:3']
  if (!validRatios.includes(config.aspectRatio)) {
    errors.aspectRatio = '比例必须是 16:9 或 4:3'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * 验证完整配置（API + 生成参数）
 */
export function validateFullConfig(
  apiConfig: ApiConfig,
  generationConfig: GenerationConfig
): FullConfigValidationResult {
  const apiValidation = validateApiConfig(apiConfig)
  const generationValidation = validateGenerationConfig(generationConfig)
  
  return {
    isValid: apiValidation.isValid && generationValidation.isValid,
    apiConfigErrors: apiValidation.errors,
    generationConfigErrors: generationValidation.errors
  }
}

/**
 * 检查是否可以开始生成
 * 需要：有效的文件内容 + 有效的 API 配置 + 有效的生成配置
 */
export function canStartGeneration(
  fileContent: string,
  apiConfig: ApiConfig,
  generationConfig: GenerationConfig
): { canStart: boolean; reason?: string } {
  // 检查文件内容
  if (!fileContent || fileContent.trim() === '') {
    return { canStart: false, reason: '请先上传 Markdown 文件' }
  }
  
  // 检查 API 配置
  const apiValidation = validateApiConfig(apiConfig)
  if (!apiValidation.isValid) {
    if (apiValidation.errors.apiKey) {
      return { canStart: false, reason: 'API Key 未配置' }
    }
    if (apiValidation.errors.baseUrl) {
      return { canStart: false, reason: 'Base URL 未配置或格式无效' }
    }
  }
  
  // 检查生成配置
  const generationValidation = validateGenerationConfig(generationConfig)
  if (!generationValidation.isValid) {
    if (generationValidation.errors.pageCount) {
      return { canStart: false, reason: generationValidation.errors.pageCount }
    }
  }
  
  return { canStart: true }
}
