import { create } from 'zustand'

export type RemView = 'home' | 'logs'

interface RemUiState {
  view: RemView
  createRequestId: number
  setView: (view: RemView) => void
  requestCreateReminder: () => void
}

export const useRemUiStore = create<RemUiState>()(set => ({
  view: 'home',
  createRequestId: 0,
  setView: view => set({ view }),
  requestCreateReminder: () =>
    set(state => ({ createRequestId: state.createRequestId + 1 })),
}))
