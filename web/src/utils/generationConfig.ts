import { GenerationConfig } from '../types'
import { validateGenerationConfig, validatePageCount } from './validation'

export { validateGenerationConfig, validatePageCount }

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  pageCount: 10,
  quality: '1K',
  aspectRatio: '16:9',
  language: '中文',
  style: '现代简约商务风格',
  targetAudience: '专业人士',
  userRequirements: ''
}
