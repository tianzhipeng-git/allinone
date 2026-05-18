import { describe, expect, it } from 'vitest'
import { buildGtdGroupTree } from '../tree'
import type { GtdDocument, GtdGroup } from '@/lib/tauri-bindings'

const groups: GtdGroup[] = [
  { id: 2, parent_id: 1, name: 'Project B', sort_order: 1 },
  { id: 1, parent_id: null, name: 'Inbox', sort_order: 0 },
  { id: 3, parent_id: 1, name: 'Project A', sort_order: 0 },
]

const documents: GtdDocument[] = [
  {
    id: 1,
    group_id: 3,
    title: 'Todo B',
    path: '/tmp/b.md',
    markdown_heading: 'Todo B',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 2,
    group_id: 3,
    title: 'Todo A',
    path: '/tmp/a.md',
    markdown_heading: 'Todo A',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
]

describe('buildGtdGroupTree', () => {
  it('nests groups and sorts documents by title', () => {
    const [root] = buildGtdGroupTree(groups, documents)

    expect(root?.name).toBe('Inbox')
    expect(root?.children.map(child => child.name)).toEqual([
      'Project A',
      'Project B',
    ])
    expect(
      root?.children[0]?.documents.map(document => document.title)
    ).toEqual(['Todo A', 'Todo B'])
  })
})
