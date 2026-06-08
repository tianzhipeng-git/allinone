import { describe, expect, it } from 'vitest'
import { compareRemLogsDesc, sortReminders } from '../sort'
import type { RemLogEntry, RemReminder } from '../types'

function createReminder(overrides: Partial<RemReminder> = {}): RemReminder {
  return {
    id: 'reminder-1',
    title: 'Alpha',
    description: '',
    tag: 'life',
    enabled: true,
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-05T09:00:00.000Z',
    nextTriggerAt: '2026-06-10T09:00:00.000Z',
    schedule: {
      mode: 'cron',
      cadence: 'daily',
      time: '09:00',
      weekdays: [],
      monthDay: 1,
      month: 1,
      intervalHours: 2,
      cronExpression: '0 9 * * *',
    },
    scheduleText: '每天 09:00',
    frequency: 'week',
    notifications: {
      system: true,
      webhookUrl: '',
      webhookBodyTemplate: '',
      webhookHeaders: [],
    },
    ...overrides,
  }
}

function createLog(overrides: Partial<RemLogEntry> = {}): RemLogEntry {
  return {
    id: 'log-1',
    reminderId: 'reminder-1',
    reminderTitle: 'Alpha',
    tag: 'life',
    triggeredAt: '2026-06-08T09:00:00.000Z',
    status: 'pending',
    note: '',
    channels: ['system'],
    ...overrides,
  }
}

describe('rem sort helpers', () => {
  it('sorts logs by completed time when available, otherwise triggered time', () => {
    const logs = [
      createLog({
        id: 'pending',
        triggeredAt: '2026-06-08T12:00:00.000Z',
        status: 'pending',
      }),
      createLog({
        id: 'confirmed',
        triggeredAt: '2026-06-08T09:00:00.000Z',
        completedAt: '2026-06-08T15:00:00.000Z',
        status: 'confirmed',
      }),
      createLog({
        id: 'ignored',
        triggeredAt: '2026-06-08T10:00:00.000Z',
        status: 'ignored',
      }),
    ]

    expect(logs.sort(compareRemLogsDesc).map(log => log.id)).toEqual([
      'confirmed',
      'pending',
      'ignored',
    ])
  })

  it('sorts reminders by next trigger ascending by default', () => {
    const reminders = [
      createReminder({
        id: 'late',
        title: 'Late',
        nextTriggerAt: '2026-06-20T09:00:00.000Z',
      }),
      createReminder({
        id: 'soon',
        title: 'Soon',
        nextTriggerAt: '2026-06-09T09:00:00.000Z',
      }),
    ]

    expect(
      sortReminders(reminders, 'nextTriggerAsc').map(reminder => reminder.id)
    ).toEqual(['soon', 'late'])
  })

  it('sorts reminders by title alphabetically', () => {
    const reminders = [
      createReminder({ id: 'b', title: 'Beta' }),
      createReminder({ id: 'a', title: 'Alpha' }),
    ]

    expect(
      sortReminders(reminders, 'titleAsc').map(reminder => reminder.id)
    ).toEqual(['a', 'b'])
  })
})
