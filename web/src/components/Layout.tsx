import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Language } from '../i18n'
import type { ThemeMode } from '../contexts/UiPreferencesContextValue'
import { useUiPreferences } from '../contexts/useUiPreferences'

interface LayoutProps {
  leftPanel: ReactNode
  centerPanel: ReactNode
  rightPanel: ReactNode
}

type DragHandle = 'left-center' | 'center-right' | null

const STORAGE_KEY = 'aippt-layout-widths'
const DEFAULT_WIDTHS = { left: 25, center: 34 }
const MIN_WIDTHS = { left: 18, center: 28, right: 24 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function loadStoredWidths() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WIDTHS
    const parsed = JSON.parse(raw)
    const left = Number(parsed.left)
    const center = Number(parsed.center)
    if (!Number.isFinite(left) || !Number.isFinite(center)) return DEFAULT_WIDTHS
    const normalizedLeft = clamp(left, MIN_WIDTHS.left, 100 - MIN_WIDTHS.center - MIN_WIDTHS.right)
    const normalizedCenter = clamp(center, MIN_WIDTHS.center, 100 - normalizedLeft - MIN_WIDTHS.right)
    return { left: normalizedLeft, center: normalizedCenter }
  } catch {
    return DEFAULT_WIDTHS
  }
}

function SunIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0-1.414-1.414M7.05 7.05 5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  )
}

function MoonIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 118.646 3.646 7 7 0 0020.354 15.354z" />
    </svg>
  )
}

/**
 * 三栏布局组件
 * 左栏：文件上传区
 * 中栏：设置和编辑区
 * 右栏：幻灯片预览区
 */
function Layout({ leftPanel, centerPanel, rightPanel }: LayoutProps) {
  const { language, theme, setLanguage, setTheme, t } = useUiPreferences()
  const containerRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState(loadStoredWidths)
  const [dragging, setDragging] = useState<DragHandle>(null)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  const rightWidth = useMemo(() => 100 - widths.left - widths.center, [widths])

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widths))
  }, [widths])

  useEffect(() => {
    if (!themeMenuOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setThemeMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [themeMenuOpen])

  const updateWidths = useCallback((clientX: number, handle: Exclude<DragHandle, null>) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pointerPercent = ((clientX - rect.left) / rect.width) * 100

    setWidths(current => {
      if (handle === 'left-center') {
        const right = 100 - current.left - current.center
        const left = clamp(pointerPercent, MIN_WIDTHS.left, 100 - MIN_WIDTHS.center - right)
        return { left, center: 100 - left - right }
      }

      const center = clamp(pointerPercent - current.left, MIN_WIDTHS.center, 100 - current.left - MIN_WIDTHS.right)
      return { left: current.left, center }
    })
  }, [])

  useEffect(() => {
    if (!dragging) return

    const handlePointerMove = (event: PointerEvent) => {
      updateWidths(event.clientX, dragging)
    }
    const handlePointerUp = () => {
      setDragging(null)
    }

    document.body.classList.add('select-none', 'cursor-col-resize')
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      document.body.classList.remove('select-none', 'cursor-col-resize')
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, updateWidths])

  const panelClass = 'aippt-panel min-h-0 min-w-0 overflow-hidden'

  const startDrag = (handle: Exclude<DragHandle, null>) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(handle)
  }

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'zh', label: t('prefs.zh') },
    { value: 'en', label: 'EN' }
  ]

  const themeOptions: { value: ThemeMode; label: string; icon: ReactNode }[] = [
    { value: 'light', label: t('theme.light'), icon: <SunIcon /> },
    { value: 'dark', label: t('theme.dark'), icon: <MoonIcon /> }
  ]

  return (
    <div className="aippt-shell h-screen flex flex-col">
      <header className="aippt-topbar relative z-50 flex-shrink-0">
        <div className="px-5 py-3.5 flex items-center justify-between gap-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-white/75 p-1.5 shadow-[0_10px_24px_rgba(249,115,22,0.18)] ring-1 ring-white/70">
              <img src="/aippt-logo.svg" alt="AIPPT" className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-normal text-[var(--text-strong)]">{t('app.title')}</h1>
              <p className="truncate text-xs text-[var(--text-muted)]">{t('app.subtitle')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="aippt-language-switch" aria-label={t('prefs.language')}>
              {languageOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={language === option.value ? 'is-active' : ''}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative" ref={themeMenuRef}>
              <button
                type="button"
                onClick={() => setThemeMenuOpen(open => !open)}
                className="aippt-pref-button"
                aria-haspopup="menu"
                aria-expanded={themeMenuOpen}
              >
                {theme === 'light' ? <SunIcon /> : <MoonIcon />}
                <span className="hidden sm:inline">
                  {theme === 'light' ? t('theme.light.short') : t('theme.dark.short')}
                </span>
              </button>
              {themeMenuOpen && (
                <div className="aippt-theme-menu" role="menu">
                  {themeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setTheme(option.value)
                        setThemeMenuOpen(false)
                      }}
                      className={theme === option.value ? 'is-active' : ''}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="aippt-app-bg flex-1 min-h-0 overflow-hidden p-4 lg:p-5">
        <div
          ref={containerRef}
          className="aippt-workbench h-full flex flex-col lg:grid gap-4"
          style={isDesktop ? { gridTemplateColumns: `${widths.left}fr 0.5rem ${widths.center}fr 0.5rem ${rightWidth}fr` } : undefined}
          data-testid="resizable-layout"
        >
          <section
            className={panelClass}
            data-layout-panel="left"
          >
            <div className="h-full overflow-y-auto">
              {leftPanel}
            </div>
          </section>

          <div
            className="hidden lg:flex w-2 shrink-0 items-center justify-center cursor-col-resize group"
            role="separator"
            aria-orientation="vertical"
            aria-label={t('layout.resizeLeft')}
            onPointerDown={startDrag('left-center')}
          >
            <div className="h-20 w-1 rounded-full bg-[var(--resize-handle)] shadow-sm transition-all group-hover:h-24 group-hover:bg-primary-400" />
          </div>

          <section
            className={panelClass}
            data-layout-panel="center"
          >
            <div className="h-full overflow-y-auto">
              {centerPanel}
            </div>
          </section>

          <div
            className="hidden lg:flex w-2 shrink-0 items-center justify-center cursor-col-resize group"
            role="separator"
            aria-orientation="vertical"
            aria-label={t('layout.resizeRight')}
            onPointerDown={startDrag('center-right')}
          >
            <div className="h-20 w-1 rounded-full bg-[var(--resize-handle)] shadow-sm transition-all group-hover:h-24 group-hover:bg-teal-400" />
          </div>

          <section
            className={panelClass}
            data-layout-panel="right"
          >
            <div className="h-full overflow-y-auto">
              {rightPanel}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Layout
