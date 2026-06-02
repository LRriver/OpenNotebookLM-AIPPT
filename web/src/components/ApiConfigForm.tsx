import { ReactNode, useEffect, useState } from 'react'
import { FullApiConfig, ImageApiConfig, TextApiConfig } from '../types'
import { loadFullApiConfig, saveFullApiConfig, validateFullApiConfig } from '../utils/apiConfig'
import { loadBackendModelProfiles, saveBackendModelProfiles } from '../services/modelProfileService'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface ApiConfigFormProps {
  onConfigChange?: (config: FullApiConfig) => void
  initialConfig?: FullApiConfig
}

type ModelSection = 'image' | 'edit' | 'text'

interface ModelCardProps {
  id: ModelSection
  title: string
  subtitle: string
  tone: 'amber' | 'violet' | 'emerald'
  model: string
  isOpen: boolean
  hasError?: boolean
  errorLabel: string
  emptyModelLabel: string
  onToggle: (id: ModelSection) => void
  children: ReactNode
}

const toneStyles = {
  amber: {
    card: 'border-amber-200 bg-amber-50/75',
    icon: 'bg-white text-amber-700 shadow-sm',
    badge: 'bg-white/80 text-amber-800 border-amber-200',
  },
  violet: {
    card: 'border-violet-200 bg-violet-50/55',
    icon: 'bg-white text-violet-700 shadow-sm',
    badge: 'bg-white/80 text-violet-800 border-violet-200',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50/55',
    icon: 'bg-white text-emerald-700 shadow-sm',
    badge: 'bg-white/80 text-emerald-800 border-emerald-200',
  },
}

function ModelCard({
  id,
  title,
  subtitle,
  tone,
  model,
  isOpen,
  hasError = false,
  errorLabel,
  emptyModelLabel,
  onToggle,
  children,
}: ModelCardProps) {
  const styles = toneStyles[tone]

  return (
    <section className={`rounded-2xl border ${styles.card} overflow-hidden shadow-sm`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-white/45 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}
          >
            {id === 'text' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            ) : id === 'edit' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 000-2.828l-2.172-2.172a2 2 0 00-2.828 0L4.293 14.707A1 1 0 004 15.414V20z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-strong)]">{title}</h4>
              {hasError && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  {errorLabel}
                </span>
              )}
            </div>
            {isOpen && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
            <div className={`${isOpen ? 'mt-3' : 'mt-1'} flex flex-wrap gap-2`}>
              <span
                className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles.badge}`}
              >
                {model || emptyModelLabel}
              </span>
            </div>
          </div>
        </div>
        <svg
          className={`mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-white/70 bg-white/80 p-4 space-y-3">{children}</div>
      )}
    </section>
  )
}

/**
 * API 配置表单组件
 */
