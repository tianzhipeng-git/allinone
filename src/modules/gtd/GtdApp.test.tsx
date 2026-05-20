import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@/test/test-utils'
import { commands } from '@/lib/tauri-bindings'
import { MODULE_SAVE_REQUESTED_EVENT } from '@/lib/module-save-events'
import { useGtdStore } from './store'
import { GtdApp } from './GtdApp'

vi.mock('./components/CrepeMarkdownEditor', () => ({
  CrepeMarkdownEditor: ({
    value,
    onChange,
  }: {
    value: string
    placeholder: string
    onChange: (markdown: string) => void
  }) => (
    <textarea
      aria-label="GTD editor"
      defaultValue={value}
      onChange={event => onChange(event.currentTarget.value)}
    />
  ),
}))

describe('GtdApp', () => {
  it('saves the current draft when GTD receives a module save request', async () => {
    vi.mocked(commands.gtdGetTree).mockResolvedValue({
      status: 'ok',
      data: {
        groups: [{ id: 1, parent_id: null, name: 'Inbox', sort_order: 0 }],
        documents: [
          {
            id: 1,
            group_id: 1,
            title: 'todo',
            path: '/tmp/todo.md',
            markdown_heading: 'todo',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ],
      },
    })
    vi.mocked(commands.gtdReadDocument).mockResolvedValue({
      status: 'ok',
      data: 'original',
    })
    vi.mocked(commands.gtdSaveDocument).mockResolvedValue({
      status: 'ok',
      data: null,
    })
    useGtdStore.getState().setSelectedDocumentId(1)

    render(<GtdApp />)

    const editor = await screen.findByLabelText('GTD editor')
    fireEvent.change(editor, { target: { value: 'changed' } })
    window.dispatchEvent(
      new CustomEvent(MODULE_SAVE_REQUESTED_EVENT, {
        detail: { moduleId: 'gtd' },
      })
    )

    await waitFor(() => {
      expect(commands.gtdSaveDocument).toHaveBeenCalledWith(1, 'changed')
    })
  })
})
