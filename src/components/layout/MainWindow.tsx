import { useEffect, useRef } from 'react'
import type { ImperativePanelGroupHandle } from 'react-resizable-panels'
import { useQueryClient } from '@tanstack/react-query'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { TitleBar } from '@/components/titlebar/TitleBar'
import { LeftSideBar } from './LeftSideBar'
import { RightSideBar } from './RightSideBar'
import { MainWindowContent } from './MainWindowContent'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { PreferencesDialog } from '@/components/preferences/PreferencesDialog'
import { Toaster } from 'sonner'
import { useTheme } from '@/hooks/use-theme'
import { useUIStore } from '@/store/ui-store'
import { useMainWindowEventListeners } from '@/hooks/useMainWindowEventListeners'
import {
  normalizeAppPreferences,
  preferencesQueryKeys,
  savePreferencesQuietly,
  usePreferences,
} from '@/services/preferences'
import type { AppPreferences } from '@/lib/tauri-bindings'
import { cn } from '@/lib/utils'

/**
 * Layout sizing configuration for resizable panels.
 * All values are percentages of total width.
 * Sidebar defaults + main default must equal 100.
 *
 * Mirrors constraints enforced in Rust `AppPreferences::normalize_sidebar_layout`.
 */
const LAYOUT = {
  leftSidebar: { default: 20, min: 15, max: 40 },
  rightSidebar: { default: 20, min: 15, max: 40 },
  main: { min: 30 },
} as const

export function MainWindow() {
  const { theme } = useTheme()
  const queryClient = useQueryClient()
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null)

  const { data: preferences } = usePreferences()
  const prefs = normalizeAppPreferences(preferences)

  const leftPct = prefs.left_sidebar_size
  const rightPct = prefs.right_sidebar_size
  const mainDefault = 100 - leftPct - rightPct

  const leftSidebarVisible = useUIStore(state => state.leftSidebarVisible)
  const rightSidebarVisible = useUIStore(state => state.rightSidebarVisible)

  useMainWindowEventListeners()

  const hydratedVisibilityRef = useRef(false)
  useEffect(() => {
    if (!preferences || hydratedVisibilityRef.current) return
    hydratedVisibilityRef.current = true
    const p = normalizeAppPreferences(preferences)
    useUIStore.getState().setLeftSidebarVisible(p.left_sidebar_visible)
    useUIStore.getState().setRightSidebarVisible(p.right_sidebar_visible)
  }, [preferences])

  const hydratedLayoutRef = useRef(false)
  useEffect(() => {
    if (!preferences || hydratedLayoutRef.current) return
    hydratedLayoutRef.current = true
    const p = normalizeAppPreferences(preferences)
    const main = 100 - p.left_sidebar_size - p.right_sidebar_size
    if (main < LAYOUT.main.min) return

    requestAnimationFrame(() =>
      panelGroupRef.current?.setLayout([
        p.left_sidebar_size,
        main,
        p.right_sidebar_size,
      ])
    )
  }, [preferences])

  const layoutSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (layoutSaveTimerRef.current) clearTimeout(layoutSaveTimerRef.current)
    },
    []
  )

  useEffect(() => {
    return useUIStore.subscribe((state, prev) => {
      if (
        state.leftSidebarVisible === prev.leftSidebarVisible &&
        state.rightSidebarVisible === prev.rightSidebarVisible
      ) {
        return
      }

      const cached = queryClient.getQueryData<AppPreferences>(
        preferencesQueryKeys.preferences()
      )
      void savePreferencesQuietly(queryClient, {
        ...normalizeAppPreferences(cached),
        left_sidebar_visible: state.leftSidebarVisible,
        right_sidebar_visible: state.rightSidebarVisible,
      })
    })
  }, [queryClient])

  const handlePanelGroupLayout = (layout: number[]) => {
    const [left, , right] = layout
    if (layoutSaveTimerRef.current !== null)
      clearTimeout(layoutSaveTimerRef.current)
    layoutSaveTimerRef.current = setTimeout(() => {
      layoutSaveTimerRef.current = null
      const cached = queryClient.getQueryData<AppPreferences>(
        preferencesQueryKeys.preferences()
      )
      void savePreferencesQuietly(queryClient, {
        ...normalizeAppPreferences(cached),
        left_sidebar_size: left,
        right_sidebar_size: right,
      })
    }, 320)
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden rounded-[var(--app-corner-radius)] bg-background">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup
          ref={panelGroupRef}
          direction="horizontal"
          onLayout={handlePanelGroupLayout}
        >
          <ResizablePanel
            defaultSize={leftPct}
            minSize={LAYOUT.leftSidebar.min}
            maxSize={LAYOUT.leftSidebar.max}
            className={cn(!leftSidebarVisible && 'hidden')}
          >
            <LeftSideBar />
          </ResizablePanel>

          <ResizableHandle className={cn(!leftSidebarVisible && 'hidden')} />

          <ResizablePanel defaultSize={mainDefault} minSize={LAYOUT.main.min}>
            <MainWindowContent />
          </ResizablePanel>

          <ResizableHandle className={cn(!rightSidebarVisible && 'hidden')} />

          <ResizablePanel
            defaultSize={rightPct}
            minSize={LAYOUT.rightSidebar.min}
            maxSize={LAYOUT.rightSidebar.max}
            className={cn(!rightSidebarVisible && 'hidden')}
          >
            <RightSideBar />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Global UI Components (hidden until triggered) */}
      <CommandPalette />
      <PreferencesDialog />
      <Toaster
        position="bottom-right"
        theme={
          theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'system'
        }
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            description: 'group-[.toast]:text-muted-foreground',
            actionButton:
              'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton:
              'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          },
        }}
      />
    </div>
  )
}
