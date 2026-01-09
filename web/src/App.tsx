import { useCallback, useState } from 'react'
import Layout from './components/Layout'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import ApiConfigForm from './components/ApiConfigForm'
import GenerationConfigForm from './components/GenerationConfigForm'
import GenerateButton from './components/GenerateButton'
import ProgressIndicator from './components/ProgressIndicator'
import ConfirmDialog from './components/ConfirmDialog'
import { AppStateProvider, useAppState } from './contexts/AppStateContext'
import { useGeneration } from './hooks/useGeneration'
import { useEdit } from './hooks/useEdit'
import { useEditConflict } from './hooks/useEditConflict'
import { useExport } from './hooks/useExport'
import { ApiConfig, GenerationConfig, ExportFormat } from './types'

/**
 * 主应用内容组件
 * 使用 Context 中的状态
 */
function AppContent() {
  const {
    state,
    setFile,
    setApiConfig,
    setGenerationConfig,
    selectSlide
  } = useAppState()
  
  const { generate, isGenerating, progress, error, slides } = useGeneration()
  const {
    editSession,
    isEditing,
    beginEdit,
    submitEdit,
    revertToVersion,
    confirmEdit,
    cancelEdit
  } = useEdit()
  const {
    showConfirmDialog,
    tryStartEdit,
    tryCancelEdit,
    confirmDiscard,
    cancelDiscard
  } = useEditConflict()
  const {
    state: exportState,
    startExport
  } = useExport(slides)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFile(file, content, file.name)
    }
    reader.readAsText(file)
  }, [setFile])

  const handleSlideSelect = useCallback((slideId: string) => {
    selectSlide(slideId)
  }, [selectSlide])

  const handleSlideEdit = useCallback((slideId: string) => {
    // 找到要编辑的幻灯片
    const slide = slides.find(s => s.id === slideId)
    if (!slide) return

    // 检查是否有未保存的编辑
    if (tryStartEdit(editSession, slide)) {
      // 可以直接开始编辑
      selectSlide(slideId)
      beginEdit(slide)
    }
    // 如果返回 false，会显示确认对话框，用户确认后再处理
  }, [selectSlide, slides, beginEdit, editSession, tryStartEdit])

  const handleApiConfigChange = useCallback((config: ApiConfig) => {
    setApiConfig(config)
  }, [setApiConfig])

  const handleGenerationConfigChange = useCallback((config: GenerationConfig) => {
    setGenerationConfig(config)
  }, [setGenerationConfig])

  const handleGenerate = useCallback(() => {
    generate()
  }, [generate])

  // 处理取消编辑（带冲突检测）
  const handleEditCancel = useCallback(() => {
    if (tryCancelEdit(editSession)) {
      // 可以直接取消
      cancelEdit()
    }
    // 如果返回 false，会显示确认对话框
  }, [editSession, tryCancelEdit, cancelEdit])

  // 用户确认放弃编辑
  const handleConfirmDiscard = useCallback(() => {
    const action = confirmDiscard()
    if (!action) return

    if (action.type === 'switch' && action.targetSlide) {
      // 切换到新的幻灯片编辑
      cancelEdit()
      selectSlide(action.targetSlide.id)
      beginEdit(action.targetSlide)
    } else if (action.type === 'cancel') {
      // 取消当前编辑
      cancelEdit()
    }
  }, [confirmDiscard, cancelEdit, selectSlide, beginEdit])

  // 用户取消放弃编辑（继续编辑）
  const handleCancelDiscard = useCallback(() => {
    cancelDiscard()
  }, [cancelDiscard])

  // 处理导出
  const handleExport = useCallback(async (format: ExportFormat) => {
    setExportError(null)
    try {
      await startExport(format)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '导出失败')
    }
  }, [startExport])

  return (
    <>
    <Layout
      leftPanel={
        <LeftPanel
          fileName={state.fileName || null}
          fileContent={state.fileContent}
          onFileSelect={handleFileSelect}
        />
      }
      centerPanel={
        <CenterPanel
          isEditMode={editSession !== null}
          editSession={editSession}
          isEditing={isEditing}
          onEditSubmit={submitEdit}
          onEditConfirm={confirmEdit}
          onEditCancel={handleEditCancel}
          onRevertToVersion={revertToVersion}
        >
          {/* API 配置表单 */}
          <ApiConfigForm
            initialConfig={state.apiConfig}
            onConfigChange={handleApiConfigChange}
          />
          
          {/* 分隔线 */}
          <hr className="my-6 border-gray-200" />
          
          {/* 生成配置表单 */}
          <GenerationConfigForm
            initialConfig={state.generationConfig}
            onConfigChange={handleGenerationConfigChange}
          />
          
          {/* 分隔线 */}
          <hr className="my-6 border-gray-200" />
          
          {/* 生成按钮 */}
          <GenerateButton
            fileContent={state.fileContent}
            apiConfig={state.apiConfig}
            generationConfig={state.generationConfig}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
          
          {/* 进度指示器 - 仅在生成中或有进度时显示 */}
          {(isGenerating || progress.status === 'completed' || error) && (
            <>
              <hr className="my-6 border-gray-200" />
              <ProgressIndicator
                current={progress.current}
                total={progress.total}
                status={progress.status}
                message={progress.message}
                error={error}
              />
            </>
          )}
        </CenterPanel>
      }
      rightPanel={
        <RightPanel
          slides={slides}
          selectedSlideId={state.selectedSlideId}
          onSlideSelect={handleSlideSelect}
          onSlideEdit={handleSlideEdit}
          onExport={handleExport}
          isExporting={exportState.isExporting}
          exportProgress={exportState.progress}
        />
      }
    />

    {/* 编辑冲突确认对话框 */}
    <ConfirmDialog
      isOpen={showConfirmDialog}
      title="放弃当前编辑？"
      message="您有未保存的编辑内容。如果继续，这些修改将会丢失。"
      confirmText="放弃编辑"
      cancelText="继续编辑"
      confirmVariant="danger"
      onConfirm={handleConfirmDiscard}
      onCancel={handleCancelDiscard}
    />

    {/* 导出错误提示 */}
    {(exportError || exportState.error) && (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{exportError || exportState.error}</span>
          <button
            onClick={() => setExportError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    )}
  </>
  )
}

/**
 * 主应用组件
 * 包装 Provider
 */
function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  )
}

export default App
