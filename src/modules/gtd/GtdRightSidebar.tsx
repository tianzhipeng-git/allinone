import { open } from '@tauri-apps/plugin-dialog'
import { FileText, Folder, FolderPlus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { GtdDocument } from '@/lib/tauri-bindings'
import { buildGtdGroupTree } from './tree'
import type { GtdGroupNode } from './types'
import { useGtdStore } from './store'
import {
  useCreateGtdGroup,
  useGtdTree,
  useRegisterGtdDocument,
} from './services'

function getFirstGroupId(nodes: GtdGroupNode[]): number | null {
  const first = nodes[0]
  if (!first) {
    return null
  }

  return first.id
}

function GroupNode({ node, depth }: { node: GtdGroupNode; depth: number }) {
  const selectedDocumentId = useGtdStore(state => state.selectedDocumentId)
  const selectedGroupId = useGtdStore(state => state.selectedGroupId)
  const setSelectedDocumentId = useGtdStore(
    state => state.setSelectedDocumentId
  )
  const setSelectedGroupId = useGtdStore(state => state.setSelectedGroupId)

  const selectGroup = () => {
    setSelectedGroupId(node.id)
  }

  const selectDocument = (document: GtdDocument) => {
    setSelectedGroupId(document.group_id)
    setSelectedDocumentId(document.id)
  }

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-md px-2 text-start text-xs font-medium',
          selectedGroupId === node.id
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        )}
        style={{ paddingInlineStart: `${8 + depth * 14}px` }}
        onClick={selectGroup}
      >
        <Folder className="size-3.5" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
      </button>

      {node.documents.map(document => (
        <button
          key={document.id}
          type="button"
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-md px-2 text-start text-xs',
            selectedDocumentId === document.id
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent/60'
          )}
          style={{ paddingInlineStart: `${22 + depth * 14}px` }}
          onClick={() => selectDocument(document)}
        >
          <FileText className="size-3.5" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{document.title}</span>
        </button>
      ))}

      {node.children.map(child => (
        <GroupNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export function GtdRightSidebar() {
  const { t } = useTranslation()
  const treeQuery = useGtdTree()
  const createGroup = useCreateGtdGroup()
  const registerDocument = useRegisterGtdDocument()
  const selectedGroupId = useGtdStore(state => state.selectedGroupId)
  const setSelectedGroupId = useGtdStore(state => state.setSelectedGroupId)
  const setSelectedDocumentId = useGtdStore(
    state => state.setSelectedDocumentId
  )
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const tree = buildGtdGroupTree(
    treeQuery.data?.groups ?? [],
    treeQuery.data?.documents ?? []
  )

  useEffect(() => {
    if (selectedGroupId !== null) {
      return
    }

    setSelectedGroupId(getFirstGroupId(tree))
  }, [selectedGroupId, setSelectedGroupId, tree])

  const handleCreateGroup = async () => {
    const result = await createGroup.mutateAsync({
      name: groupName,
      parentId: selectedGroupId,
    })

    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.groupCreateFailed'), {
        description: result.error,
      })
      return
    }

    setGroupName('')
    setGroupDialogOpen(false)
    setSelectedGroupId(result.data.id)
  }

  const handleRegisterDocument = async () => {
    const groupId = selectedGroupId ?? getFirstGroupId(tree)
    if (groupId === null) {
      toast.error(t('modules.gtd.toast.noGroup'))
      return
    }

    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    })

    if (typeof selected !== 'string') {
      return
    }

    const result = await registerDocument.mutateAsync({
      path: selected,
      groupId,
      title: null,
    })

    if (result.status === 'error') {
      toast.error(t('modules.gtd.toast.registerFailed'), {
        description: result.error,
      })
      return
    }

    setSelectedDocumentId(result.data.id)
    toast.success(t('modules.gtd.toast.registered'))
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
            title={t('modules.gtd.actions.newGroup')}
            onClick={() => setGroupDialogOpen(true)}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t('modules.gtd.actions.registerFile')}
            onClick={handleRegisterDocument}
            disabled={registerDocument.isPending}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {tree.map(node => (
              <GroupNode key={node.id} node={node} depth={0} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modules.gtd.dialog.groupTitle')}</DialogTitle>
            <DialogDescription>
              {t('modules.gtd.dialog.groupDescription')}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={groupName}
            placeholder={t('modules.gtd.dialog.groupPlaceholder')}
            onChange={event => setGroupName(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && groupName.trim()) {
                void handleCreateGroup()
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGroupDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || createGroup.isPending}
            >
              {t('modules.gtd.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
