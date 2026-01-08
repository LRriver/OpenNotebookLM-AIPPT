import { ApiConfig, GenerationConfig } from '../types'
import { canStartGeneration } from '../utils/validation'

interface GenerateButtonProps {
  fileContent: string
  apiConfig: ApiConfig
  generationConfig: GenerationConfig
  isGenerating: boolean
  onGenerate: () => void
}

/**
 * 生成按钮组件
 * 
 * 功能：
 * - 禁用状态（无文件或无配置时）
 * - 加载状态显示
 * - 显示不可生成的原因
 */
function GenerateButton({
  fileContent,
  apiConfig,
  generationConfig,
  isGenerating,
  onGenerate
}: GenerateButtonProps) {
  // 检查是否可以开始生成
  const generationStatus = canStartGeneration(fileContent, apiConfig, generationConfig)
  
  // 按钮是否可用
  const isDisabled = !generationStatus.canStart || isGenerating

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isDisabled}
        onClick={onGenerate}
        className={`
          w-full px-4 py-3 text-sm font-medium rounded-md transition-all
          flex items-center justify-center gap-2
          ${isGenerating
            ? 'bg-blue-600 text-white cursor-wait'
            : generationStatus.canStart
              ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isGenerating ? (
          <>
            {/* 加载动画 */}
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>正在生成...</span>
          </>
        ) : (
          <>
            {/* 生成图标 */}
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>开始生成 PPT</span>
          </>
        )}
      </button>
      
      {/* 显示不可生成的原因 */}
      {!generationStatus.canStart && generationStatus.reason && !isGenerating && (
        <p className="text-sm text-amber-600 text-center flex items-center justify-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {generationStatus.reason}
        </p>
      )}
    </div>
  )
}

export default GenerateButton
