/**
 * Re-export generated Tauri bindings with project conventions
 */

import { invoke } from '@tauri-apps/api/core'
import { commands as generatedCommands, type Result } from './bindings'

export { type Result }

export type {
  AppPreferences,
  GtdDocument,
  GtdGroup,
  GtdImportPreview,
  GtdTree,
  JsonValue,
  RecoveryError,
} from './bindings'

export type RemScheduleMode = 'Cron' | 'FixedRate' | 'FixedDelay'
export type RemLogStatus = 'Pending' | 'Confirmed' | 'Ignored'

export interface RemReminder {
  id: number
  title: string
  description: string
  tag: string
  active: boolean
  schedule_mode: RemScheduleMode
  cron_expr: string | null
  interval_minutes: number | null
  natural_text: string
  webhook_url: string | null
  notify_system: boolean
  created_at: string
  updated_at: string
}

export interface RemLogEntry {
  id: number
  reminder_id: number
  triggered_at: string
  status: RemLogStatus
  note: string | null
  completed_at: string | null
}

export interface RemDashboard {
  reminders: RemReminder[]
  logs: RemLogEntry[]
}

export interface RemUpsertReminderInput {
  id: number | null
  title: string
  description: string
  tag: string
  active: boolean
  schedule_mode: RemScheduleMode
  cron_expr: string | null
  interval_minutes: number | null
  natural_text: string
  webhook_url: string | null
  notify_system: boolean
}

export const commands = {
  ...generatedCommands,
  remGetDashboard: () =>
    invoke<RemDashboard>('rem_get_dashboard')
      .then(data => ({ status: 'ok', data }) as Result<RemDashboard, string>)
      .catch(
        error =>
          ({ status: 'error', error: String(error) }) as Result<
            RemDashboard,
            string
          >
      ),
  remUpsertReminder: (input: RemUpsertReminderInput) =>
    invoke<null>('rem_upsert_reminder', { input })
      .then(data => ({ status: 'ok', data }) as Result<null, string>)
      .catch(
        error =>
          ({ status: 'error', error: String(error) }) as Result<null, string>
      ),
  remToggleReminder: (reminderId: number, active: boolean) =>
    invoke<null>('rem_toggle_reminder', { reminderId, active })
      .then(data => ({ status: 'ok', data }) as Result<null, string>)
      .catch(
        error =>
          ({ status: 'error', error: String(error) }) as Result<null, string>
      ),
  remDeleteReminder: (reminderId: number) =>
    invoke<null>('rem_delete_reminder', { reminderId })
      .then(data => ({ status: 'ok', data }) as Result<null, string>)
      .catch(
        error =>
          ({ status: 'error', error: String(error) }) as Result<null, string>
      ),
  remUpdateLogStatus: (
    logId: number,
    status: RemLogStatus,
    note: string | null
  ) =>
    invoke<null>('rem_update_log_status', { logId, status, note })
      .then(data => ({ status: 'ok', data }) as Result<null, string>)
      .catch(
        error =>
          ({ status: 'error', error: String(error) }) as Result<null, string>
      ),
}

export function unwrapResult<T, E>(
  result: { status: 'ok'; data: T } | { status: 'error'; error: E }
): T {
  if (result.status === 'ok') {
    return result.data
  }
  throw result.error
}
