export type RemFrequencyLevel = 'day' | 'week' | 'month' | 'longTerm'

export type RemScheduleMode = 'cron' | 'interval'

export type RemCadence = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type RemLogStatus = 'pending' | 'confirmed' | 'ignored'

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

export interface RemNotificationChannels {
  system: boolean
  webhookUrl: string
}

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
