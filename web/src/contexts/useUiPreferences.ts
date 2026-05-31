import { useContext } from 'react'
import { UiPreferencesContext } from './UiPreferencesContextValue'

export function useUiPreferences() {
  return useContext(UiPreferencesContext)
}
