interface ProgressIndicatorProps {
  current: number
  total: number
  status: string
  message: string
  error?: string | null
}

/**
 * 进度指示器组件
 * 
 * 功能：
 * - 显示当前生成进度
 * - 显示已完成的页数
 * - 显示进度条
 * - 显示状态消息
 */
function ProgressIndicator({
  current,
  total,
  status,
  message,
  error
}: ProgressIndicatorProps) {
  // 计算进度百分比
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  
  // 根据状态确定颜色
  const getStatusColor = () => {
    if (error) return 'text-red-600'
    if (status === 'completed') return 'text-green-600'
    return 'text-blue-600'
  }
  
  const getProgressBarColor = () => {
    if (error) return 'bg-red-500'
    if (status === 'completed') return 'bg-green-500'
    return 'bg-blue-500'
  }
  
  // 获取状态图标
  const getStatusIcon = () => {
    if (error) {
      return (
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    if (status === 'completed') {
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    // 加载中动画
    return (
      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* 状态头部 */}
      <div className="flex items-center gap-2 mb-3">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {message}
        </span>
      </div>
      
      {/* 进度条 */}
      {total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>进度</span>
            <span>{current} / {total} 页</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {percentage}%
          </div>
        </div>
      )}
      
      {/* 页数统计 */}
      {total > 0 && status !== 'started' && status !== 'generating_prompts' && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">已完成: {current}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-600">剩余: {total - current}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 错误信息 */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

export default ProgressIndicator
