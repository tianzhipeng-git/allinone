import type { GtdDocument, GtdGroup } from '@/lib/tauri-bindings'

export interface GtdGroupNode extends GtdGroup {
  children: GtdGroupNode[]
  documents: GtdDocument[]
}
