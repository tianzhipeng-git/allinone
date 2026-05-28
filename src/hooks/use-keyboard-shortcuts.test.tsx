import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'
import type { CommandContext } from '@/lib/commands/types'
import { executeCommand } from '@/lib/commands/registry'

vi.mock('@/lib/commands/registry', () => ({
  executeCommand: vi.fn().mockResolvedValue({ success: true }),
}))

const createCommandContext = (): CommandContext => ({
  openPreferences: vi.fn(),
  showToast: vi.fn(),
})

describe('useKeyboardShortcuts', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('closes the window when Cmd+W is pressed', () => {
    const commandContext = createCommandContext()
    renderHook(() => useKeyboardShortcuts(commandContext))

    const event = new KeyboardEvent('keydown', {
      key: 'w',
      metaKey: true,
      cancelable: true,
    })
    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(executeCommand).toHaveBeenCalledWith('window-close', commandContext)
  })
})
