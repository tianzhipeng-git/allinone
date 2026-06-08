import { describe, expect, it } from 'vitest'
import {
  buildCronExpression,
  createDefaultSchedule,
  getFrequencyLevel,
  getNextTriggerAt,
  updateCronExpression,
} from '../schedule'

describe('rem schedule helpers', () => {
  it('classifies reminders by next trigger interval', () => {
    const now = new Date('2026-06-08T09:00:00Z')

    expect(getFrequencyLevel(new Date('2026-06-08T10:00:00Z'), now)).toBe('day')
    expect(getFrequencyLevel(new Date('2026-06-11T09:00:00Z'), now)).toBe(
      'week'
    )
    expect(getFrequencyLevel(new Date('2026-06-30T09:00:00Z'), now)).toBe(
      'month'
    )
    expect(getFrequencyLevel(new Date('2026-08-01T09:00:00Z'), now)).toBe(
      'longTerm'
    )
  })

  it('builds cron expressions for supported cadences', () => {
    const schedule = createDefaultSchedule()

    expect(buildCronExpression(schedule)).toBe('0 9 * * *')
    expect(
      buildCronExpression({
        ...schedule,
        cadence: 'weekly',
        weekdays: [1, 3, 5],
      })
    ).toBe('0 9 * * 1,3,5')
    expect(
      buildCronExpression({ ...schedule, cadence: 'monthly', monthDay: 15 })
    ).toBe('0 9 15 * *')
    expect(
      buildCronExpression({
        ...schedule,
        cadence: 'yearly',
        month: 1,
        monthDay: 1,
      })
    ).toBe('0 9 1 1 *')
  })

  it('finds the next weekly trigger after the current time', () => {
    const schedule = updateCronExpression({
      ...createDefaultSchedule(),
      cadence: 'weekly',
      time: '10:00',
      weekdays: [1, 3, 5],
    })
    const now = new Date('2026-06-08T11:00:00Z')

    expect(getNextTriggerAt(schedule, now).toISOString()).toBe(
      '2026-06-10T02:00:00.000Z'
    )
  })

  it('uses interval hours for interval schedules', () => {
    const schedule = updateCronExpression({
      ...createDefaultSchedule(),
      mode: 'interval',
      intervalHours: 2,
    })
    const now = new Date('2026-06-08T09:00:00Z')

    expect(getNextTriggerAt(schedule, now).toISOString()).toBe(
      '2026-06-08T11:00:00.000Z'
    )
    expect(schedule.cronExpression).toBe('0 */2 * * *')
  })
})
