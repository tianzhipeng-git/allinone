import { lazy } from 'react'
import { BellRing } from 'lucide-react'
import type { AppModule } from '../types'

export const strangeReminderModule: AppModule = {
  id: 'strange-reminder',
  labelKey: 'modules.strangeReminder.title',
  shortLabel: 'RMD',
  aliases: ['reminder', 'rmd', '奇怪提醒', '提醒'],
  icon: BellRing,
  order: 20,
  component: lazy(() =>
    import('./StrangeReminderApp').then(module => ({
      default: module.StrangeReminderApp,
    }))
  ),
}
