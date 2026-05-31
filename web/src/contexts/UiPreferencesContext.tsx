import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Language, translate } from '../i18n'
import { UiPreferencesContext } from './UiPreferencesContextValue'
import type { ThemeMode, UiPreferencesContextValue } from './UiPreferencesContextValue'

const STORAGE_KEY = 'aippt_ui_preferences'

function loadPreferences(): { language: Language; theme: ThemeMode } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { language: 'zh', theme: 'light' }
    const parsed = JSON.parse(raw)
    return {
      language: parsed.language === 'en' ? 'en' : 'zh',
      theme: parsed.theme === 'dark' ? 'dark' : 'light'
    }
  } catch {
    return { language: 'zh', theme: 'light' }
  }
}

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(loadPreferences)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    document.documentElement.lang = preferences.language === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark')
  }, [preferences])

  const setLanguage = useCallback((language: Language) => {
    setPreferences(prev => ({ ...prev, language }))
  }, [])

  const setTheme = useCallback((theme: ThemeMode) => {
    setPreferences(prev => ({ ...prev, theme }))
  }, [])

  const value = useMemo<UiPreferencesContextValue>(() => ({
    language: preferences.language,
    theme: preferences.theme,
    setLanguage,
    setTheme,
    t: (key, vars) => translate(preferences.language, key, vars)
  }), [preferences.language, preferences.theme, setLanguage, setTheme])

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  )
}
