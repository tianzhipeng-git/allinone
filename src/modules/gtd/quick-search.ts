import { commands, unwrapResult } from '@/lib/tauri-bindings'
import { fuzzyMatch } from '@/lib/fuzzy-search'
import type { AppModuleQuickSearch } from '@/modules/types'
import { useGtdStore } from './store'

function filenameFromPath(path: string) {
  return path.split(/[\\/]/).pop() ?? path
}

export const gtdQuickSearch: AppModuleQuickSearch = {
  async search(query) {
    const tree = unwrapResult(await commands.gtdGetTree())
    const documents = fuzzyMatch(tree.documents, query, document => [
      document.title,
      document.markdown_heading ?? '',
      document.path,
      filenameFromPath(document.path),
    ])

    return documents.slice(0, 8).map(document => ({
      id: String(document.id),
      title: document.title,
      subtitle: document.path,
      keywords: [
        document.markdown_heading ?? '',
        filenameFromPath(document.path),
        document.path,
      ],
    }))
  },

  submit(itemId) {
    const documentId = Number(itemId)
    if (Number.isInteger(documentId)) {
      useGtdStore.getState().setSelectedDocumentId(documentId)
    }
  },
}
