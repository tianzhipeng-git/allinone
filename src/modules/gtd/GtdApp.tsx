import { FileText, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import type { GtdDocument } from '@/lib/tauri-bindings'
import { useGtdStore } from './store'
import { useGtdDocument, useGtdTree, useSaveGtdDocument } from './services'
import { CrepeMarkdownEditor } from './components/CrepeMarkdownEditor'

function findDocument(documents: GtdDocument[], id: number | null) {
  return id === null ? null : documents.find(document => document.id === id)
}

function GtdEditorSurface({
  document,
  initialContent,
}: {
  document: GtdDocument
  initialContent: string
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(initialContent)
  const [isDirty, setIsDirty] = useState(false)
  const saveMutation = useSaveGtdDocument(document)

  const handleChange = (markdown: string) => {
    setDraft(markdown)
    setIsDirty(markdown !== initialContent)
  }

  const handleSave = async () => {
    const result = await saveMutation.mutateAsync(draft)
    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.saveFailed'), {
        description: result.error,
      })
      return
    }

    setIsDirty(false)
    toast.success(t('modules.gtd.toast.saved'))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{document.title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {document.path}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
        >
          <Save className="size-4" aria-hidden="true" />
          {t('modules.gtd.actions.save')}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CrepeMarkdownEditor
          value={initialContent}
          placeholder={t('modules.gtd.editor.placeholder')}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

export function GtdApp() {
  const { t } = useTranslation()
  const selectedDocumentId = useGtdStore(state => state.selectedDocumentId)
  const setSelectedDocumentId = useGtdStore(
    state => state.setSelectedDocumentId
  )
  const treeQuery = useGtdTree()
  const documents = treeQuery.data?.documents
  const groups = treeQuery.data?.groups
  const selectedDocument = findDocument(documents ?? [], selectedDocumentId)
  const documentQuery = useGtdDocument(selectedDocument?.id ?? null)

  useEffect(() => {
    if (selectedDocumentId !== null || !documents || documents.length === 0) {
      return
    }

    setSelectedDocumentId(documents[0]?.id ?? null)
  }, [documents, selectedDocumentId, setSelectedDocumentId])

  if (treeQuery.isLoading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (treeQuery.isError) {
    return (
      <Empty className="m-4 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>{t('modules.gtd.error.title')}</EmptyTitle>
          <EmptyDescription>
            {String(treeQuery.error.message ?? treeQuery.error)}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (!documents || documents.length === 0) {
    return (
      <Empty className="m-4 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>{t('modules.gtd.empty.title')}</EmptyTitle>
          <EmptyDescription>
            {groups && groups.length > 0
              ? t('modules.gtd.empty.description')
              : t('modules.gtd.empty.noGroups')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (!selectedDocument) {
    return (
      <Empty className="m-4 border">
        <EmptyHeader>
          <EmptyTitle>{t('modules.gtd.empty.selectDocument')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  if (documentQuery.isLoading || documentQuery.data === undefined) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  return (
    <GtdEditorSurface
      key={selectedDocument.id}
      document={selectedDocument}
      initialContent={documentQuery.data}
    />
  )
}
