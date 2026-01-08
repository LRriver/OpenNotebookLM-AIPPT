import { useState, useCallback } from 'react'
import Layout from './components/Layout'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import ApiConfigForm, { loadApiConfig } from './components/ApiConfigForm'
import GenerationConfigForm, { DEFAULT_GENERATION_CONFIG } from './components/GenerationConfigForm'
import { Slide, EditSession, ApiConfig, GenerationConfig } from './types'
import { canStartGeneration } from './utils/validation'

function App() {
  // File state
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')

  // API config state - load from localStorage on init
  const [apiConfig, setApiConfig] = useState<ApiConfig>(loadApiConfig)
  
  // Generation config state
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(DEFAULT_GENERATION_CONFIG)

  // Slides state
  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)

  // Edit state
  const [editSession, setEditSession] = useState<EditSession | null>(null)

  // Note: setSlides and setEditSession will be used in future tasks
  // Suppress unused variable warnings for now
  void setSlides
  void setEditSession

  const handleFileSelect = (file: File) => {
    setFileName(file.name)
    
    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)
    }
    reader.readAsText(file)
  }

  const handleSlideSelect = (slideId: string) => {
    setSelectedSlideId(slideId)
  }

  const handleApiConfigChange = useCallback((config: ApiConfig) => {
    setApiConfig(config)
  }, [])

  const handleGenerationConfigChange = useCallback((config: GenerationConfig) => {
    setGenerationConfig(config)
  }, [])

  // Check if generation can start
  const generationStatus = canStartGeneration(fileContent, apiConfig, generationConfig)

  return (
    <Layout
      leftPanel={
        <LeftPanel
          fileName={fileName}
          fileContent={fileContent}
          onFileSelect={handleFileSelect}
        />
      }
      centerPanel={
        <CenterPanel
          isEditMode={editSession !== null}
          editSession={editSession}
        >
          {/* API 配置表单 */}
          <ApiConfigForm
            initialConfig={apiConfig}
            onConfigChange={handleApiConfigChange}
          />
          
          {/* 分隔线 */}
          <hr className="my-6 border-gray-200" />
          
          {/* 生成配置表单 */}
          <GenerationConfigForm
            initialConfig={generationConfig}
            onConfigChange={handleGenerationConfigChange}
          />
          
          {/* 分隔线 */}
          <hr className="my-6 border-gray-200" />
          
          {/* 生成按钮区域 - 将在后续任务中完善 */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={!generationStatus.canStart}
              className={`w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                generationStatus.canStart
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              开始生成 PPT
            </button>
            {!generationStatus.canStart && generationStatus.reason && (
              <p className="text-sm text-amber-600 text-center">
                {generationStatus.reason}
              </p>
            )}
          </div>
        </CenterPanel>
      }
      rightPanel={
        <RightPanel
          slides={slides}
          selectedSlideId={selectedSlideId}
          onSlideSelect={handleSlideSelect}
        />
      }
    />
  )
}

export default App
