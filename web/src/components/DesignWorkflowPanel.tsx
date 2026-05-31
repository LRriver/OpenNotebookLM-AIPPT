import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmedSlidePrompt, DeckOutline, FullApiConfig, GenerationConfig } from '../types'
import { requestDeckOutline, requestSlidePrompts } from '../services/generateService'
import { useUiPreferences } from '../contexts/useUiPreferences'

type WorkflowStatus =
  | 'idle'
  | 'outline_loading'
  | 'outline_ready'
  | 'prompts_loading'
  | 'prompts_ready'
  | 'error'

interface DesignWorkflowPanelProps {
  fileContent: string
  fullApiConfig: FullApiConfig
  generationConfig: GenerationConfig
  confirmedPrompts: ConfirmedSlidePrompt[] | null
  onPromptsReady: (prompts: ConfirmedSlidePrompt[]) => void
  onClearPrompts: () => void
  children?: ReactNode
}

function renderLines(content: string): string[] {
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function DesignWorkflowPanel({
  fileContent,
  fullApiConfig,
  generationConfig,
  confirmedPrompts,
  onPromptsReady,
  onClearPrompts,
  children
}: DesignWorkflowPanelProps) {
  const { t } = useUiPreferences()
  const [status, setStatus] = useState<WorkflowStatus>('idle')
  const [outline, setOutline] = useState<DeckOutline | null>(null)
  const [slidePrompts, setSlidePrompts] = useState<ConfirmedSlidePrompt[]>([])
  const [expandedOutlinePages, setExpandedOutlinePages] = useState<Set<number>>(new Set())
  const [expandedDesignPages, setExpandedDesignPages] = useState<Set<number>>(new Set())
  const [isOpen, setIsOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resetKey = useMemo(
    () => JSON.stringify({
      content: fileContent,
      pages: generationConfig.pageCount,
      language: generationConfig.language,
      style: generationConfig.style,
      audience: generationConfig.targetAudience,
      requirements: generationConfig.userRequirements
    }),
    [fileContent, generationConfig]
  )

  useEffect(() => {
    setStatus('idle')
    setOutline(null)
    setSlidePrompts([])
    setExpandedOutlinePages(new Set())
    setExpandedDesignPages(new Set())
    setError(null)
    onClearPrompts()
  }, [resetKey, onClearPrompts])

  const canPlan = fileContent.trim().length > 0 && status !== 'outline_loading' && status !== 'prompts_loading'
  const hasConfirmedPrompts = Boolean(confirmedPrompts?.length)

  const handleGenerateOutline = useCallback(async () => {
    if (!canPlan) return
    setStatus('outline_loading')
    setError(null)
    onClearPrompts()

    try {
      const nextOutline = await requestDeckOutline({
        content: fileContent,
        fullApiConfig,
        generationConfig
      })
      setOutline(nextOutline)
      setSlidePrompts([])
      setExpandedOutlinePages(new Set())
      setExpandedDesignPages(new Set())
      setStatus('outline_ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflow.outlineFailed'))
      setStatus('error')
    }
  }, [canPlan, fileContent, fullApiConfig, generationConfig, onClearPrompts, t])

  const handleGeneratePrompts = useCallback(async () => {
    if (!outline) return
    setStatus('prompts_loading')
    setError(null)
    onClearPrompts()

    try {
      const parsedOutline = outline
      if (!Array.isArray(parsedOutline.slides) || parsedOutline.slides.length !== generationConfig.pageCount) {
        throw new Error(t('workflow.pageCountMismatch', { count: generationConfig.pageCount }))
      }

      const prompts = await requestSlidePrompts({
        content: fileContent,
        fullApiConfig,
        generationConfig,
        outline: parsedOutline
      })
      setOutline(parsedOutline)
      setSlidePrompts(prompts)
      onPromptsReady(prompts)
      setStatus('prompts_ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflow.promptsFailed'))
      setStatus('outline_ready')
    }
  }, [fileContent, fullApiConfig, generationConfig, outline, onClearPrompts, onPromptsReady, t])

  const markOutlineDirty = useCallback(() => {
    if (slidePrompts.length > 0 || hasConfirmedPrompts) {
      setSlidePrompts([])
      onClearPrompts()
      setExpandedDesignPages(new Set())
      setStatus('outline_ready')
    }
  }, [hasConfirmedPrompts, onClearPrompts, slidePrompts.length])

  const updateOutlineField = useCallback((field: keyof Omit<DeckOutline, 'slides'>, value: string) => {
    markOutlineDirty()
    setOutline((current) => current ? { ...current, [field]: value } : current)
  }, [markOutlineDirty])

  const updateSlideField = useCallback((
    page: number,
    field: 'title' | 'narrative_goal' | 'visual_direction',
    value: string
  ) => {
    markOutlineDirty()
    setOutline((current) => current
      ? {
          ...current,
          slides: current.slides.map((slide) => (
            slide.page === page ? { ...slide, [field]: value } : slide
          ))
        }
      : current)
  }, [markOutlineDirty])

  const updateSlideKeyPoints = useCallback((page: number, value: string) => {
    markOutlineDirty()
    const keyPoints = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    setOutline((current) => current
      ? {
          ...current,
          slides: current.slides.map((slide) => (
            slide.page === page ? { ...slide, key_points: keyPoints } : slide
          ))
        }
      : current)
  }, [markOutlineDirty])

  const toggleOutlinePage = useCallback((page: number) => {
    setExpandedOutlinePages((current) => {
      const next = new Set(current)
      if (next.has(page)) next.delete(page)
      else next.add(page)
      return next
    })
  }, [])

  const toggleDesignPage = useCallback((page: number) => {
    setExpandedDesignPages((current) => {
      const next = new Set(current)
      if (next.has(page)) next.delete(page)
      else next.add(page)
      return next
    })
  }, [])

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-white/35 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <div className="aippt-section-icon aippt-section-icon-warm !w-7 !h-7">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104a2.25 2.25 0 012.25 0m-2.25 0L12 1.875m0 0l2.25 1.229m-2.25-1.229v8.625m4.409-.091L19.5 14.5m-3.091-4.091a2.25 2.25 0 01-.659-1.591V3.104m.659 7.305L12 14.818m0 0L7.591 10.41M12 14.818V21" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-strong)]">{t('workflow.title')}</h3>
            <p className="text-xs text-[var(--text-muted)]">{t('workflow.subtitle')}</p>
          </div>
        </div>
        <span className="rounded-full border border-[var(--border-soft)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
          {hasConfirmedPrompts ? t('workflow.ready') : t('workflow.pending')}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-[var(--card-border)] p-4">
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          ['1', t('workflow.stepOutline')],
          ['2', t('workflow.stepPrompts')],
          ['3', t('workflow.stepImages')]
        ].map(([index, label], stepIndex) => (
          <div
            key={index}
            className={`rounded-xl border px-3 py-2 ${
              (status === 'outline_ready' && stepIndex === 0) ||
              (status === 'prompts_ready' && stepIndex <= 1) ||
              (hasConfirmedPrompts && stepIndex <= 1)
                ? 'border-primary-200 bg-primary-50 text-primary-800'
                : 'border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-muted)]'
            }`}
          >
            <span className="mr-1 font-semibold">{index}</span>
            {label}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerateOutline}
        disabled={!canPlan}
        className="w-full rounded-xl bg-[var(--surface-muted)] border border-[var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-strong)] hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'outline_loading' ? t('workflow.outlineLoading') : t('workflow.generateOutline')}
      </button>

      {outline && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text-strong)]">{t('workflow.outlinePlan')}</p>
              <span className="text-xs text-[var(--text-muted)]">
                {t('workflow.outlinePages', { count: outline.slides.length })}
              </span>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">{t('workflow.deckTitle')}</span>
                <input
                  value={outline.title}
                  onChange={(event) => updateOutlineField('title', event.target.value)}
                  className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                  aria-label={t('workflow.deckTitle')}
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">{t('workflow.audience')}</span>
                  <input
                    value={outline.audience}
                    onChange={(event) => updateOutlineField('audience', event.target.value)}
                    className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                    aria-label={t('workflow.audience')}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">{t('workflow.designStyle')}</span>
                  <input
                    value={outline.design_style}
                    onChange={(event) => updateOutlineField('design_style', event.target.value)}
                    className="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                    aria-label={t('workflow.designStyle')}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">{t('workflow.absorbedRequirements')}</span>
                <textarea
                  value={outline.user_requirements}
                  onChange={(event) => updateOutlineField('user_requirements', event.target.value)}
                  rows={2}
                  className="w-full resize-y rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                  aria-label={t('workflow.absorbedRequirements')}
                />
              </label>
            </div>

            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
              {outline.slides.map((slide) => {
                const isExpanded = expandedOutlinePages.has(slide.page)
                return (
                  <article key={slide.page} className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                        {slide.page}
                      </span>
                      <div className="min-w-0 flex-1">
                        <label className="block">
                          <span className="sr-only">{t('workflow.slideTitle', { page: slide.page })}</span>
                          <input
                            value={slide.title}
                            onChange={(event) => updateSlideField(slide.page, 'title', event.target.value)}
                            className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-[var(--text-strong)] focus:border-[var(--border-soft)] focus:bg-[var(--surface-muted)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                            aria-label={t('workflow.slideTitle', { page: slide.page })}
                          />
                        </label>
                        <p className="line-clamp-2 px-1 text-xs leading-5 text-[var(--text-muted)]">{slide.narrative_goal}</p>
                      </div>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleOutlinePage(slide.page)}
                        className="rounded-full border border-[var(--border-soft)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:border-primary-300 hover:text-primary-700"
                      >
                        {t(isExpanded ? 'workflow.collapseOutline' : 'workflow.expandOutline', { page: slide.page })}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 grid gap-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
                            {t('workflow.narrativeGoal', { page: slide.page })}
                          </span>
                          <textarea
                            value={slide.narrative_goal}
                            onChange={(event) => updateSlideField(slide.page, 'narrative_goal', event.target.value)}
                            rows={2}
                            className="w-full resize-y rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                            aria-label={t('workflow.narrativeGoal', { page: slide.page })}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
                            {t('workflow.keyPoints', { page: slide.page })}
                          </span>
                          <textarea
                            value={slide.key_points.join('\n')}
                            onChange={(event) => updateSlideKeyPoints(slide.page, event.target.value)}
                            rows={Math.min(5, Math.max(2, slide.key_points.length))}
                            className="w-full resize-y rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                            aria-label={t('workflow.keyPoints', { page: slide.page })}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
                            {t('workflow.visualDirection', { page: slide.page })}
                          </span>
                          <textarea
                            value={slide.visual_direction}
                            onChange={(event) => updateSlideField(slide.page, 'visual_direction', event.target.value)}
                            rows={2}
                            className="w-full resize-y rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-primary-300"
                            aria-label={t('workflow.visualDirection', { page: slide.page })}
                          />
                        </label>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeneratePrompts}
            disabled={status === 'prompts_loading'}
            className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-warm disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'prompts_loading' ? t('workflow.promptsLoading') : t('workflow.confirmOutline')}
          </button>
        </div>
      )}

      {slidePrompts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{t('workflow.pageDesigns')}</p>
            <span className="text-xs text-[var(--text-muted)]">{t('workflow.confirmedCount', { count: slidePrompts.length })}</span>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {slidePrompts.map((slide) => (
              <article key={slide.page} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-3">
                <div className="mb-1 flex items-start gap-2">
                  <span className="mt-0.5 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                    {slide.page}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-[var(--text-strong)]">{slide.title}</h4>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{slide.content_summary}</p>
                  </div>
                  <button
                    type="button"
                    aria-expanded={expandedDesignPages.has(slide.page)}
                    onClick={() => toggleDesignPage(slide.page)}
                    className="rounded-full border border-[var(--border-soft)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:border-primary-300 hover:text-primary-700"
                  >
                    {t(expandedDesignPages.has(slide.page) ? 'workflow.collapseDesign' : 'workflow.expandDesign', { page: slide.page })}
                  </button>
                </div>
                {expandedDesignPages.has(slide.page) && (
                  <div className="mt-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2">
                    {renderLines(slide.display_content || slide.content_summary).map((line) => (
                      <p key={line} className="text-xs leading-5 text-[var(--text-muted)]">{line}</p>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {children && (
        <div className="border-t border-[var(--border-soft)] pt-4">
          {children}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
        </div>
      )}
    </section>
  )
}

export default DesignWorkflowPanel
