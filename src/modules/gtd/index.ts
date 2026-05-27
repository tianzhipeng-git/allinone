import { lazy } from 'react'
import { ListTodo } from 'lucide-react'
import type { AppModule } from '../types'
import { gtdQuickSearch } from './quick-search'

export const gtdModule: AppModule = {
  id: 'gtd',
  labelKey: 'modules.gtd.title',
  shortLabel: 'GTD',
  aliases: ['global todo', 'todo', '待办', '全局待办'],
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
  quickSearch: gtdQuickSearch,
}
