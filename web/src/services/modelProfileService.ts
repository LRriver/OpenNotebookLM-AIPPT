import { FullApiConfig, ModelProfilesRequestConfig, ModelProfilesResponse } from '../types'

export async function loadBackendModelProfiles(): Promise<ModelProfilesResponse> {
  const response = await fetch('/api/model-profiles')
  if (!response.ok) {
    throw new Error(`加载模型配置失败: ${response.status}`)
  }
  return response.json()
}

export async function saveBackendModelProfiles(config: FullApiConfig): Promise<ModelProfilesResponse> {
  const profiles = buildModelProfiles(config)
  const response = await fetch('/api/model-profiles', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profiles)
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `保存模型配置失败: ${response.status}`)
  }
  return response.json()
}

export function buildModelProfiles(config: FullApiConfig): ModelProfilesRequestConfig {
  const editConfig = config.edit || config.image
  return {
    prompt_model: {
      model: config.text.model,
      base_url: config.text.baseUrl,
      api_key: config.text.apiKey,
      adapter: 'openai_chat'
    },
    image_model: {
      model: config.image.model,
      base_url: config.image.baseUrl,
      api_key: config.image.apiKey,
      adapter: 'raw_chat_multimodal'
    },
    edit_model: {
      model: editConfig.model,
      base_url: editConfig.baseUrl,
      api_key: editConfig.apiKey,
      adapter: 'raw_chat_multimodal'
    }
  }
}
