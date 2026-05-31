import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DesignWorkflowPanel from '../DesignWorkflowPanel'
import { UiPreferencesProvider } from '../../contexts/UiPreferencesContext'
import { ConfirmedSlidePrompt, DeckOutline, FullApiConfig, GenerationConfig } from '../../types'

const fullApiConfig: FullApiConfig = {
  image: { apiKey: '', baseUrl: '', model: 'gpt-image-2' },
  edit: { apiKey: '', baseUrl: '', model: 'gpt-image-2' },
  text: { apiKey: '', baseUrl: '', model: 'DeepSeek-V4-Pro', format: 'openai' }
}

const generationConfig: GenerationConfig = {
  pageCount: 2,
  quality: '1K',
  aspectRatio: '16:9',
  language: '中文',
  style: '现代简约商务风格',
  targetAudience: '研发团队',
  userRequirements: '强调风险控制'
}

const outline: DeckOutline = {
  title: 'L9 设计大纲',
  user_requirements: '已强调风险控制',
  design_style: '现代简约商务风格',
  audience: '研发团队',
  slides: [
    {
      page: 1,
      title: '封面',
      narrative_goal: '建立主题',
      key_points: ['L9', '实验'],
      visual_direction: '大标题和抽象架构图'
    },
    {
      page: 2,
      title: '总结',
      narrative_goal: '收束观点',
      key_points: ['结论', '风险'],
      visual_direction: '结论卡片'
    }
  ]
}

const prompts: ConfirmedSlidePrompt[] = [
  {
    page: 1,
    title: '封面',
    content_summary: '封面摘要',
    display_content: '封面展示标题、来源和一个抽象架构图。',
    prompt: '你生成的 PPT 其中一页的内容，要图文并茂。封面。'
  },
  {
    page: 2,
    title: '总结',
    content_summary: '总结摘要',
    display_content: '总结页展示两个关键结论和风险控制建议。',
    prompt: '你生成的 PPT 其中一页的内容，要图文并茂。总结。'
  }
]

function renderPanel(onPromptsReady = vi.fn()) {
  render(
    <UiPreferencesProvider>
      <DesignWorkflowPanel
        fileContent="# L9"
        fullApiConfig={fullApiConfig}
        generationConfig={generationConfig}
        confirmedPrompts={null}
        onPromptsReady={onPromptsReady}
        onClearPrompts={vi.fn()}
      />
    </UiPreferencesProvider>
  )
  return { onPromptsReady }
}

describe('DesignWorkflowPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an editable non-technical outline and collapsible page designs before image generation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, outline })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, slide_prompts: prompts })
      })
    vi.stubGlobal('fetch', fetchMock)

    const { onPromptsReady } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: '生成设计大纲' }))

    const titleInput = await screen.findByLabelText('大纲标题')
    expect(titleInput).toHaveValue('L9 设计大纲')
    expect(screen.getByText('PPT 大纲')).toBeInTheDocument()
    expect(screen.queryByText('渲染后的设计大纲')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('设计大纲编辑器')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('第 1 页标题'), { target: { value: '封面：技术实验' } })
    fireEvent.click(screen.getByRole('button', { name: '展开第 1 页大纲' }))
    expect(screen.getByLabelText('第 1 页叙事目标')).toHaveValue('建立主题')
    expect(screen.getByLabelText('第 1 页关键要点')).toHaveValue('L9\n实验')
    fireEvent.change(screen.getByLabelText('第 1 页关键要点'), { target: { value: 'L9\n实验\n' } })
    expect(screen.getByLabelText('第 1 页关键要点')).toHaveValue('L9\n实验\n')

    fireEvent.click(screen.getByRole('button', { name: '确认大纲并生成逐页设计' }))

    await waitFor(() => {
      expect(onPromptsReady).toHaveBeenCalledWith(prompts)
    })
    expect(screen.getByText('逐页设计预览')).toBeInTheDocument()
    expect(screen.getByText('封面摘要')).toBeInTheDocument()
    expect(screen.queryByText('封面展示标题、来源和一个抽象架构图。')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '展开第 1 页设计' }))
    expect(screen.getByText('封面展示标题、来源和一个抽象架构图。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '收起第 1 页设计' }))
    expect(screen.queryByText('封面展示标题、来源和一个抽象架构图。')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1]?.body).toContain('封面：技术实验')
    const promptRequest = JSON.parse(fetchMock.mock.calls[1][1]?.body as string)
    expect(promptRequest.outline.slides[0].key_points).toEqual(['L9', '实验'])
  })
})
