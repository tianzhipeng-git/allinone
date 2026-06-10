export type RemFrequencyLevel = 'day' | 'week' | 'month' | 'longTerm'

export type RemScheduleMode = 'cron' | 'interval'

export type RemIntervalUnit = 'hours' | 'days'

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
  intervalDays: number
  intervalUnit: RemIntervalUnit
  cronExpression: string
}

export interface RemWebhookHeader {
  name: string
  value: string
}

export interface RemNotificationChannels {
  system: boolean
  webhook: boolean
  webhookUrl: string
  webhookBodyTemplate: string
  webhookHeaders: RemWebhookHeader[]
}

export const defaultWebhookUrl =
  'https://open.feishu.cn/open-apis/bot/v2/hook/09896914-03b1-452c-a745-3bd31aee4c96'

export const defaultWebhookBodyTemplate = `{
  "msg_type": "text",
  "content": {
    "text": "REM提醒 {{title}} {{triggeredAt}}"
  }
}`

export const defaultNotificationChannels = (): RemNotificationChannels => ({
  system: true,
  webhook: false,
  webhookUrl: '',
  webhookBodyTemplate: '',
  webhookHeaders: [],
})

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
