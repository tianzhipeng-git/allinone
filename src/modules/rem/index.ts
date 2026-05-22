import { lazy } from 'react'
import { BellRing } from 'lucide-react'
import type { AppModule } from '../types'

export const remModule: AppModule = {
  id: 'rem',
  labelKey: 'modules.rem.title',
  shortLabel: 'REM',
  icon: BellRing,
  order: 20,
  component: lazy(() =>
    import('./RemApp').then(module => ({ default: module.RemApp }))
  ),
}
