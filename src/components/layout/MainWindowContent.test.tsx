import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@/test/test-utils'
import {
  MODULE_SAVE_REQUESTED_EVENT,
  type ModuleSaveRequestedDetail,
} from '@/lib/module-save-events'
import { useUIStore } from '@/store/ui-store'
import { MainWindowContent } from './MainWindowContent'

describe('MainWindowContent', () => {
  it('dispatches an active module save request for Cmd/Ctrl+S', () => {
    useUIStore.getState().setActiveModuleId('gtd')
    const handleSaveRequest = vi.fn()

    window.addEventListener(MODULE_SAVE_REQUESTED_EVENT, handleSaveRequest)
    render(
      <MainWindowContent>
        <div>Current module</div>
      </MainWindowContent>
    )

    fireEvent.keyDown(document, { key: 's', ctrlKey: true })

    expect(handleSaveRequest).toHaveBeenCalledTimes(1)
    const saveEvent = handleSaveRequest.mock
      .calls[0]?.[0] as CustomEvent<ModuleSaveRequestedDetail>
    expect(saveEvent.detail).toEqual({ moduleId: 'gtd' })

    window.removeEventListener(MODULE_SAVE_REQUESTED_EVENT, handleSaveRequest)
  })
})
