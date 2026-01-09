import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { Slide, EditSession, ApiConfig, GenerationConfig } from '../types'
import { loadApiConfig } from '../components/ApiConfigForm'
import { DEFAULT_GENERATION_CONFIG } from '../components/GenerationConfigForm'

/**
 * 应用状态接口
 */
export interface AppState {
  // 文件状态
  uploadedFile: File | null
  fileContent: string
  fileName: string

  // API 配置
  apiConfig: ApiConfig

  // 生成配置
  generationConfig: GenerationConfig

  // 生成状态
  slides: Slide[]
  isGenerating: boolean
  generationProgress: {
    current: number
    total: number
    status: string
    message: string
  }
  generationError: string | null

  // 编辑状态
  editingSlide: EditSession | null
  selectedSlideId: string | null
}

/**
 * 初始状态
 */
const initialState: AppState = {
  uploadedFile: null,
  fileContent: '',
  fileName: '',
  apiConfig: loadApiConfig(),
  generationConfig: DEFAULT_GENERATION_CONFIG,
  slides: [],
  isGenerating: false,
  generationProgress: {
    current: 0,
    total: 0,
    status: '',
    message: ''
  },
  generationError: null,
  editingSlide: null,
  selectedSlideId: null
}

/**
 * Action 类型
 */
type AppAction =
  | { type: 'SET_FILE'; payload: { file: File; content: string; name: string } }
  | { type: 'CLEAR_FILE' }
  | { type: 'SET_API_CONFIG'; payload: ApiConfig }
  | { type: 'SET_GENERATION_CONFIG'; payload: GenerationConfig }
  | { type: 'START_GENERATION' }
  | { type: 'UPDATE_PROGRESS'; payload: { current: number; total: number; status: string; message: string } }
  | { type: 'ADD_SLIDE'; payload: Slide }
  | { type: 'UPDATE_SLIDE'; payload: { id: string; updates: Partial<Slide> } }
  | { type: 'SET_SLIDES'; payload: Slide[] }
  | { type: 'COMPLETE_GENERATION' }
  | { type: 'GENERATION_ERROR'; payload: string }
  | { type: 'CLEAR_GENERATION_ERROR' }
  | { type: 'SELECT_SLIDE'; payload: string | null }
  | { type: 'START_EDIT'; payload: EditSession }
  | { type: 'UPDATE_EDIT'; payload: Partial<EditSession> }
  | { type: 'END_EDIT' }
  | { type: 'RESET_STATE' }

/**
 * Reducer 函数
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return {
        ...state,
        uploadedFile: action.payload.file,
        fileContent: action.payload.content,
        fileName: action.payload.name
      }

    case 'CLEAR_FILE':
      return {
        ...state,
        uploadedFile: null,
        fileContent: '',
        fileName: ''
      }

    case 'SET_API_CONFIG':
      return {
        ...state,
        apiConfig: action.payload
      }

    case 'SET_GENERATION_CONFIG':
      return {
        ...state,
        generationConfig: action.payload
      }

    case 'START_GENERATION':
      return {
        ...state,
        isGenerating: true,
        generationProgress: {
          current: 0,
          total: 0,
          status: 'started',
          message: '开始生成 PPT'
        },
        generationError: null,
        slides: []
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        generationProgress: action.payload
      }

    case 'ADD_SLIDE': {
      // 按页码顺序插入幻灯片
      const newSlides = [...state.slides, action.payload].sort(
        (a, b) => a.pageNumber - b.pageNumber
      )
      return {
        ...state,
        slides: newSlides
      }
    }

    case 'UPDATE_SLIDE':
      return {
        ...state,
        slides: state.slides.map(slide =>
          slide.id === action.payload.id
            ? { ...slide, ...action.payload.updates }
            : slide
        )
      }

    case 'SET_SLIDES':
      return {
        ...state,
        slides: action.payload.sort((a, b) => a.pageNumber - b.pageNumber)
      }

    case 'COMPLETE_GENERATION':
      return {
        ...state,
        isGenerating: false,
        generationProgress: {
          ...state.generationProgress,
          status: 'completed',
          message: 'PPT 生成完成'
        }
      }

    case 'GENERATION_ERROR':
      return {
        ...state,
        isGenerating: false,
        generationError: action.payload
      }

    case 'CLEAR_GENERATION_ERROR':
      return {
        ...state,
        generationError: null
      }

    case 'SELECT_SLIDE':
      return {
        ...state,
        selectedSlideId: action.payload
      }

    case 'START_EDIT':
      return {
        ...state,
        editingSlide: action.payload
      }

    case 'UPDATE_EDIT':
      if (!state.editingSlide) return state
      return {
        ...state,
        editingSlide: {
          ...state.editingSlide,
          ...action.payload
        }
      }

    case 'END_EDIT':
      return {
        ...state,
        editingSlide: null
      }

    case 'RESET_STATE':
      return {
        ...initialState,
        apiConfig: state.apiConfig // 保留 API 配置
      }

    default:
      return state
  }
}

/**
 * Context 类型
 */