function ApiConfigForm({ onConfigChange, initialConfig }: ApiConfigFormProps) {
  const { t } = useUiPreferences()
  const [config, setConfig] = useState<FullApiConfig>(() => initialConfig || loadFullApiConfig())
  const [errors, setErrors] = useState<{
    image?: { apiKey?: string; baseUrl?: string; model?: string }
    text?: { apiKey?: string; baseUrl?: string; model?: string }
    edit?: { apiKey?: string; baseUrl?: string; model?: string }
  }>({})
  const [openSections, setOpenSections] = useState<Record<ModelSection, boolean>>(() => {
    const loaded = initialConfig || loadFullApiConfig()
    return {
      image: !loaded.image.baseUrl,
      edit: !(loaded.edit || loaded.image).baseUrl,
      text: !loaded.text.baseUrl,
    }
  })
  const [showImageApiKey, setShowImageApiKey] = useState(false)
  const [showTextApiKey, setShowTextApiKey] = useState(false)
  const [showEditApiKey, setShowEditApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [useSharedConfig, setUseSharedConfig] = useState(() => {
    const loaded = loadFullApiConfig()
    return Boolean(loaded.image.baseUrl && loaded.image.baseUrl === loaded.text.baseUrl)
  })

  useEffect(() => {
    let cancelled = false
    loadBackendModelProfiles()
      .then((response) => {
        if (cancelled || !response.success || !response.profiles) return
        const { prompt_model, image_model, edit_model } = response.profiles
        setConfig((prev) => ({
          image: {
            apiKey: prev.image.apiKey,
            baseUrl: image_model.base_url,
            model: image_model.model,
          },
          text: {
            apiKey: prev.text.apiKey,
            baseUrl: prompt_model.base_url,
            model: prompt_model.model,
            format: 'openai',
            thinking: prompt_model.thinking || prev.text.thinking || 'disabled',
          },
          edit: {
            apiKey: prev.edit?.apiKey || '',
            baseUrl: edit_model.base_url,
            model: edit_model.model,
          },
        }))
        setOpenSections({
          image: !image_model.base_url,
          edit: !edit_model.base_url,
          text: !prompt_model.base_url,
        })
      })
      .catch(() => {
        setOpenSections({ image: true, edit: true, text: true })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    onConfigChange?.(config)
  }, [config, onConfigChange])

  useEffect(() => {
    if (useSharedConfig) {
      setConfig((prev) => ({
        ...prev,
        text: { ...prev.text, apiKey: prev.image.apiKey, baseUrl: prev.image.baseUrl },
        edit: {
          ...(prev.edit || prev.image),
          apiKey: prev.image.apiKey,
          baseUrl: prev.image.baseUrl,
        },
      }))
    }
  }, [useSharedConfig])

  const toggleSection = (section: ModelSection) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleImageConfigChange = (field: keyof ImageApiConfig, value: string) => {
    setConfig((prev) => {
      const newConfig = { ...prev, image: { ...prev.image, [field]: value } }
      if (useSharedConfig && (field === 'apiKey' || field === 'baseUrl')) {
        newConfig.text = { ...newConfig.text, [field]: value }
      }
      if (!prev.edit || prev.edit[field] === prev.image[field]) {
        newConfig.edit = { ...(prev.edit || prev.image), [field]: value }
      }
      return newConfig
    })
    setSaved(false)
    if (errors.image?.[field]) {
      setErrors((prev) => ({ ...prev, image: { ...prev.image, [field]: undefined } }))
    }
  }

  const handleTextConfigChange = (field: keyof TextApiConfig, value: string | null) => {
    setConfig((prev) => ({ ...prev, text: { ...prev.text, [field]: value } }))
    setSaved(false)
    if (errors.text?.[field as keyof typeof errors.text]) {
      setErrors((prev) => ({ ...prev, text: { ...prev.text, [field]: undefined } }))
    }
  }

  const handleEditConfigChange = (field: keyof ImageApiConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      edit: { ...(prev.edit || prev.image), [field]: value },
    }))
    setSaved(false)
    if (errors.edit?.[field]) {
      setErrors((prev) => ({ ...prev, edit: { ...prev.edit, [field]: undefined } }))
    }
  }

  const handleSave = async () => {
    const validation = validateFullApiConfig(config)
    if (!validation.isValid) {
      setErrors(validation.errors)
      setIsOpen(true)
      setOpenSections((prev) => ({
        image: prev.image || Boolean(validation.errors.image),
        edit: prev.edit || Boolean(validation.errors.edit),
        text: prev.text || Boolean(validation.errors.text),
      }))
      return
    }
    try {
      await saveBackendModelProfiles(config)
      saveFullApiConfig(config)
      setErrors({})
      setSaveError(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('api.saveError'))
    }
  }

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-2.5 text-sm border rounded-xl transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent
    ${hasError ? 'border-red-400 bg-red-50' : 'border-[var(--border-soft)] bg-white/85'}
  `
  const keyPlaceholder = (hasBaseUrl: boolean, label: string) =>
    hasBaseUrl ? t('api.keyConfiguredPlaceholder') : t('api.keyPlaceholder', { label })

  const renderKeyField = (
    value: string,
    onChange: (value: string) => void,
    showKey: boolean,
    setShowKey: (value: boolean) => void,
    placeholder: string,
    hasError: boolean
  ) => (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
        {t('api.key')}
      </label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${inputClass(hasError)} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-faint)] hover:text-[var(--text-strong)]"
          aria-label={showKey ? t('api.hideKey') : t('api.showKey')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {showKey ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.59M9.88 5.09A10.64 10.64 0 0112 4.88c5 0 8.65 3.36 10 7.12a11.3 11.3 0 01-3.07 4.54M6.1 6.1A11.22 11.22 0 002 12c1.35 3.76 5 7.12 10 7.12 1.44 0 2.78-.28 3.98-.79"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.46 12C3.73 7.94 7.52 5 12 5c4.48 0 8.27 2.94 9.54 7-1.27 4.06-5.06 7-9.54 7-4.48 0-8.27-2.94-9.54-7z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            )}
          </svg>
        </button>
      </div>
    </div>
  )

  const editConfig = config.edit || config.image
  const configuredModels = [config.text.model, config.image.model, editConfig.model].filter(Boolean)
  const modelSummary =
    configuredModels.length > 0 ? configuredModels.join(' / ') : t('api.unsetModel')

  return (
    <section className="aippt-soft-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-white/45 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--model-header-bg)] flex items-center justify-center shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <svg
              className="w-4 h-4 text-primary-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-strong)]">{t('api.title')}</h3>
            <p className="truncate text-xs text-[var(--text-muted)]">{modelSummary}</p>
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
        <div className="space-y-4 border-t border-[var(--card-border)] p-4">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--model-header-bg)] text-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-primary-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t('api.title')}</h3>
                    <p className="text-xs text-slate-300">{t('api.subtitle')}</p>
                  </div>
                </div>
              </div>
              <label className="flex shrink-0 items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSharedConfig}
                  onChange={(event) => setUseSharedConfig(event.target.checked)}
                  className="w-4 h-4 rounded border-slate-400 text-primary-500 focus:ring-primary-400"
                />
                {t('api.shared')}
              </label>
            </div>
          </div>

          <ModelCard
            id="image"
            title={t('api.image.title')}
            subtitle={t('api.image.subtitle')}
            tone="amber"
            model={config.image.model}
            isOpen={openSections.image}
            hasError={Boolean(errors.image)}
            errorLabel={t('api.needsCheck')}
            emptyModelLabel={t('api.unsetModel')}
            onToggle={toggleSection}
          >
            {renderKeyField(
              config.image.apiKey,
              (value) => handleImageConfigChange('apiKey', value),
              showImageApiKey,
              setShowImageApiKey,
              keyPlaceholder(!!config.image.baseUrl, t('api.imageLabel')),
              !!errors.image?.apiKey
            )}
            {errors.image?.apiKey && <p className="text-xs text-red-500">{errors.image.apiKey}</p>}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.baseUrl')}
              </label>
              <input
                type="text"
                value={config.image.baseUrl}
                onChange={(event) => handleImageConfigChange('baseUrl', event.target.value)}
                placeholder={t('api.imageBasePlaceholder')}
                className={inputClass(!!errors.image?.baseUrl)}
              />
              {errors.image?.baseUrl && (
                <p className="mt-1 text-xs text-red-500">{errors.image.baseUrl}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.modelName')}
              </label>
              <input
                type="text"
                value={config.image.model}
                onChange={(event) => handleImageConfigChange('model', event.target.value)}
                placeholder="gpt-image-2"
                className={inputClass(!!errors.image?.model)}
              />
              {errors.image?.model && (
                <p className="mt-1 text-xs text-red-500">{errors.image.model}</p>
              )}
            </div>
          </ModelCard>

          <ModelCard
            id="edit"
            title={t('api.edit.title')}
            subtitle={t('api.edit.subtitle')}
            tone="violet"
            model={editConfig.model}
            isOpen={openSections.edit}
            hasError={Boolean(errors.edit)}
            errorLabel={t('api.needsCheck')}
            emptyModelLabel={t('api.unsetModel')}
            onToggle={toggleSection}
          >
            {renderKeyField(
              editConfig.apiKey,
              (value) => handleEditConfigChange('apiKey', value),
              showEditApiKey,
              setShowEditApiKey,
              keyPlaceholder(!!editConfig.baseUrl, t('api.editLabel')),
              !!errors.edit?.apiKey
            )}
            {errors.edit?.apiKey && <p className="text-xs text-red-500">{errors.edit.apiKey}</p>}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.baseUrl')}
              </label>
              <input
                type="text"
                value={editConfig.baseUrl}
                onChange={(event) => handleEditConfigChange('baseUrl', event.target.value)}
                placeholder={t('api.editBasePlaceholder')}
                className={inputClass(!!errors.edit?.baseUrl)}
              />
              {errors.edit?.baseUrl && (
                <p className="mt-1 text-xs text-red-500">{errors.edit.baseUrl}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.modelName')}
              </label>
              <input
                type="text"
                value={editConfig.model}
                onChange={(event) => handleEditConfigChange('model', event.target.value)}
                placeholder="gpt-image-2"
                className={inputClass(!!errors.edit?.model)}
              />
              {errors.edit?.model && (
                <p className="mt-1 text-xs text-red-500">{errors.edit.model}</p>
              )}
            </div>
          </ModelCard>

          <ModelCard
            id="text"
            title={t('api.text.title')}
            subtitle={t('api.text.subtitle')}
            tone="emerald"
            model={config.text.model}
            isOpen={openSections.text}
            hasError={Boolean(errors.text)}
            errorLabel={t('api.needsCheck')}
            emptyModelLabel={t('api.unsetModel')}
            onToggle={toggleSection}
          >
            {renderKeyField(
              config.text.apiKey,
              (value) => handleTextConfigChange('apiKey', value),
              showTextApiKey,
              setShowTextApiKey,
              keyPlaceholder(!!config.text.baseUrl, t('api.textLabel')),
              !!errors.text?.apiKey
            )}
            {errors.text?.apiKey && <p className="text-xs text-red-500">{errors.text.apiKey}</p>}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.baseUrl')}
              </label>
              <input
                type="text"
                value={config.text.baseUrl}
                onChange={(event) => handleTextConfigChange('baseUrl', event.target.value)}
                placeholder={t('api.imageBasePlaceholder')}
                className={inputClass(!!errors.text?.baseUrl)}
              />
              {errors.text?.baseUrl && (
                <p className="mt-1 text-xs text-red-500">{errors.text.baseUrl}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.modelName')}
              </label>
              <input
                type="text"
                value={config.text.model}
                onChange={(event) => handleTextConfigChange('model', event.target.value)}
                placeholder={t('api.textModelPlaceholder')}
                className={inputClass(!!errors.text?.model)}
              />
              {errors.text?.model && (
                <p className="mt-1 text-xs text-red-500">{errors.text.model}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.format')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['gemini', 'openai'] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => handleTextConfigChange('format', format)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      config.text.format === format
                        ? 'bg-[var(--text-strong)] text-white border-[var(--text-strong)] shadow-sm'
                        : 'bg-white/85 text-[var(--text)] border-[var(--border-soft)] hover:border-emerald-300'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('api.thinking')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'disabled', label: t('api.thinking.disabled') },
                    { value: 'enabled', label: t('api.thinking.enabled') },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTextConfigChange('thinking', option.value)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      (config.text.thinking || 'disabled') === option.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white/85 text-[var(--text)] border-[var(--border-soft)] hover:border-emerald-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </ModelCard>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={handleSave} className="btn-primary">
              {t('common.save')}
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-primary-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t('common.saved')}
              </span>
            )}
          </div>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        </div>
      )}
    </section>
  )
}

export default ApiConfigForm
