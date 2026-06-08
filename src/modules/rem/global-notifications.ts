import { listen } from '@tauri-apps/api/event'
import {
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification'
import { logger } from '@/lib/logger'
import { notify } from '@/lib/notifications'

interface RemNotificationPayload {
  title: string
  body: string
  logId: string
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted()
    if (!granted) {
      const permission = await requestPermission()
      granted = permission === 'granted'
    }

    if (!granted) {
      logger.warn('Notification permission was not granted')
    }

    return granted
  } catch (error) {
    logger.warn('Failed to request notification permission', { error })
    return false
  }
}

export function listenForRemNotifications() {
  return listen<RemNotificationPayload>('rem://notification', event => {
    const { title, body } = event.payload

    logger.info('REM notification received', { payload: event.payload })

    void notify(title, body, { type: 'info' })
  })
}
