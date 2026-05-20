import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model'
import type { EditorView } from '@milkdown/kit/prose/view'

import { Plugin, PluginKey } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $prose } from '@milkdown/kit/utils'

interface FoldState {
  foldedPositions: Set<number>
}

interface FoldMeta {
  type: 'toggle'
  pos: number
}

const MAX_HEADING_LEVEL = 4
const foldingPluginKey = new PluginKey<FoldState>('gtd-folding')
const FOLD_HIDDEN_CODE_DOM_CLASS = 'gtd-fold-hidden-code-dom'

function isHeading(node: ProseMirrorNode) {
  return node.type.name === 'heading'
}

function isFoldableNode(node: ProseMirrorNode) {
  return (
    isHeading(node) ||
    node.type.name === 'code_block' ||
    node.type.name === 'blockquote'
  )
}

function isFoldableAt(doc: ProseMirrorNode, pos: number) {
  const node = doc.nodeAt(pos)
  return Boolean(node && isFoldableNode(node))
}

function pruneFoldedPositions(doc: ProseMirrorNode, positions: Set<number>) {
  return new Set([...positions].filter(pos => isFoldableAt(doc, pos)))
}

function createToggleButton(pos: number, isFolded: boolean) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'gtd-fold-toggle'
  button.dataset.foldPos = String(pos)
  button.dataset.foldState = isFolded ? 'folded' : 'open'
  button.ariaLabel = isFolded ? 'Expand block' : 'Fold block'
  button.title = isFolded ? 'Expand block' : 'Fold block'
  return button
}

function getTogglePosition(node: ProseMirrorNode, pos: number) {
  return isHeading(node) ? pos + 1 : pos
}

function getHeadingFoldEnd(
  doc: ProseMirrorNode,
  headingPos: number,
  headingNode: ProseMirrorNode
) {
  const headingLevel = headingNode.attrs.level as number
  let end = doc.content.size
  let foundHeading = false

  doc.nodesBetween(0, doc.content.size, (node, pos, parent) => {
    if (parent !== doc) {
      return false
    }

    if (
      pos > headingPos &&
      isHeading(node) &&
      (node.attrs.level as number) <= headingLevel &&
      !foundHeading
    ) {
      end = pos
      foundHeading = true
    }

    return false
  })

  return end
}

function buildDecorations(doc: ProseMirrorNode, foldState: FoldState) {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (!isFoldableNode(node)) {
      return true
    }

    const isFolded = foldState.foldedPositions.has(pos)
    decorations.push(
      Decoration.widget(
        getTogglePosition(node, pos),
        () => createToggleButton(pos, isFolded),
        {
          side: -1,
          key: `gtd-fold-toggle-${pos}-${isFolded ? 'folded' : 'open'}`,
        }
      )
    )

    if (isFolded && isHeading(node)) {
      const end = getHeadingFoldEnd(doc, pos, node)
      doc.nodesBetween(pos, end, (child, childPos, parent) => {
        if (parent !== doc) {
          return false
        }

        if (childPos > pos && childPos < end) {
          decorations.push(
            Decoration.node(childPos, childPos + child.nodeSize, {
              class: 'gtd-fold-hidden',
            })
          )
        }

        return false
      })
    }

    if (
      isFolded &&
      (node.type.name === 'code_block' || node.type.name === 'blockquote')
    ) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'gtd-fold-collapsed',
        })
      )
    }

    return true
  })

  return DecorationSet.create(doc, decorations)
}

function clearHiddenCodeDomClasses(view: EditorView) {
  view.dom
    .querySelectorAll(`.${FOLD_HIDDEN_CODE_DOM_CLASS}`)
    .forEach(element => {
      element.classList.remove(FOLD_HIDDEN_CODE_DOM_CLASS)
    })
}

function hideCodeBlockDom(view: EditorView, pos: number) {
  const dom = view.nodeDOM(pos)
  if (dom instanceof HTMLElement) {
    dom.classList.add(FOLD_HIDDEN_CODE_DOM_CLASS)
  }
}

function syncCodeBlockFolding(view: EditorView) {
  clearHiddenCodeDomClasses(view)

  const foldState = foldingPluginKey.getState(view.state)
  if (!foldState) {
    return
  }

  const { doc } = view.state
  doc.descendants((node, pos) => {
    if (!foldState.foldedPositions.has(pos)) {
      return true
    }

    if (node.type.name === 'code_block') {
      hideCodeBlockDom(view, pos)
      return true
    }

    if (isHeading(node)) {
      const end = getHeadingFoldEnd(doc, pos, node)
      doc.nodesBetween(pos, end, (child, childPos, parent) => {
        if (parent !== doc) {
          return false
        }

        if (
          childPos > pos &&
          childPos < end &&
          child.type.name === 'code_block'
        ) {
          hideCodeBlockDom(view, childPos)
        }

        return false
      })
    }

    return true
  })
}

export function normalizeMarkdownHeadingDepth(markdown: string) {
  let insideFence = false

  return markdown
    .split('\n')
    .map(line => {
      if (/^ {0,3}(```|~~~)/.test(line)) {
        insideFence = !insideFence
        return line
      }

      if (insideFence) {
        return line
      }

      return line.replace(/^( {0,3})#{5,6}(\s+)/, '$1####$2')
    })
    .join('\n')
}

export const gtdMarkdownEditingPlugin = $prose(() => {
  return new Plugin<FoldState>({
    key: foldingPluginKey,
    state: {
      init: () => ({ foldedPositions: new Set() }),
      apply: (tr, value) => {
        const meta = tr.getMeta(foldingPluginKey) as FoldMeta | undefined
        const foldedPositions = tr.docChanged
          ? new Set(
              [...value.foldedPositions]
                .map(pos => tr.mapping.map(pos))
                .filter(pos => isFoldableAt(tr.doc, pos))
            )
          : new Set(value.foldedPositions)

        if (meta?.type === 'toggle') {
          if (foldedPositions.has(meta.pos)) {
            foldedPositions.delete(meta.pos)
          } else {
            foldedPositions.add(meta.pos)
          }
        }

        return {
          foldedPositions: pruneFoldedPositions(tr.doc, foldedPositions),
        }
      },
    },
    props: {
      decorations: state => {
        const foldState = foldingPluginKey.getState(state)
        return foldState ? buildDecorations(state.doc, foldState) : null
      },
      handleClick: (view, _pos, event) => {
        const target = event.target
        if (!(target instanceof HTMLElement)) {
          return false
        }

        const button = target.closest<HTMLButtonElement>('.gtd-fold-toggle')
        const pos = Number(button?.dataset.foldPos)
        if (!button || Number.isNaN(pos)) {
          return false
        }

        event.preventDefault()
        view.dispatch(
          view.state.tr.setMeta(foldingPluginKey, {
            type: 'toggle',
            pos,
          } satisfies FoldMeta)
        )
        return true
      },
    },
    appendTransaction: (_transactions, _oldState, newState) => {
      let tr = newState.tr
      let changed = false

      newState.doc.descendants((node, pos) => {
        if (!isHeading(node) || node.attrs.level <= MAX_HEADING_LEVEL) {
          return true
        }

        tr = tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          level: MAX_HEADING_LEVEL,
        })
        changed = true
        return false
      })

      return changed ? tr : null
    },
    view: view => {
      queueMicrotask(() => syncCodeBlockFolding(view))
      return {
        update: updatedView => {
          syncCodeBlockFolding(updatedView)
        },
        destroy: () => {
          clearHiddenCodeDomClasses(view)
        },
      }
    },
  })
})
