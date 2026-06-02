import { FullApiConfig, GenerationConfig } from '../types'
import { canStartGeneration } from '../utils/validation'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface GenerateButtonProps {
  fileContent: string
  apiConfig: FullApiConfig
  generationConfig: GenerationConfig
  isGenerating: boolean
  onGenerate: () => void
  canGenerate?: boolean
  disabledReason?: string
  readyLabel?: string
}

/**
 * 生成按钮组件 - 橙黄主题
 */
function GenerateButton({
  fileContent,
  apiConfig,
  generationConfig,
  isGenerating,
  onGenerate,
  canGenerate,
  disabledReason,
  readyLabel
}: GenerateButtonProps) {
  const { t } = useUiPreferences()
  const generationStatus = canStartGeneration(fileContent, apiConfig, generationConfig)
  const canActuallyStart = canGenerate ?? generationStatus.canStart
  const isDisabled = !canActuallyStart || isGenerating
  const reason = canGenerate === false ? disabledReason : generationStatus.reason

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isDisabled}
        onClick={onGenerate}
        className={`
          w-full px-5 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300
          flex items-center justify-center gap-2.5 shadow-sm
          ${isGenerating
            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white cursor-wait shadow-warm'
            : canActuallyStart
              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 hover:shadow-warm-lg active:scale-[0.98]'
              : 'bg-[var(--surface-muted)] text-[var(--text-faint)] cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{t('generate.loading')}</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{readyLabel || t('generate.ready')}</span>
          </>
        )}
      </button>
      
      {/* 显示不可生成的原因 */}
      {isDisabled && reason && !isGenerating && (
        <div className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-2xl">
          <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-700">{reason}</p>
        </div>
      )}
    </div>
  )
}

export default GenerateButton
