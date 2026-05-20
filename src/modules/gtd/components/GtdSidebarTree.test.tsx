import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { GtdTree } from './GtdSidebarTree'
import {
  DOCUMENT_PREFIX,
  GROUP_PREFIX,
  type GtdTreeItem,
} from './GtdSidebarTreeModel'

const treeData: GtdTreeItem[] = [
  {
    id: `${GROUP_PREFIX}1`,
    name: 'Project',
    type: 'group',
    recordId: 1,
    children: [
      {
        id: `${DOCUMENT_PREFIX}1`,
        name: 'Todo',
        type: 'document',
        recordId: 1,
      },
    ],
  },
]

describe('GtdTree', () => {
  it('toggles a selected folder on consecutive clicks', async () => {
    const user = userEvent.setup()

    render(
      <div className="h-80">
        <GtdTree
          data={treeData}
          selectedItemId={`${GROUP_PREFIX}1`}
          renameLabel="Rename"
          deleteLabel="Delete"
          dragHandleHint="Drag to move"
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onSelect={vi.fn()}
          onMove={vi.fn()}
        />
      </div>
    )

    const project = screen.getByText('Project')
    expect(screen.getByText('Todo')).toBeInTheDocument()

    await user.click(project)

    expect(screen.queryByText('Todo')).not.toBeInTheDocument()

    await user.click(project)

    expect(screen.getByText('Todo')).toBeInTheDocument()
  })

  it('collapses a folder without changing activation when document row is controlled selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    function Host() {
      const [selected, setSelected] = useState(`${DOCUMENT_PREFIX}1`)
      return (
        <div className="h-80">
          <GtdTree
            data={treeData}
            selectedItemId={selected}
            renameLabel="Rename"
            deleteLabel="Delete"
            dragHandleHint="Drag to move"
            onRename={vi.fn()}
            onDelete={vi.fn()}
            onSelect={id => {
              onSelect(id)
              setSelected(id)
            }}
            onMove={vi.fn()}
          />
        </div>
      )
    }

    render(<Host />)

    expect(screen.getByText('Todo')).toBeInTheDocument()

    await user.click(screen.getByText('Project'))

    expect(screen.queryByText('Todo')).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
