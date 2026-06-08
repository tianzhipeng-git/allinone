import type { RemCadence, RemFrequencyLevel, RemScheduleConfig } from './types'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export const remFrequencyLevels: RemFrequencyLevel[] = [
  'day',
  'week',
  'month',
  'longTerm',
]

export function getFrequencyLevel(
  nextTriggerAt: Date,
  now = new Date()
): RemFrequencyLevel {
  const intervalMs = nextTriggerAt.getTime() - now.getTime()

  if (intervalMs <= DAY_MS) {
    return 'day'
  }

  if (intervalMs <= 7 * DAY_MS) {
    return 'week'
  }

  if (intervalMs <= 30 * DAY_MS) {
    return 'month'
  }

  return 'longTerm'
}

export function getNextTriggerAt(
  schedule: RemScheduleConfig,
  now = new Date()
): Date {
  if (schedule.mode === 'interval') {
    return new Date(
      now.getTime() + Math.max(schedule.intervalHours, 1) * HOUR_MS
    )
  }

  if (schedule.cadence === 'custom') {
    return now
  }

  const [hour, minute] = parseTime(schedule.time)

  if (schedule.cadence === 'daily') {
    return nextDaily(hour, minute, now)
  }

  if (schedule.cadence === 'weekly') {
    return nextWeekly(schedule.weekdays, hour, minute, now)
  }

  if (schedule.cadence === 'monthly') {
    return nextMonthly(schedule.monthDay, hour, minute, now)
  }

  return nextYearly(schedule.month, schedule.monthDay, hour, minute, now)
}

export function buildCronExpression(schedule: RemScheduleConfig): string {
  if (schedule.mode === 'interval') {
    return `0 */${Math.max(schedule.intervalHours, 1)} * * *`
  }

  if (schedule.cadence === 'custom') {
    return schedule.cronExpression.trim()
  }

  const [hour, minute] = parseTime(schedule.time)

  if (schedule.cadence === 'daily') {
    return `${minute} ${hour} * * *`
  }

  if (schedule.cadence === 'weekly') {
    const days = normalizedWeekdays(schedule.weekdays).join(',')
    return `${minute} ${hour} * * ${days}`
  }

  if (schedule.cadence === 'monthly') {
    return `${minute} ${hour} ${clamp(schedule.monthDay, 1, 31)} * *`
  }

  return `${minute} ${hour} ${clamp(schedule.monthDay, 1, 31)} ${clamp(
    schedule.month,
    1,
    12
  )} *`
}

export function createDefaultSchedule(): RemScheduleConfig {
  return {
    mode: 'cron',
    cadence: 'daily',
    time: '09:00',
    weekdays: [1, 3, 5],
    monthDay: 1,
    month: 1,
    intervalHours: 2,
    cronExpression: '0 9 * * *',
  }
}

function nextDaily(hour: number, minute: number, now: Date): Date {
  const candidate = new Date(now)
  candidate.setHours(hour, minute, 0, 0)

  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1)
  }

  return candidate
}

function nextWeekly(
  weekdays: number[],
  hour: number,
  minute: number,
  now: Date
): Date {
  const days = normalizedWeekdays(weekdays)

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    candidate.setHours(hour, minute, 0, 0)

    if (days.includes(candidate.getDay()) && candidate > now) {
      return candidate
    }
  }

  return nextDaily(hour, minute, now)
}

function nextMonthly(
  monthDay: number,
  hour: number,
  minute: number,
  now: Date
): Date {
  const day = clamp(monthDay, 1, 31)
  const candidate = new Date(now)
  candidate.setHours(hour, minute, 0, 0)
  candidate.setDate(Math.min(day, daysInMonth(candidate)))

  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1, 1)
    candidate.setDate(Math.min(day, daysInMonth(candidate)))
  }

  return candidate
}

function nextYearly(
  month: number,
  monthDay: number,
  hour: number,
  minute: number,
  now: Date
): Date {
  const candidate = new Date(now)
  candidate.setMonth(clamp(month, 1, 12) - 1, 1)
  candidate.setHours(hour, minute, 0, 0)
  candidate.setDate(Math.min(clamp(monthDay, 1, 31), daysInMonth(candidate)))

  if (candidate <= now) {
    candidate.setFullYear(candidate.getFullYear() + 1)
  }

  return candidate
}

function parseTime(time: string): [number, number] {
  const [hour = '9', minute = '0'] = time.split(':')
  return [clamp(Number(hour), 0, 23), clamp(Number(minute), 0, 59)]
}

function normalizedWeekdays(weekdays: number[]): number[] {
  const normalized = weekdays
    .map(day => clamp(day, 0, 6))
    .filter((day, index, days) => days.indexOf(day) === index)
    .sort((left, right) => left - right)

  return normalized.length > 0 ? normalized : [1]
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

export function updateCronExpression(
  schedule: RemScheduleConfig,
  cadence?: RemCadence
): RemScheduleConfig {
  if (cadence === 'custom') {
    return {
      ...schedule,
      cadence: 'custom',
      cronExpression:
        schedule.cronExpression.trim() ||
        buildCronExpression({ ...schedule, cadence: schedule.cadence }),
    }
  }

  const nextSchedule = cadence ? { ...schedule, cadence } : schedule

  if (nextSchedule.cadence === 'custom') {
    return nextSchedule
  }

  return {
    ...nextSchedule,
    cronExpression: buildCronExpression(nextSchedule),
  }
}
