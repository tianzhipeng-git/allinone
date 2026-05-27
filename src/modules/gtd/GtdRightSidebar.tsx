import { open } from '@tauri-apps/plugin-dialog'
import { ClipboardPaste, FolderPlus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import {
  useCreateGtdGroup,
  useDeleteGtdDocument,
  useDeleteGtdGroup,
  useGtdTree,
  useMoveGtdDocument,
  useMoveGtdGroup,
  usePreviewGtdImportPath,
  useRegisterGtdDocument,
  useRenameGtdDocument,
  useRenameGtdGroup,
} from './services'
import { useGtdStore } from './store'
import { buildGtdGroupTree } from './tree'
import { GtdRightSidebarDialogs } from './components/GtdRightSidebarDialogs'
import { GtdTree } from './components/GtdSidebarTree'
import {
  DOCUMENT_PREFIX,
  GROUP_PREFIX,
  TREE_ROOT_ID,
  buildArboristTreeData,
  findGroupName,
  getFirstGroupId,
  getHiddenRoot,
  getVisibleNodes,
  parseTreeItemId,
  type DeleteTarget,
  type RenameTarget,
} from './components/GtdSidebarTreeModel'

export function GtdRightSidebar() {
  const { t } = useTranslation()
  const treeQuery = useGtdTree()
  const createGroup = useCreateGtdGroup()
  const registerDocument = useRegisterGtdDocument()
  const renameGroup = useRenameGtdGroup()
  const renameDocument = useRenameGtdDocument()
  const moveGroup = useMoveGtdGroup()
  const moveDocument = useMoveGtdDocument()
  const deleteGroup = useDeleteGtdGroup()
  const deleteDocument = useDeleteGtdDocument()
  const previewImportPath = usePreviewGtdImportPath()
  const selectedDocumentId = useGtdStore(state => state.selectedDocumentId)
  const selectedGroupId = useGtdStore(state => state.selectedGroupId)
  const setSelectedGroupId = useGtdStore(state => state.setSelectedGroupId)
  const setSelectedDocumentId = useGtdStore(
    state => state.setSelectedDocumentId
  )
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [pathDialogOpen, setPathDialogOpen] = useState(false)
  const [pathValue, setPathValue] = useState('')
  const [previewFiles, setPreviewFiles] = useState<string[] | null>(null)
  const [selectedImportPaths, setSelectedImportPaths] = useState<Set<string>>(
    () => new Set()
  )
  const tree = buildGtdGroupTree(
    treeQuery.data?.groups ?? [],
    treeQuery.data?.documents ?? []
  )
  const { nodes: visibleNodes, rootDocuments } = getVisibleNodes(tree)
  const selectedGroupName =
    findGroupName(tree, selectedGroupId) ??
    t('modules.gtd.sidebar.topLevelGroup')
  const selectedItemId =
    selectedDocumentId !== null
      ? `${DOCUMENT_PREFIX}${selectedDocumentId}`
      : selectedGroupId !== null
        ? `${GROUP_PREFIX}${selectedGroupId}`
        : undefined
  const treeData = buildArboristTreeData(visibleNodes, rootDocuments)

  useEffect(() => {
    if (selectedGroupId !== null) {
      return
    }

    setSelectedGroupId(getFirstGroupId(tree))
  }, [selectedGroupId, setSelectedGroupId, tree])

  const handleCreateGroup = async () => {
    const parentId = selectedGroupId ?? getFirstGroupId(tree)
    const result = await createGroup.mutateAsync({
      name: groupName,
      parentId,
    })

    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.groupCreateFailed'), {
        description: result.error,
      })
      return
    }

    setGroupName('')
    setGroupDialogOpen(false)
    setSelectedDocumentId(null)
    setSelectedGroupId(result.data.id)
  }

  const registerFiles = async (paths: string[]) => {
    const groupId = selectedGroupId ?? getFirstGroupId(tree)
    if (groupId === null) {
      toast.error(t('modules.gtd.toast.noGroup'))
      return
    }

    let lastDocumentId: number | null = null
    for (const path of paths) {
      const result = await registerDocument.mutateAsync({
        path,
        groupId,
        title: null,
      })

      if (result.status === 'error') {
        toast.error(t('modules.gtd.toast.registerFailed'), {
          description: result.error,
        })
        return
      }

      lastDocumentId = result.data.id
    }

    if (lastDocumentId !== null) {
      setSelectedDocumentId(lastDocumentId)
    }
    toast.success(
      t('modules.gtd.toast.registeredCount', { count: paths.length })
    )
  }

  const handleRegisterDocument = async () => {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    })

    if (typeof selected !== 'string') {
      return
    }

    await registerFiles([selected])
  }

  const handlePreviewPath = async () => {
    const result = await previewImportPath.mutateAsync(pathValue)
    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.importPreviewFailed'), {
        description: result.error,
      })
      return
    }

    if (result.data.files.length === 0) {
      toast.error(t('modules.gtd.toast.noMarkdownFiles'))
      return
    }

    setPreviewFiles(result.data.files)
    setSelectedImportPaths(new Set(result.data.files))
  }

  const handleConfirmImport = async () => {
    if (!previewFiles) {
      return
    }

    const paths = previewFiles.filter(path => selectedImportPaths.has(path))
    if (paths.length === 0) {
      toast.error(t('modules.gtd.toast.noImportSelection'))
      return
    }

    await registerFiles(paths)
    setPathDialogOpen(false)
    setPathValue('')
    setPreviewFiles(null)
    setSelectedImportPaths(new Set())
  }

  const handleToggleImportPath = (path: string, checked: boolean) => {
    setSelectedImportPaths(current => {
      const next = new Set(current)
      if (checked) {
        next.add(path)
      } else {
        next.delete(path)
      }
      return next
    })
  }

  const handleSetAllImportPaths = (checked: boolean) => {
    setSelectedImportPaths(new Set(checked && previewFiles ? previewFiles : []))
  }

  const handleRename = async () => {
    if (!renameTarget) {
      return
    }

    const result =
      renameTarget.type === 'group'
        ? await renameGroup.mutateAsync({
            groupId: renameTarget.id,
            name: renameValue,
          })
        : await renameDocument.mutateAsync({
            documentId: renameTarget.id,
            title: renameValue,
          })

    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.renameFailed'), {
        description: result.error,
      })
      return
    }

    setRenameTarget(null)
    setRenameValue('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    if (deleteTarget.type === 'group' && deleteTarget.childCount > 0) {
      toast.error(t('modules.gtd.toast.deleteGroupNotEmpty'))
      return
    }

    const result =
      deleteTarget.type === 'group'
        ? await deleteGroup.mutateAsync(deleteTarget.id)
        : await deleteDocument.mutateAsync(deleteTarget.id)

    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.deleteFailed'), {
        description: result.error,
      })
      return
    }

    if (
      deleteTarget.type === 'document' &&
      selectedDocumentId === deleteTarget.id
    ) {
      setSelectedDocumentId(null)
    }

    if (deleteTarget.type === 'group' && selectedGroupId === deleteTarget.id) {
      setSelectedGroupId(getFirstGroupId(tree))
      setSelectedDocumentId(null)
    }

    setDeleteTarget(null)
  }

  const handleMoveTreeItem = async (
    sourceItemId: string,
    targetParentItemId: string
  ) => {
    const source = parseTreeItemId(sourceItemId)
    const hiddenRoot = getHiddenRoot(tree)
    const target =
      targetParentItemId === TREE_ROOT_ID && hiddenRoot
        ? { type: 'group' as const, id: hiddenRoot.id }
        : parseTreeItemId(targetParentItemId)

    logger.debug('gtd tree drop requested', {
      sourceItemId,
      targetParentItemId,
      source,
      target,
    })

    if (!source || !target || target.type !== 'group') {
      logger.warn('gtd tree drop ignored', {
        reason: 'invalid source or target',
        sourceItemId,
        targetParentItemId,
      })
      return
    }

    const result =
      source.type === 'group'
        ? await moveGroup.mutateAsync({
            groupId: source.id,
            parentId: target.id,
          })
        : await moveDocument.mutateAsync({
            documentId: source.id,
            groupId: target.id,
          })

    if (result.status === 'error') {
      logger.warn('gtd tree drop failed', {
        source,
        target,
        error: result.error,
      })
      toast.error(t('modules.gtd.toast.moveFailed'), {
        description: result.error,
      })
      return
    }

    logger.debug('gtd tree drop completed', { source, target })

    if (source.type === 'document') {
      setSelectedGroupId(target.id)
      setSelectedDocumentId(source.id)
    } else {
      setSelectedGroupId(source.id)
      setSelectedDocumentId(null)
    }
  }

  const handleSelectTreeItem = (itemId: string) => {
    const parsed = parseTreeItemId(itemId)
    if (!parsed) {
      return
    }

    if (parsed.type === 'group') {
      setSelectedGroupId(parsed.id)
      setSelectedDocumentId(null)
      return
    }

    const document = treeQuery.data?.documents.find(
      candidate => candidate.id === parsed.id
    )
    setSelectedGroupId(document?.group_id ?? selectedGroupId)
    setSelectedDocumentId(parsed.id)
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">
              {t('modules.gtd.sidebar.title')}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {t('modules.gtd.sidebar.subtitle')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t('modules.gtd.actions.newGroupUnder', {
              group: selectedGroupName,
            })}
            aria-label={t('modules.gtd.actions.newGroupUnder', {
              group: selectedGroupName,
            })}
            onClick={() => setGroupDialogOpen(true)}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t('modules.gtd.actions.pastePath')}
            aria-label={t('modules.gtd.actions.pastePath')}
            onClick={() => setPathDialogOpen(true)}
          >
            <ClipboardPaste className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t('modules.gtd.actions.registerFile')}
            aria-label={t('modules.gtd.actions.registerFile')}
            onClick={handleRegisterDocument}
            disabled={registerDocument.isPending}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="min-h-0 flex-1">
          <GtdTree
            data={treeData}
            selectedItemId={selectedItemId}
            dragHandleHint={t('modules.gtd.sidebar.dragHandleHint')}
            renameLabel={t('modules.gtd.actions.rename')}
            onRename={target => {
              setRenameTarget(target)
              setRenameValue(target.name)
            }}
            deleteLabel={t('modules.gtd.actions.delete')}
            onDelete={setDeleteTarget}
            onSelect={handleSelectTreeItem}
            onMove={handleMoveTreeItem}
          />
        </div>
      </div>

      <GtdRightSidebarDialogs
        groupDialogOpen={groupDialogOpen}
        setGroupDialogOpen={setGroupDialogOpen}
        groupName={groupName}
        setGroupName={setGroupName}
        selectedGroupName={selectedGroupName}
        onCreateGroup={() => void handleCreateGroup()}
        createGroupPending={createGroup.isPending}
        renameTarget={renameTarget}
        setRenameTarget={setRenameTarget}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        onRename={() => void handleRename()}
        renamePending={renameGroup.isPending || renameDocument.isPending}
        pathDialogOpen={pathDialogOpen}
        setPathDialogOpen={setPathDialogOpen}
        pathValue={pathValue}
        setPathValue={setPathValue}
        previewFiles={previewFiles}
        setPreviewFiles={setPreviewFiles}
        selectedImportPaths={selectedImportPaths}
        setSelectedImportPaths={setSelectedImportPaths}
        onPreviewPath={() => void handlePreviewPath()}
        onConfirmImport={() => void handleConfirmImport()}
        onToggleImportPath={handleToggleImportPath}
        onSetAllImportPaths={handleSetAllImportPaths}
        previewImportPathPending={previewImportPath.isPending}
        registerDocumentPending={registerDocument.isPending}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        onDelete={() => void handleDelete()}
        deleteGroupPending={deleteGroup.isPending}
        deleteDocumentPending={deleteDocument.isPending}
      />
    </>
  )
}
