import { useCallback } from 'react'
import Layout from './components/Layout'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import ApiConfigForm from './components/ApiConfigForm'
import GenerationConfigForm from './components/GenerationConfigForm'
import GenerateButton from './components/GenerateButton'
import ProgressIndicator from './components/ProgressIndicator'
import { AppStateProvider, useAppState } from './contexts/AppStateContext'
import { useGeneration } from './hooks/useGeneration'
import { useEdit } from './hooks/useEdit'
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
    if (slide) {
      selectSlide(slideId)
      beginEdit(slide)
    }
  }, [selectSlide, slides, beginEdit])

  const handleApiConfigChange = useCallback((config: ApiConfig) => {
    setApiConfig(config)
  }, [setApiConfig])

  const handleGenerationConfigChange = useCallback((config: GenerationConfig) => {
    setGenerationConfig(config)
  }, [setGenerationConfig])

  const handleGenerate = useCallback(() => {
    generate()
  }, [generate])

  return (
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
          onEditCancel={cancelEdit}
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
