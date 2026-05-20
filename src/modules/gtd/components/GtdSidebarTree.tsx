import {
  FileText,
  Folder,
  FolderOpen,
  GripVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  type CSSProperties,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Tree,
  type MoveHandler,
  type NodeApi,
  type NodeRendererProps,
  type RowRendererProps,
} from 'react-arborist'
import { createDragDropManager } from 'dnd-core'
import { TouchBackend } from 'react-dnd-touch-backend'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  TREE_ROOT_ID,
  parseTreeItemId,
  type DeleteTarget,
  type GtdTreeItem,
  type RenameTarget,
} from './GtdSidebarTreeModel'

const ROW_HEIGHT = 28
const MIN_TREE_HEIGHT = 240
const FALLBACK_TREE_HEIGHT = 360

function useTreeViewportHeight() {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState(FALLBACK_TREE_HEIGHT)

  useEffect(() => {
    const element = viewportRef.current
    if (!element || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      const nextHeight = entry?.contentRect.height
      if (!nextHeight) {
        return
      }

      setHeight(Math.max(MIN_TREE_HEIGHT, Math.floor(nextHeight)))
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return { viewportRef, height }
}

function GtdTreeNode({
  node,
  style,
  dragHandle,
  renameLabel,
  deleteLabel,
  dragHandleHint,
  onRename,
  onDelete,
}: NodeRendererProps<GtdTreeItem> & {
  renameLabel: string
  deleteLabel: string
  dragHandleHint: string
  onRename: (target: RenameTarget) => void
  onDelete: (target: DeleteTarget) => void
}) {
  const data = node.data
  const isGroup = data.type === 'group'
  const childCount = data.children?.length ?? 0
  const Icon = isGroup && node.isOpen ? FolderOpen : isGroup ? Folder : FileText
  const rowStyle = {
    ...style,
    paddingLeft: Number(style.paddingLeft ?? 0) + 4,
  } as CSSProperties

  return (
    <div
      style={rowStyle}
      className={cn(
        'group/gtd-tree-row flex items-center pe-2 text-xs outline-hidden',
        node.isDragging && 'opacity-45'
      )}
      data-gtd-tree-item-id={data.id}
    >
      <div
        className={cn(
          'flex h-7 min-w-0 flex-1 items-center gap-1 rounded-sm ps-1 pe-1.5',
          'bg-transparent hover:bg-accent/70',
          node.isSelected && 'bg-accent/70 font-medium',
          node.willReceiveDrop && 'bg-primary/15 text-primary'
        )}
      >
        <div
          ref={dragHandle}
          className="flex h-7 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm active:cursor-grabbing"
          title={dragHandleHint}
        >
          <GripVertical
            className={cn(
              'size-3 shrink-0 text-muted-foreground pointer-events-none',
              'opacity-0 transition-opacity group-hover/gtd-tree-row:opacity-100',
              node.isDragging && 'opacity-100'
            )}
            aria-hidden="true"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <span
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-sm',
              isGroup ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate text-start">
            {data.name}
          </span>
          {isGroup && childCount > 0 ? (
            <span className="text-[10px] text-muted-foreground">
              {childCount}
            </span>
          ) : null}
        </div>
        <div className="flex opacity-0 transition-opacity group-hover/gtd-tree-row:opacity-100 focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6"
            title={renameLabel}
            onClick={event => {
              event.stopPropagation()
              onRename({
                type: data.type,
                id: data.recordId,
                name: data.name,
              })
            }}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 text-muted-foreground hover:text-destructive"
            title={deleteLabel}
            onClick={event => {
              event.stopPropagation()
              if (data.type === 'group') {
                onDelete({
                  type: 'group',
                  id: data.recordId,
                  name: data.name,
                  childCount,
                })
                return
              }

              onDelete({
                type: 'document',
                id: data.recordId,
                name: data.name,
              })
            }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function GtdTreeRow({
  node,
  attrs,
  innerRef,
  children,
}: RowRendererProps<GtdTreeItem>) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (node.data.type === 'group') {
      // Expanding/collapsing a folder must not activate the row: `handleClick`
      // would call `activate` → parental `onSelect`, which clears
      // `selectedDocumentId` and empties the main editor.
      if (!event.metaKey && !event.shiftKey && !event.ctrlKey) {
        node.toggle()
      }
      return
    }
    node.handleClick(event)
  }

  return (
    <div
      {...attrs}
      ref={innerRef}
      className={cn(attrs.className, 'outline-hidden')}
      onFocus={event => event.stopPropagation()}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

export function GtdTree({
  data,
  selectedItemId,
  renameLabel,
  deleteLabel,
  dragHandleHint,
  onRename,
  onDelete,
  onSelect,
  onMove,
}: {
  data: GtdTreeItem[]
  selectedItemId?: string
  renameLabel: string
  deleteLabel: string
  dragHandleHint: string
  onRename: (target: RenameTarget) => void
  onDelete: (target: DeleteTarget) => void
  onSelect: (itemId: string) => void
  onMove: (sourceItemId: string, targetParentItemId: string) => void
}) {
  const { viewportRef, height } = useTreeViewportHeight()

  const dragDropManager = useMemo(
    () =>
      createDragDropManager(TouchBackend, undefined, {
        enableMouseEvents: true,
      }),
    []
  )

  const handleMove: MoveHandler<GtdTreeItem> = ({ dragIds, parentId }) => {
    const sourceItemId = dragIds[0]
    if (!sourceItemId) {
      return
    }

    onMove(sourceItemId, parentId ?? TREE_ROOT_ID)
  }

  const disableDrop = ({
    parentNode,
    dragNodes,
  }: {
    parentNode: NodeApi<GtdTreeItem>
    dragNodes: NodeApi<GtdTreeItem>[]
    index: number
  }) => {
    if (!dragNodes[0]) {
      return true
    }

    return !parentNode.isRoot && parentNode.data.type !== 'group'
  }

  return (
    <div ref={viewportRef} className="h-full min-h-0">
      <Tree<GtdTreeItem>
        data={data}
        idAccessor="id"
        childrenAccessor={item => item.children ?? null}
        dndManager={dragDropManager}
        selection={selectedItemId}
        width="100%"
        height={height}
        indent={12}
        rowHeight={ROW_HEIGHT}
        overscanCount={4}
        openByDefault
        disableMultiSelection
        disableEdit
        disableDrop={disableDrop}
        renderRow={GtdTreeRow}
        onMove={handleMove}
        onActivate={node => {
          if (parseTreeItemId(node.id)) {
            onSelect(node.id)
          }
        }}
        className="py-2"
      >
        {props => (
          <GtdTreeNode
            {...props}
            renameLabel={renameLabel}
            deleteLabel={deleteLabel}
            dragHandleHint={dragHandleHint}
            onRename={onRename}
            onDelete={onDelete}
          />
        )}
      </Tree>
    </div>
  )
}
