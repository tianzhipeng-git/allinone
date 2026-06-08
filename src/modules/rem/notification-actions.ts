import type { TFunction } from 'i18next'
import { useEffect } from 'react'
import {
  onAction,
  registerActionTypes,
  type Options,
} from '@tauri-apps/plugin-notification'
import { useQueryClient } from '@tanstack/react-query'
import { commands } from '@/lib/tauri-bindings'
import { remQueryKeys } from './services'

const remActionTypeId = 'rem-log-actions'
const confirmActionId = 'confirm'
const ignoreActionId = 'ignore'

export function useRemNotificationActions(t: TFunction) {
  const queryClient = useQueryClient()

  useEffect(() => {
    void registerActionTypes([
      {
        id: remActionTypeId,
        actions: [
          {
            id: confirmActionId,
            title: t('modules.rem.actions.confirm'),
            foreground: false,
          },
          {
            id: ignoreActionId,
            title: t('modules.rem.actions.ignore'),
            destructive: true,
            foreground: false,
          },
        ],
      },
    ])

    const unlisten = onAction(notification => {
      void handleRemNotificationAction(notification, queryClient)
    })

    return () => {
      void unlisten.then(listener => listener.unregister())
    }
  }, [queryClient, t])
}

async function handleRemNotificationAction(
  notification: Options,
  queryClient: ReturnType<typeof useQueryClient>
) {
  if (notification.actionTypeId !== remActionTypeId) {
    return
  }

  const logId = readExtraString(notification.extra, 'logId')
  const actionId = readActionId(notification)

  if (!logId || !actionId) {
    return
  }

  if (actionId === confirmActionId) {
    await commands.remUpdateLogStatus(logId, 'confirmed')
  }

  if (actionId === ignoreActionId) {
    await commands.remUpdateLogStatus(logId, 'ignored')
  }

  queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
}

function readExtraString(
  extra: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = extra?.[key]
  return typeof value === 'string' ? value : null
}

function readActionId(notification: Options): string | null {
  const action = notification as Options & {
    actionId?: unknown
    action_id?: unknown
    actionIdentifier?: unknown
  }
  const value = action.actionId ?? action.action_id ?? action.actionIdentifier

  return typeof value === 'string' ? value : null
}
