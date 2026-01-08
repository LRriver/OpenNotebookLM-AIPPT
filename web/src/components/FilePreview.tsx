import { useMemo } from 'react'

interface FilePreviewProps {
  fileName: string
  content: string
  maxHeight?: string
}

/**
 * Markdown 内容预览组件
 * 显示上传文件的内容，支持基础语法高亮
 * 
 * Requirements: 2.2
 */
function FilePreview({ fileName, content, maxHeight = '100%' }: FilePreviewProps) {
  /**
   * 简单的 Markdown 语法高亮
   * 为标题、代码块、链接等添加不同的样式
   */
  const highlightedContent = useMemo(() => {
    if (!content) return []

    const lines = content.split('\n')
    return lines.map((line, index) => {
      // 标题 (# ## ### etc.)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const text = headingMatch[2]
        const sizeClass = {
          1: 'text-lg font-bold text-gray-900',
          2: 'text-base font-bold text-gray-800',
          3: 'text-sm font-semibold text-gray-800',
          4: 'text-sm font-semibold text-gray-700',
          5: 'text-xs font-semibold text-gray-700',
          6: 'text-xs font-semibold text-gray-600',
        }[level] || 'text-sm font-semibold text-gray-700'

        return (
          <div key={index} className={`${sizeClass} py-1`}>
            <span className="text-blue-500">{headingMatch[1]}</span> {text}
          </div>
        )
      }

      // 代码块开始/结束 (```)
      if (line.startsWith('```')) {
        const lang = line.slice(3).trim()
        return (
          <div key={index} className="text-purple-600 bg-gray-100 px-1 rounded">
            {line}
            {lang && <span className="text-gray-500 ml-2">({lang})</span>}
          </div>
        )
      }

      // 行内代码 (`code`)
      if (line.includes('`')) {
        const parts = line.split(/(`[^`]+`)/)
        return (
          <div key={index} className="text-gray-700">
            {parts.map((part, i) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code
                    key={i}
                    className="bg-gray-100 text-pink-600 px-1 rounded text-xs"
                  >
                    {part}
                  </code>
                )
              }
              return <span key={i}>{part}</span>
            })}
          </div>
        )
      }

      // 列表项 (- or * or 1.)
      const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
      if (listMatch) {
        const indent = listMatch[1]
        const marker = listMatch[2]
        const text = listMatch[3]
        return (
          <div key={index} className="text-gray-700">
            <span className="text-gray-400">{indent}</span>
            <span className="text-blue-500">{marker}</span> {text}
          </div>
        )
      }

      // 引用 (>)
      if (line.startsWith('>')) {
        return (
          <div
            key={index}
            className="text-gray-600 italic border-l-2 border-gray-300 pl-2"
          >
            {line}
          </div>
        )
      }

      // 粗体和斜体
      if (line.includes('**') || line.includes('*')) {
        let processed = line
        // 粗体
        processed = processed.replace(
          /\*\*([^*]+)\*\*/g,
          '<strong class="font-bold">$1</strong>'
        )
        // 斜体
        processed = processed.replace(
          /\*([^*]+)\*/g,
          '<em class="italic">$1</em>'
        )
        return (
          <div
            key={index}
            className="text-gray-700"
            dangerouslySetInnerHTML={{ __html: processed }}
          />
        )
      }

      // 链接 [text](url)
      if (line.includes('[') && line.includes('](')) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        const parts: (string | JSX.Element)[] = []
        let lastIndex = 0
        let match

        while ((match = linkRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index))
          }
          parts.push(
            <span key={match.index} className="text-blue-600 underline">
              [{match[1]}]({match[2]})
            </span>
          )
          lastIndex = match.index + match[0].length
        }

        if (lastIndex < line.length) {
          parts.push(line.slice(lastIndex))
        }

        return (
          <div key={index} className="text-gray-700">
            {parts}
          </div>
        )
      }

      // 空行
      if (line.trim() === '') {
        return <div key={index} className="h-4" />
      }

      // 普通文本
      return (
        <div key={index} className="text-gray-700">
          {line}
        </div>
      )
    })
  }, [content])

  /**
   * 计算内容统计信息
   */
  const stats = useMemo(() => {
    if (!content) return { lines: 0, chars: 0, words: 0 }
    
    const lines = content.split('\n').length
    const chars = content.length
    // 简单的中英文混合字数统计
    const words = content
      .replace(/[\u4e00-\u9fa5]/g, ' $& ')
      .split(/\s+/)
      .filter(Boolean).length

    return { lines, chars, words }
  }, [content])

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">文件预览</h3>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span>{stats.lines} 行</span>
          <span>{stats.chars} 字符</span>
        </div>
      </div>

      {/* 文件名 */}
      {fileName && (
        <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="truncate">{fileName}</span>
        </div>
      )}

      {/* 内容预览区域 */}
      <div
        className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white"
        style={{ maxHeight }}
      >
        <div className="font-mono text-xs leading-relaxed">
          {highlightedContent}
        </div>
      </div>
    </div>
  )
}

export default FilePreview
