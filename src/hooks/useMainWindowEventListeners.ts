import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useCommandContext } from './use-command-context'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'
import {
  QUICK_PANE_SUBMIT_EVENT,
  type QuickPaneSubmitPayload,
} from '@/lib/quick-pane-events'
import { getModuleById } from '@/modules/registry'
import { useUIStore } from '@/store/ui-store'
import { logger } from '@/lib/logger'

/**
 * Main window event listeners - handles global keyboard shortcuts and cross-window events.
 *
 * This hook composes specialized hooks for different event types:
 * - useKeyboardShortcuts: Global keyboard shortcuts (Cmd+, Cmd+1, Cmd+2)
 * - Quick pane submit listener: Cross-window communication from quick pane
 */
export function useMainWindowEventListeners() {
  const commandContext = useCommandContext()

  useKeyboardShortcuts(commandContext)

  // Listen for quick pane submissions (cross-window event)
  useEffect(() => {
    let isMounted = true
    let unlisten: (() => void) | null = null

    listen<QuickPaneSubmitPayload>(QUICK_PANE_SUBMIT_EVENT, event => {
      logger.debug('Quick pane submit event received', {
        payload: event.payload,
      })

      const { setActiveModuleId } = useUIStore.getState()
      setActiveModuleId(event.payload.moduleId)

      if (event.payload.type === 'module-item') {
        const module = getModuleById(event.payload.moduleId)
        void module.quickSearch?.submit(event.payload.itemId)
      }
    })
      .then(unlistenFn => {
        if (!isMounted) {
          unlistenFn()
        } else {
          unlisten = unlistenFn
        }
      })
      .catch(error => {
        logger.error('Failed to setup quick-pane-submit listener', { error })
      })

    return () => {
      isMounted = false
      if (unlisten) {
        unlisten()
      }
    }
  }, [])
}
