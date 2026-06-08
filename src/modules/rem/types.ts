export type RemFrequencyLevel = 'day' | 'week' | 'month' | 'longTerm'

export type RemScheduleMode = 'cron' | 'interval'

export type RemCadence = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type RemLogStatus = 'pending' | 'confirmed' | 'ignored'

export type RemEnabledFilter = 'all' | 'active'

export const defaultRemEnabledFilter: RemEnabledFilter = 'active'

export const remEnabledFilterOptions: RemEnabledFilter[] = ['all', 'active']

export type RemReminderSort =
  | 'nextTriggerAsc'
  | 'nextTriggerDesc'
  | 'titleAsc'
  | 'titleDesc'
  | 'updatedDesc'
  | 'createdDesc'

export const defaultRemReminderSort: RemReminderSort = 'nextTriggerAsc'

export const remReminderSortOptions: RemReminderSort[] = [
  'nextTriggerAsc',
  'nextTriggerDesc',
  'titleAsc',
  'titleDesc',
  'updatedDesc',
  'createdDesc',
]

export interface RemScheduleConfig {
  mode: RemScheduleMode
  cadence: RemCadence
  time: string
  weekdays: number[]
  monthDay: number
  month: number
  intervalHours: number
  cronExpression: string
}

export interface RemWebhookHeader {
  name: string
  value: string
}

export interface RemNotificationChannels {
  system: boolean
  webhookUrl: string
  webhookBodyTemplate: string
  webhookHeaders: RemWebhookHeader[]
}

export const defaultWebhookBodyTemplate = `{
  "module": "rem",
  "reminderId": "{{reminderId}}",
  "title": "{{title}}",
  "description": "{{description}}",
  "tag": "{{tag}}",
  "triggeredAt": "{{triggeredAt}}",
  "nextTriggerAt": "{{nextTriggerAt}}"
}`

export const webhookTemplateVariables = [
  'module',
  'reminderId',
  'title',
  'description',
  'tag',
  'triggeredAt',
  'nextTriggerAt',
] as const

export interface RemReminder {
  id: string
  title: string
  description: string
  tag: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  nextTriggerAt: string
  schedule: RemScheduleConfig
  scheduleText: string
  frequency: RemFrequencyLevel
  notifications: RemNotificationChannels
}

export interface RemLogEntry {
  id: string
  reminderId: string
  reminderTitle: string
  tag: string
  triggeredAt: string
  status: RemLogStatus
  note: string
  completedAt?: string
  channels: string[]
}

export interface RemReminderDraft {
  id?: string
  title: string
  description: string
  tag: string
  enabled: boolean
  schedule: RemScheduleConfig
  notifications: RemNotificationChannels
}
