import { useEffect, useRef, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useTranslation } from 'react-i18next'
import '@/i18n'
import { commands } from '@/lib/tauri-bindings'
import { logger } from '@/lib/logger'
import { fuzzyMatch } from '@/lib/fuzzy-search'
import {
  QUICK_PANE_SUBMIT_EVENT,
  type QuickPaneSubmitPayload,
} from '@/lib/quick-pane-events'
import { modules } from '@/modules/registry'
import type { AppModule, AppModuleQuickSearchItem } from '@/modules/types'

type QuickPaneMode =
  | { type: 'modules' }
  | { type: 'module-search'; moduleId: string }

type QuickPaneResult =
  | {
      type: 'module'
      id: string
      title: string
      subtitle: string
      module: AppModule
    }
  | {
      type: 'module-item'
      id: string
      title: string
      subtitle?: string
      module: AppModule
    }

async function dismissQuickPane() {
  const result = await commands.dismissQuickPane()
  if (result.status === 'error') {
    logger.error('Failed to dismiss quick pane', { error: result.error })
  }
}

function applyTheme() {
  const theme = localStorage.getItem('ui-theme') || 'system'
  const root = document.documentElement

  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

function searchModules(query: string, t: (key: string) => string) {
  return fuzzyMatch(modules, query, module => [
    t(module.labelKey),
    module.shortLabel,
    module.id,
    ...(module.aliases ?? []),
  ])
}

function toModuleResult(module: AppModule, t: (key: string) => string) {
  return {
    type: 'module',
    id: module.id,
    title: t(module.labelKey),
    subtitle: module.shortLabel,
    module,
  } satisfies QuickPaneResult
}

function toModuleItemResult(item: AppModuleQuickSearchItem, module: AppModule) {
  return {
    type: 'module-item',
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    module,
  } satisfies QuickPaneResult
}

export default function QuickPaneApp() {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [mode, setMode] = useState<QuickPaneMode>({ type: 'modules' })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hasExplicitSelection, setHasExplicitSelection] = useState(false)
  const [moduleItems, setModuleItems] = useState<AppModuleQuickSearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const activeModule =
    mode.type === 'module-search'
      ? modules.find(module => module.id === mode.moduleId)
      : null

  const results: QuickPaneResult[] =
    mode.type === 'modules'
      ? searchModules(text, t).map(module => toModuleResult(module, t))
      : activeModule
        ? moduleItems.map(item => toModuleItemResult(item, activeModule))
        : []

  const safeSelectedIndex =
    results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1)
  const selectedResult = results[safeSelectedIndex]

  useEffect(() => {
    applyTheme()

    const unlisten = listen('theme-changed', () => {
      applyTheme()
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  useEffect(() => {
    const currentWindow = getCurrentWindow()
    const unlisten = currentWindow.onFocusChanged(
      async ({ payload: focused }) => {
        if (focused) {
          applyTheme()
          inputRef.current?.focus()
        } else {
          await dismissQuickPane()
        }
      }
    )

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        await dismissQuickPane()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (mode.type !== 'module-search' || !activeModule?.quickSearch) {
      return
    }

    let isCurrent = true

    activeModule.quickSearch
      .search(text)
      .then(items => {
        if (isCurrent) {
          setModuleItems(items)
          setSelectedIndex(0)
        }
      })
      .catch(error => {
        logger.error('Quick pane module search failed', {
          moduleId: activeModule.id,
          error,
        })
        if (isCurrent) {
          setModuleItems([])
        }
      })

    return () => {
      isCurrent = false
    }
  }, [activeModule, mode, text])

  const setSelection = (nextIndex: number) => {
    if (results.length === 0) {
      setSelectedIndex(0)
      return
    }

    setHasExplicitSelection(true)
    setSelectedIndex((nextIndex + results.length) % results.length)
  }

  const returnToModuleSearch = () => {
    setMode({ type: 'modules' })
    setText('')
    setModuleItems([])
    setSelectedIndex(0)
    setHasExplicitSelection(false)
  }

  const handleTextChange = (value: string) => {
    if (
      mode.type === 'modules' &&
      hasExplicitSelection &&
      selectedResult?.type === 'module' &&
      selectedResult.module.quickSearch &&
      value.length > text.length
    ) {
      setMode({ type: 'module-search', moduleId: selectedResult.module.id })
      setSelectedIndex(0)
      setHasExplicitSelection(false)
      setText(value.slice(text.length))
      return
    }

    setText(value)
  }

  const emitAndShowMainWindow = async (payload: QuickPaneSubmitPayload) => {
    await emit(QUICK_PANE_SUBMIT_EVENT, payload)
    const result = await commands.showMainWindow()
    if (result.status === 'error') {
      logger.error('Failed to show main window', { error: result.error })
    }
  }

  const submitResult = async (result: QuickPaneResult | undefined) => {
    if (result?.type === 'module') {
      await emitAndShowMainWindow({
        type: 'open-module',
        moduleId: result.module.id,
      })
      setText('')
      setMode({ type: 'modules' })
      await dismissQuickPane()
      return
    }

    if (result?.type === 'module-item') {
      await emitAndShowMainWindow({
        type: 'module-item',
        moduleId: result.module.id,
        itemId: result.id,
        query: text.trim(),
      })
      setText('')
      setMode({ type: 'modules' })
      await dismissQuickPane()
      return
    }

    await dismissQuickPane()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await submitResult(selectedResult)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      mode.type === 'module-search' &&
      text.length === 0 &&
      (event.key === 'Backspace' || event.key === 'Delete')
    ) {
      event.preventDefault()
      returnToModuleSearch()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'Tab') {
      event.preventDefault()
      setSelection(safeSelectedIndex + 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelection(safeSelectedIndex - 1)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-screen w-screen flex-col rounded-[var(--app-corner-radius)] border border-border bg-background shadow-lg"
    >
      <div className="flex h-[70px] shrink-0 items-center px-5">
        {activeModule && (
          <div className="mr-3 rounded bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
            {activeModule.shortLabel}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={event => handleTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('quickPane.placeholder')}
          className="min-w-0 flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      <div className="min-h-0 flex-1 border-t">
        {results.length > 0 ? (
          <div className="py-1">
            {results.map((result, index) => {
              const Icon = result.module.icon
              const isSelected = index === safeSelectedIndex

              return (
                <button
                  key={`${result.type}:${result.id}`}
                  type="button"
                  className={
                    'flex h-12 w-full items-center gap-3 px-4 text-start text-sm ' +
                    (isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/60')
                  }
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    setSelectedIndex(index)
                    void submitResult(result)
                  }}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {result.title}
                    </span>
                    {result.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full items-center px-5 text-sm text-muted-foreground">
            {t('quickPane.noResults')}
          </div>
        )}
      </div>
    </form>
  )
}
