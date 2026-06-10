import type { TFunction } from 'i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  commands,
  unwrapResult,
  type RemLogEntry as BackendRemLogEntry,
  type RemReminder as BackendRemReminder,
  type RemReminderDraft as BackendRemReminderDraft,
  type RemScheduleConfig as BackendRemScheduleConfig,
  type RemState as BackendRemState,
} from '@/lib/tauri-bindings'
import { formatSchedulePreview } from './format'
import { getFrequencyLevel } from './schedule'
import type {
  RemCadence,
  RemLogEntry,
  RemLogStatus,
  RemReminder,
  RemReminderDraft,
  RemScheduleConfig,
  RemScheduleMode,
} from './types'

export const remQueryKeys = {
  state: ['module', 'rem', 'state'] as const,
}

export function useRemState(t: TFunction) {
  return useQuery({
    queryKey: remQueryKeys.state,
    queryFn: async () =>
      mapBackendState(unwrapResult(await commands.remGetState()), t),
  })
}

export function useCreateRemReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draft: RemReminderDraft) =>
      commands.remCreateReminder(toBackendDraft(draft)),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
      }
    },
  })
}

export function useUpdateRemReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (draft: RemReminderDraft) =>
      commands.remUpdateReminder(toBackendDraft(draft)),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
      }
    },
  })
}

export function useToggleRemReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => commands.remToggleReminder(id),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
      }
    },
  })
}

export function useDeleteRemReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => commands.remDeleteReminder(id),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
      }
    },
  })
}

export function useUpdateRemLogStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; status: RemLogStatus }) =>
      commands.remUpdateLogStatus(input.id, input.status),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
      }
    },
  })
}

export function useUpdateRemLogNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; note: string }) =>
      commands.remUpdateLogNote(input.id, input.note),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
      }
    },
  })
}

export function mapBackendState(
  state: BackendRemState,
  t: TFunction
): { reminders: RemReminder[]; logs: RemLogEntry[] } {
  return {
    reminders: state.reminders.map(reminder => mapBackendReminder(reminder, t)),
    logs: state.logs.map(mapBackendLog),
  }
}

function mapBackendReminder(
  reminder: BackendRemReminder,
  t: TFunction
): RemReminder {
  const schedule = mapBackendSchedule(reminder.schedule)

  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    tag: reminder.tag,
    enabled: reminder.enabled,
    createdAt: reminder.created_at,
    updatedAt: reminder.updated_at,
    nextTriggerAt: reminder.next_trigger_at,
    schedule,
    scheduleText: formatSchedulePreview(schedule, t),
    frequency: getFrequencyLevel(new Date(reminder.next_trigger_at)),
    notifications: {
      system: reminder.notifications.system,
      webhook: reminder.notifications.webhook,
      webhookUrl: reminder.notifications.webhook_url,
      webhookBodyTemplate: reminder.notifications.webhook_body_template,
      webhookHeaders: reminder.notifications.webhook_headers.map(header => ({
        name: header.name,
        value: header.value,
      })),
    },
  }
}

function mapBackendLog(log: BackendRemLogEntry): RemLogEntry {
  return {
    id: log.id,
    reminderId: log.reminder_id,
    reminderTitle: log.reminder_title,
    tag: log.tag,
    triggeredAt: log.triggered_at,
    status: log.status,
    note: log.note,
    completedAt: log.completed_at ?? undefined,
    channels: log.channels,
  }
}

function mapBackendSchedule(
  schedule: BackendRemScheduleConfig
): RemScheduleConfig {
  return {
    mode: schedule.mode,
    cadence: schedule.cadence,
    time: schedule.time,
    weekdays: schedule.weekdays,
    monthDay: schedule.month_day,
    month: schedule.month,
    intervalHours: schedule.interval_hours,
    intervalDays: schedule.interval_days,
    intervalUnit: schedule.interval_unit,
    cronExpression: schedule.cron_expression,
  }
}

function toBackendDraft(draft: RemReminderDraft): BackendRemReminderDraft {
  return {
    id: draft.id ?? null,
    title: draft.title,
    description: draft.description,
    tag: draft.tag,
    enabled: draft.enabled,
    schedule: toBackendSchedule(draft.schedule),
    notifications: {
      system: draft.notifications.system,
      webhook: draft.notifications.webhook,
      webhook_url: draft.notifications.webhookUrl,
      webhook_body_template: draft.notifications.webhookBodyTemplate,
      webhook_headers: draft.notifications.webhookHeaders
        .filter(header => header.name.trim())
        .map(header => ({
          name: header.name.trim(),
          value: header.value,
        })),
    },
  }
}

function toBackendSchedule(
  schedule: RemScheduleConfig
): BackendRemScheduleConfig {
  return {
    mode: schedule.mode as RemScheduleMode,
    cadence: schedule.cadence as RemCadence,
    time: schedule.time,
    weekdays: schedule.weekdays,
    month_day: schedule.monthDay,
    month: schedule.month,
    interval_hours: schedule.intervalHours,
    interval_days: schedule.intervalDays,
    interval_unit: schedule.intervalUnit,
    cron_expression: schedule.cronExpression,
  }
}