interface AppStateContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // 便捷方法
  setFile: (file: File, content: string, name: string) => void
  clearFile: () => void
  setApiConfig: (config: ApiConfig) => void
  setGenerationConfig: (config: GenerationConfig) => void
  startGeneration: () => void
  updateProgress: (current: number, total: number, status: string, message: string) => void
  addSlide: (slide: Slide) => void
  updateSlide: (id: string, updates: Partial<Slide>) => void
  setSlides: (slides: Slide[]) => void
  completeGeneration: () => void
  setGenerationError: (error: string) => void
  clearGenerationError: () => void
  selectSlide: (id: string | null) => void
  startEdit: (session: EditSession) => void
  updateEdit: (updates: Partial<EditSession>) => void
  endEdit: () => void
  resetState: () => void
}

/**
 * 创建 Context
 */
const AppStateContext = createContext<AppStateContextType | null>(null)

/**
 * Provider 组件
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 便捷方法
  const setFile = useCallback((file: File, content: string, name: string) => {
    dispatch({ type: 'SET_FILE', payload: { file, content, name } })
  }, [])

  const clearFile = useCallback(() => {
    dispatch({ type: 'CLEAR_FILE' })
  }, [])

  const setApiConfig = useCallback((config: ApiConfig) => {
    dispatch({ type: 'SET_API_CONFIG', payload: config })
  }, [])

  const setGenerationConfig = useCallback((config: GenerationConfig) => {
    dispatch({ type: 'SET_GENERATION_CONFIG', payload: config })
  }, [])

  const startGeneration = useCallback(() => {
    dispatch({ type: 'START_GENERATION' })
  }, [])

  const updateProgress = useCallback((current: number, total: number, status: string, message: string) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { current, total, status, message } })
  }, [])

  const addSlide = useCallback((slide: Slide) => {
    dispatch({ type: 'ADD_SLIDE', payload: slide })
  }, [])

  const updateSlide = useCallback((id: string, updates: Partial<Slide>) => {
    dispatch({ type: 'UPDATE_SLIDE', payload: { id, updates } })
  }, [])

  const setSlides = useCallback((slides: Slide[]) => {
    dispatch({ type: 'SET_SLIDES', payload: slides })
  }, [])

  const completeGeneration = useCallback(() => {
    dispatch({ type: 'COMPLETE_GENERATION' })
  }, [])

  const setGenerationError = useCallback((error: string) => {
    dispatch({ type: 'GENERATION_ERROR', payload: error })
  }, [])

  const clearGenerationError = useCallback(() => {
    dispatch({ type: 'CLEAR_GENERATION_ERROR' })
  }, [])

  const selectSlide = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_SLIDE', payload: id })
  }, [])

  const startEdit = useCallback((session: EditSession) => {
    dispatch({ type: 'START_EDIT', payload: session })
  }, [])

  const updateEdit = useCallback((updates: Partial<EditSession>) => {
    dispatch({ type: 'UPDATE_EDIT', payload: updates })
  }, [])

  const endEdit = useCallback(() => {
    dispatch({ type: 'END_EDIT' })
  }, [])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' })
  }, [])

  const value: AppStateContextType = {
    state,
    dispatch,
    setFile,
    clearFile,
    setApiConfig,
    setGenerationConfig,
    startGeneration,
    updateProgress,
    addSlide,
    updateSlide,
    setSlides,
    completeGeneration,
    setGenerationError,
    clearGenerationError,
    selectSlide,
    startEdit,
    updateEdit,
    endEdit,
    resetState
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

/**
 * 自定义 Hook 用于访问 Context
 */
export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}

export { AppStateContext }
export type { AppAction }
