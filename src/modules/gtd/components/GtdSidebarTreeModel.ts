import type { GtdDocument } from '@/lib/tauri-bindings'
import type { GtdGroupNode } from '../types'

export const GROUP_PREFIX = 'group:'
export const DOCUMENT_PREFIX = 'document:'
export const TREE_ROOT_ID = 'gtd-root'
export const ROOT_GROUP_NAME = 'Inbox'

export type GtdTreeItemType = 'group' | 'document'

export interface GtdTreeItem {
  id: string
  name: string
  type: GtdTreeItemType
  recordId: number
  children?: GtdTreeItem[]
}

export type RenameTarget =
  | { type: 'group'; id: number; name: string }
  | { type: 'document'; id: number; name: string }

export type DeleteTarget =
  | { type: 'group'; id: number; name: string; childCount: number }
  | { type: 'document'; id: number; name: string }

export type ParsedTreeItemId =
  | { type: 'group'; id: number }
  | { type: 'document'; id: number }

export function getHiddenRoot(nodes: GtdGroupNode[]) {
  return nodes.find(
    node => node.parent_id === null && node.name === ROOT_GROUP_NAME
  )
}

export function getFirstGroupId(nodes: GtdGroupNode[]): number | null {
  const hiddenRoot = getHiddenRoot(nodes)
  return hiddenRoot?.children[0]?.id ?? hiddenRoot?.id ?? nodes[0]?.id ?? null
}

export function getVisibleNodes(nodes: GtdGroupNode[]) {
  const hiddenRoot = getHiddenRoot(nodes)
  if (!hiddenRoot) {
    return { nodes, rootDocuments: [] as GtdDocument[] }
  }

  return {
    nodes: [
      ...hiddenRoot.children,
      ...nodes.filter(node => node.id !== hiddenRoot.id),
    ],
    rootDocuments: hiddenRoot.documents,
  }
}

export function findGroupName(
  nodes: GtdGroupNode[],
  groupId: number | null
): string | null {
  if (groupId === null) {
    return null
  }

  for (const node of nodes) {
    if (node.id === groupId) {
      return node.name
    }

    const childName = findGroupName(node.children, groupId)
    if (childName) {
      return childName
    }
  }

  return null
}

function createDocumentTreeItem(document: GtdDocument): GtdTreeItem {
  return {
    id: `${DOCUMENT_PREFIX}${document.id}`,
    name: document.title,
    type: 'document',
    recordId: document.id,
  }
}

function createGroupTreeItem(node: GtdGroupNode): GtdTreeItem {
  return {
    id: `${GROUP_PREFIX}${node.id}`,
    name: node.name,
    type: 'group',
    recordId: node.id,
    children: [
      ...node.documents.map(createDocumentTreeItem),
      ...node.children.map(createGroupTreeItem),
    ],
  }
}

export function buildArboristTreeData(
  nodes: GtdGroupNode[],
  rootDocuments: GtdDocument[]
): GtdTreeItem[] {
  return [
    ...rootDocuments.map(createDocumentTreeItem),
    ...nodes.map(createGroupTreeItem),
  ]
}

export function parseTreeItemId(id: string): ParsedTreeItemId | null {
  if (id.startsWith(GROUP_PREFIX)) {
    return { type: 'group' as const, id: Number(id.slice(GROUP_PREFIX.length)) }
  }

  if (id.startsWith(DOCUMENT_PREFIX)) {
    return {
      type: 'document' as const,
      id: Number(id.slice(DOCUMENT_PREFIX.length)),
    }
  }

  return null
}
