import { useCallback } from 'react'
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
import { ApiConfig, GenerationConfig } from './types'

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
