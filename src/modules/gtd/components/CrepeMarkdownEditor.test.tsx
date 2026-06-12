import { render } from '@/test/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CrepeMarkdownEditor } from './CrepeMarkdownEditor'

const crepeMock = vi.hoisted(() => ({
  constructors: vi.fn(),
  create: vi.fn(() => Promise.resolve()),
  destroy: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  use: vi.fn(),
  on: vi.fn(),
}))

vi.mock('@milkdown/crepe', () => ({
  Crepe: class {
    static Feature = {
      Placeholder: 'placeholder',
    }

    editor = {
      remove: crepeMock.remove,
      use: crepeMock.use,
    }

    constructor(config: unknown) {
      crepeMock.constructors(config)
    }

    create = crepeMock.create
    destroy = crepeMock.destroy
    on = crepeMock.on
  },
}))

describe('CrepeMarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not recreate Crepe when saved content refreshes the value prop', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CrepeMarkdownEditor
        value="original"
        placeholder="Write"
        onChange={onChange}
      />
    )

    rerender(
      <CrepeMarkdownEditor
        value="changed"
        placeholder="Write"
        onChange={onChange}
      />
    )

    expect(crepeMock.constructors).toHaveBeenCalledTimes(1)
    expect(crepeMock.destroy).not.toHaveBeenCalled()
  })

  it('disables remarkPreserveEmptyLinePlugin so line breaks stay as newlines', () => {
    render(
      <CrepeMarkdownEditor
        value="original"
        placeholder="Write"
        onChange={vi.fn()}
      />
    )

    expect(crepeMock.remove).toHaveBeenCalledTimes(1)
  })
})
