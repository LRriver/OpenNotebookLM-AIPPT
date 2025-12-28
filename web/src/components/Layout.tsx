import { ReactNode } from 'react'

interface LayoutProps {
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
}

/**
 * 三栏布局组件
 * 左栏：文件上传区
 * 中栏：设置和编辑区
 * 右栏：幻灯片预览区
 */
function Layout({ leftPanel, centerPanel, rightPanel }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI PPT Generator</h1>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-0">
          {/* Left Panel - File Upload (3 columns) */}
          <div className="col-span-12 md:col-span-3 lg:col-span-3 border-r border-gray-200 bg-white overflow-y-auto">
            {leftPanel}
          </div>

          {/* Center Panel - Settings/Edit (5 columns) */}
          <div className="col-span-12 md:col-span-5 lg:col-span-5 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            {centerPanel}
          </div>

          {/* Right Panel - Preview (4 columns) */}
          <div className="col-span-12 md:col-span-4 lg:col-span-4 bg-white overflow-y-auto">
            {rightPanel}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Layout
