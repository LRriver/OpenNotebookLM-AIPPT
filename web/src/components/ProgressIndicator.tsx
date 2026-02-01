interface ProgressIndicatorProps {
  current: number
  total: number
  status: string
  message: string
  error?: string | null
}

/**
 * 进度指示器组件 - 橙黄主题
 */
function ProgressIndicator({
  current,
  total,
  status,
  message,
  error
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  
  const getStatusColor = () => {
    if (error) return 'text-red-600'
    if (status === 'completed') return 'text-green-600'
    return 'text-primary-600'
  }
  
  const getProgressBarColor = () => {
    if (error) return 'bg-red-500'
    if (status === 'completed') return 'bg-green-500'
    return 'bg-gradient-to-r from-primary-500 to-accent-500'
  }
  
  const getStatusIcon = () => {
    if (error) {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )
    }
    if (status === 'completed') {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    }
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-lg flex items-center justify-center">
        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="bg-warm-50 rounded-xl p-4 border border-warm-200">
      {/* 状态头部 */}
      <div className="flex items-center gap-3 mb-4">
        {getStatusIcon()}
        <div>
          <span className={`text-sm font-semibold ${getStatusColor()}`}>{message}</span>
          {total > 0 && (
            <p className="text-xs text-warm-500 mt-0.5">{current} / {total} 页</p>
          )}
        </div>
      </div>
      
      {/* 进度条 */}
      {total > 0 && (
        <div className="mb-3">
          <div className="w-full bg-warm-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-warm-500 mt-2">
            <span>进度</span>
            <span className="font-medium text-warm-700">{percentage}%</span>
          </div>
        </div>
      )}
      
      {/* 页数统计 */}
      {total > 0 && status !== 'started' && status !== 'generating_prompts' && (
        <div className="flex items-center gap-4 text-sm pt-2 border-t border-warm-200">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-warm-600">已完成 {current}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-warm-300" />
            <span className="text-warm-600">剩余 {total - current}</span>
          </div>
        </div>
      )}
      
      {/* 错误信息 */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}

export default ProgressIndicator
