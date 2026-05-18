import type { GtdDocument, GtdGroup } from '@/lib/tauri-bindings'
import type { GtdGroupNode } from './types'

export function buildGtdGroupTree(
  groups: GtdGroup[],
  documents: GtdDocument[]
): GtdGroupNode[] {
  const nodes = new Map<number, GtdGroupNode>()

  groups.forEach(group => {
    nodes.set(group.id, { ...group, children: [], documents: [] })
  })

  documents.forEach(document => {
    nodes.get(document.group_id)?.documents.push(document)
  })

  const roots: GtdGroupNode[] = []
  nodes.forEach(node => {
    if (node.parent_id === null) {
      roots.push(node)
      return
    }

    const parent = nodes.get(node.parent_id)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (items: GtdGroupNode[]) => {
    items.sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
    )
    items.forEach(item => {
      item.children.sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
      )
      item.documents.sort((a, b) => a.title.localeCompare(b.title))
      sortNodes(item.children)
    })
  }

  sortNodes(roots)

  return roots
}
