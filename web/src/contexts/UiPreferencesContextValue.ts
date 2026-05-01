import { createContext } from 'react'
import { I18nKey, Language, translate } from '../i18n'

export type ThemeMode = 'light' | 'dark'

export interface UiPreferencesContextValue {
  language: Language
  theme: ThemeMode
  setLanguage: (language: Language) => void
  setTheme: (theme: ThemeMode) => void
  t: (key: I18nKey, vars?: Record<string, string | number>) => string
}

export const UiPreferencesContext = createContext<UiPreferencesContextValue>({
  language: 'zh',
  theme: 'light',
  setLanguage: () => {},
  setTheme: () => {},
  t: (key, vars) => translate('zh', key, vars)
})
