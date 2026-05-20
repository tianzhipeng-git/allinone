import { describe, expect, it } from 'vitest'

import { normalizeMarkdownHeadingDepth } from '../components/gtdMarkdownPlugins'

describe('normalizeMarkdownHeadingDepth', () => {
  it('limits markdown headings to four levels', () => {
    expect(
      normalizeMarkdownHeadingDepth(
        ['# One', '#### Four', '##### Five', '###### Six'].join('\n')
      )
    ).toBe(['# One', '#### Four', '#### Five', '#### Six'].join('\n'))
  })

  it('keeps fenced code content unchanged', () => {
    expect(
      normalizeMarkdownHeadingDepth(
        ['##### Outside', '```', '##### Inside', '```'].join('\n')
      )
    ).toBe(['#### Outside', '```', '##### Inside', '```'].join('\n'))
  })
})
