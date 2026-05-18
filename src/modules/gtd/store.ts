import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface GtdState {
  selectedDocumentId: number | null
  selectedGroupId: number | null
  setSelectedDocumentId: (id: number | null) => void
  setSelectedGroupId: (id: number | null) => void
}

export const useGtdStore = create<GtdState>()(
  devtools(
    set => ({
      selectedDocumentId: null,
      selectedGroupId: null,
      setSelectedDocumentId: id =>
        set({ selectedDocumentId: id }, undefined, 'gtd.setSelectedDocumentId'),
      setSelectedGroupId: id =>
        set({ selectedGroupId: id }, undefined, 'gtd.setSelectedGroupId'),
    }),
    { name: 'gtd-store' }
  )
)
