import type { TFunction } from 'i18next'
import type { RemFrequencyLevel, RemLogStatus } from './types'

export function formatDateTime(value: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatFullDateTime(value: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatRelativeTime(value: string, t: TFunction): string {
  const diffMs = new Date(value).getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const minutes = Math.max(1, Math.round(absMs / 60000))
  const hours = Math.round(absMs / 3600000)
  const days = Math.round(absMs / 86400000)

  const count = days >= 1 ? days : hours >= 1 ? hours : minutes
  const unit = days >= 1 ? 'days' : hours >= 1 ? 'hours' : 'minutes'
  const key =
    diffMs >= 0
      ? `modules.rem.relative.in.${unit}`
      : `modules.rem.relative.ago.${unit}`

  return t(key, { count })
}

export function statusKey(status: RemLogStatus): string {
  return `modules.rem.status.${status}`
}

export function frequencyKey(level: RemFrequencyLevel): string {
  return `modules.rem.frequency.${level}`
}
