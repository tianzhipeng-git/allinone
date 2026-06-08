import type { AppCommand } from './types'
import { notifications } from '@/lib/notifications'

export const notificationCommands: AppCommand[] = [
  {
    id: 'notification.test-toast',
    labelKey: 'commands.testToast.label',
    descriptionKey: 'commands.testToast.description',
    group: 'debug',
    keywords: ['test', 'toast', 'notification', 'debug'],
    async execute() {
      await notifications.success('Test Toast', 'This is a test notification')
    },
  },
  {
    id: 'notification.test-native',
    labelKey: 'commands.testNativeNotification.label',
    descriptionKey: 'commands.testNativeNotification.description',
    group: 'debug',
    keywords: ['test', 'native', 'notification', 'system', 'debug'],
    async execute() {
      await notifications.success(
        'Test Native Notification',
        'If you see this banner, system notifications are working.',
        true
      )
    },
  },
]
