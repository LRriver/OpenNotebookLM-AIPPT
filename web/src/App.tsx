import { useState } from 'react'
import Layout from './components/Layout'
import LeftPanel from './components/LeftPanel'
import CenterPanel from './components/CenterPanel'
import RightPanel from './components/RightPanel'
import { Slide, EditSession } from './types'

function App() {
  // File state
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')

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
          {/* Settings forms will be added in later tasks */}
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
