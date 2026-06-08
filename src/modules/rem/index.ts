import { lazy } from 'react'
import { BellRing } from 'lucide-react'
import type { AppModule } from '../types'

export const remModule: AppModule = {
  id: 'rem',
  labelKey: 'modules.rem.title',
  shortLabel: 'REM',
  aliases: ['remainder', 'reminder', 'rem', '提醒', '奇怪提醒', 'strange reminder'],
  icon: BellRing,
  order: 20,
  component: lazy(() =>
    import('./RemApp').then(module => ({ default: module.RemApp }))
  ),
  rightSidebarComponent: lazy(() =>
    import('./RemRightSidebar').then(module => ({
      default: module.RemRightSidebar,
    }))
  ),
}
