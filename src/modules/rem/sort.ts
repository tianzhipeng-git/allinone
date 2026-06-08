import type { RemLogEntry, RemReminder, RemReminderSort } from './types'

export function getLogActivityAt(log: RemLogEntry): string {
  return log.completedAt ?? log.triggeredAt
}

export function compareRemLogsDesc(
  left: RemLogEntry,
  right: RemLogEntry
): number {
  const byActivity = getLogActivityAt(right).localeCompare(
    getLogActivityAt(left)
  )

  if (byActivity !== 0) {
    return byActivity
  }

  const byTriggered = right.triggeredAt.localeCompare(left.triggeredAt)

  if (byTriggered !== 0) {
    return byTriggered
  }

  return right.id.localeCompare(left.id)
}

export function sortRemLogs(logs: RemLogEntry[]): RemLogEntry[] {
  return [...logs].sort(compareRemLogsDesc)
}

function compareTitles(left: RemReminder, right: RemReminder): number {
  return left.title.localeCompare(right.title, undefined, {
    sensitivity: 'base',
  })
}

export function sortReminders(
  reminders: RemReminder[],
  sort: RemReminderSort
): RemReminder[] {
  const sorted = [...reminders]

  switch (sort) {
    case 'nextTriggerAsc':
      return sorted.sort(
        (left, right) =>
          left.nextTriggerAt.localeCompare(right.nextTriggerAt) ||
          compareTitles(left, right)
      )
    case 'nextTriggerDesc':
      return sorted.sort(
        (left, right) =>
          right.nextTriggerAt.localeCompare(left.nextTriggerAt) ||
          compareTitles(left, right)
      )
    case 'titleAsc':
      return sorted.sort(
        (left, right) =>
          compareTitles(left, right) ||
          left.nextTriggerAt.localeCompare(right.nextTriggerAt)
      )
    case 'titleDesc':
      return sorted.sort(
        (left, right) =>
          compareTitles(right, left) ||
          left.nextTriggerAt.localeCompare(right.nextTriggerAt)
      )
    case 'updatedDesc':
      return sorted.sort(
        (left, right) =>
          right.updatedAt.localeCompare(left.updatedAt) ||
          left.nextTriggerAt.localeCompare(right.nextTriggerAt)
      )
    case 'createdDesc':
      return sorted.sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          left.nextTriggerAt.localeCompare(right.nextTriggerAt)
      )
  }
}
