import { useContext } from 'react'
import { AppStateContext, AppStateContextType } from './AppStateContext'

export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
