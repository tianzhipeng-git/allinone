import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Tauri APIs for tests
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {
    // Mock unlisten function
  }),
}))

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn().mockResolvedValue(null),
}))

// Mock typed Tauri bindings (tauri-specta generated)
vi.mock('@/lib/tauri-bindings', () => ({
  commands: {
    greet: vi.fn().mockResolvedValue('Hello, test!'),
    loadPreferences: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: { theme: 'system' } }),
    savePreferences: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    sendNativeNotification: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: null }),
    showMainWindow: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    saveEmergencyData: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    loadEmergencyData: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    cleanupOldRecoveryFiles: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: 0 }),
    gtdGetTree: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: { groups: [], documents: [] } }),
    gtdCreateGroup: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { id: 1, parent_id: null, name: 'Inbox', sort_order: 0 },
    }),
    gtdRenameGroup: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { id: 1, parent_id: null, name: 'Renamed', sort_order: 0 },
    }),
    gtdMoveGroup: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { id: 1, parent_id: null, name: 'Inbox', sort_order: 0 },
    }),
    gtdDeleteGroup: vi.fn().mockResolvedValue({
      status: 'ok',
      data: null,
    }),
    gtdRegisterDocument: vi.fn().mockResolvedValue({
      status: 'ok',
      data: {
        id: 1,
        group_id: 1,
        title: 'todo',
        path: '/tmp/todo.md',
        markdown_heading: 'todo',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    }),
    gtdRenameDocument: vi.fn().mockResolvedValue({
      status: 'ok',
      data: {
        id: 1,
        group_id: 1,
        title: 'renamed',
        path: '/tmp/todo.md',
        markdown_heading: 'todo',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    }),
    gtdMoveDocument: vi.fn().mockResolvedValue({
      status: 'ok',
      data: {
        id: 1,
        group_id: 1,
        title: 'todo',
        path: '/tmp/todo.md',
        markdown_heading: 'todo',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    }),
    gtdDeleteDocument: vi.fn().mockResolvedValue({
      status: 'ok',
      data: null,
    }),
    gtdPreviewImportPath: vi.fn().mockResolvedValue({
      status: 'ok',
      data: {
        path: '/tmp',
        is_directory: false,
        files: ['/tmp/todo.md'],
      },
    }),
    gtdReadDocument: vi.fn().mockResolvedValue({ status: 'ok', data: '' }),
    gtdSaveDocument: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
  },
  unwrapResult: vi.fn((result: { status: string; data?: unknown }) => {
    if (result.status === 'ok') return result.data
    throw result
  }),
}))
