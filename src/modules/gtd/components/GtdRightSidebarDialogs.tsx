import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { DeleteTarget, RenameTarget } from './GtdSidebarTreeModel'

interface GtdRightSidebarDialogsProps {
  groupDialogOpen: boolean
  setGroupDialogOpen: Dispatch<SetStateAction<boolean>>
  groupName: string
  setGroupName: Dispatch<SetStateAction<string>>
  selectedGroupName: string
  onCreateGroup: () => void
  createGroupPending: boolean
  renameTarget: RenameTarget | null
  setRenameTarget: Dispatch<SetStateAction<RenameTarget | null>>
  renameValue: string
  setRenameValue: Dispatch<SetStateAction<string>>
  onRename: () => void
  renamePending: boolean
  pathDialogOpen: boolean
  setPathDialogOpen: Dispatch<SetStateAction<boolean>>
  pathValue: string
  setPathValue: Dispatch<SetStateAction<string>>
  previewFiles: string[] | null
  setPreviewFiles: Dispatch<SetStateAction<string[] | null>>
  selectedImportPaths: Set<string>
  setSelectedImportPaths: Dispatch<SetStateAction<Set<string>>>
  onPreviewPath: () => void
  onConfirmImport: () => void
  onToggleImportPath: (path: string, checked: boolean) => void
  onSetAllImportPaths: (checked: boolean) => void
  previewImportPathPending: boolean
  registerDocumentPending: boolean
  deleteTarget: DeleteTarget | null
  setDeleteTarget: Dispatch<SetStateAction<DeleteTarget | null>>
  onDelete: () => void
  deleteGroupPending: boolean
  deleteDocumentPending: boolean
}

export function GtdRightSidebarDialogs({
  groupDialogOpen,
  setGroupDialogOpen,
  groupName,
  setGroupName,
  selectedGroupName,
  onCreateGroup,
  createGroupPending,
  renameTarget,
  setRenameTarget,
  renameValue,
  setRenameValue,
  onRename,
  renamePending,
  pathDialogOpen,
  setPathDialogOpen,
  pathValue,
  setPathValue,
  previewFiles,
  setPreviewFiles,
  selectedImportPaths,
  setSelectedImportPaths,
  onPreviewPath,
  onConfirmImport,
  onToggleImportPath,
  onSetAllImportPaths,
  previewImportPathPending,
  registerDocumentPending,
  deleteTarget,
  setDeleteTarget,
  onDelete,
  deleteGroupPending,
  deleteDocumentPending,
}: GtdRightSidebarDialogsProps) {
  const { t } = useTranslation()

  return (
    <>
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modules.gtd.dialog.groupTitle')}</DialogTitle>
            <DialogDescription>
              {t('modules.gtd.dialog.groupDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
            {t('modules.gtd.dialog.groupParent', {
              group: selectedGroupName,
            })}
          </div>
          <Input
            value={groupName}
            placeholder={t('modules.gtd.dialog.groupPlaceholder')}
            onChange={event => setGroupName(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && groupName.trim()) {
                onCreateGroup()
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
              onClick={onCreateGroup}
              disabled={!groupName.trim() || createGroupPending}
            >
              {t('modules.gtd.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={open => {
          if (!open) {
            setRenameTarget(null)
            setRenameValue('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modules.gtd.dialog.renameTitle')}</DialogTitle>
            <DialogDescription>
              {renameTarget?.type === 'document'
                ? t('modules.gtd.dialog.renameDocumentDescription')
                : t('modules.gtd.dialog.renameGroupDescription')}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={event => setRenameValue(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && renameValue.trim()) {
                onRename()
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameTarget(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={onRename}
              disabled={!renameValue.trim() || renamePending}
            >
              {t('modules.gtd.actions.rename')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pathDialogOpen}
        onOpenChange={open => {
          setPathDialogOpen(open)
          if (!open) {
            setPreviewFiles(null)
            setSelectedImportPaths(new Set())
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('modules.gtd.dialog.pathTitle')}</DialogTitle>
            <DialogDescription>
              {t('modules.gtd.dialog.pathDescription')}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={pathValue}
            placeholder={t('modules.gtd.dialog.pathPlaceholder')}
            autoFocus
            onKeyDown={event => {
              if (event.key === 'Enter' && pathValue.trim()) {
                onPreviewPath()
              }
            }}
            onChange={event => {
              setPathValue(event.target.value)
              setPreviewFiles(null)
            }}
          />
          {previewFiles ? (
            <div className="min-w-0 overflow-hidden rounded-md border text-xs">
              <div className="flex min-w-0 items-center gap-2 border-b px-2 py-2">
                <Checkbox
                  checked={selectedImportPaths.size === previewFiles.length}
                  aria-label={t('modules.gtd.dialog.selectAllFiles')}
                  onCheckedChange={checked =>
                    onSetAllImportPaths(checked === true)
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {t('modules.gtd.dialog.importPreview', {
                      selected: selectedImportPaths.size,
                      count: previewFiles.length,
                    })}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {t('modules.gtd.dialog.importPreviewHint')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() =>
                    onSetAllImportPaths(
                      selectedImportPaths.size !== previewFiles.length
                    )
                  }
                >
                  {selectedImportPaths.size === previewFiles.length
                    ? t('modules.gtd.actions.clearSelection')
                    : t('modules.gtd.actions.selectAll')}
                </Button>
              </div>
              <div className="h-48 min-w-0 overflow-auto">
                <ul className="w-max min-w-full space-y-1 p-2 text-muted-foreground">
                  {previewFiles.map(path => (
                    <li key={path} className="min-w-0">
                      <label className="flex min-w-max items-center gap-2 rounded-sm px-1 py-1 hover:bg-accent/60">
                        <Checkbox
                          checked={selectedImportPaths.has(path)}
                          onCheckedChange={checked =>
                            onToggleImportPath(path, checked === true)
                          }
                        />
                        <span className="whitespace-nowrap">{path}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPathDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            {previewFiles ? (
              <Button
                type="button"
                onClick={onConfirmImport}
                disabled={
                  registerDocumentPending || selectedImportPaths.size === 0
                }
              >
                {t('modules.gtd.actions.register')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onPreviewPath}
                disabled={!pathValue.trim() || previewImportPathPending}
              >
                {t('modules.gtd.actions.preview')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'document'
                ? t('modules.gtd.dialog.deleteDocumentTitle')
                : t('modules.gtd.dialog.deleteGroupTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'document'
                ? t('modules.gtd.dialog.deleteDocumentDescription', {
                    name: deleteTarget.name,
                  })
                : t('modules.gtd.dialog.deleteGroupDescription', {
                    name: deleteTarget?.name,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget?.type === 'group' && deleteTarget.childCount > 0 ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t('modules.gtd.dialog.deleteGroupNotEmpty')}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault()
                onDelete()
              }}
              disabled={
                deleteGroupPending ||
                deleteDocumentPending ||
                (deleteTarget?.type === 'group' && deleteTarget.childCount > 0)
              }
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('modules.gtd.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
