import { lazy } from 'react'
import { ListTodo } from 'lucide-react'
import type { AppModule } from '../types'

export const gtdModule: AppModule = {
  id: 'gtd',
  labelKey: 'modules.gtd.title',
  shortLabel: 'GTD',
  icon: ListTodo,
  order: 10,
  component: lazy(() =>
    import('./GtdApp').then(module => ({ default: module.GtdApp }))
  ),
  rightSidebarComponent: lazy(() =>
    import('./GtdRightSidebar').then(module => ({
      default: module.GtdRightSidebar,
    }))
  ),
}
