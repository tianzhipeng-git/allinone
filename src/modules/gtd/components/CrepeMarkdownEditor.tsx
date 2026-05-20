import { Crepe } from '@milkdown/crepe'
import { useEffect, useRef } from 'react'

import {
  gtdMarkdownEditingPlugin,
  normalizeMarkdownHeadingDepth,
} from './gtdMarkdownPlugins'

interface CrepeMarkdownEditorProps {
  value: string
  placeholder: string
  onChange: (markdown: string) => void
}

export function CrepeMarkdownEditor({
  value,
  placeholder,
  onChange,
}: CrepeMarkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    const crepe = new Crepe({
      root: rootRef.current,
      defaultValue: normalizeMarkdownHeadingDepth(value),
      features: {
        [Crepe.Feature.Placeholder]: true,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: placeholder,
        },
      },
    })

    crepe.editor.use(gtdMarkdownEditingPlugin)

    crepe.on(listener => {
      listener.markdownUpdated((_, markdown) => {
        onChangeRef.current(markdown)
      })
    })

    void crepe.create()

    return () => {
      void crepe.destroy()
    }
  }, [placeholder, value])

  return <div ref={rootRef} className="gtd-crepe-editor h-full" />
}
