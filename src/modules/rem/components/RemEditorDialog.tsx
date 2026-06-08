import { useState } from 'react'
import type React from 'react'
import { Bell, Clock, Info, Link } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatSchedulePreview } from '../format'
import {
  buildCronExpression,
  createDefaultSchedule,
  updateCronExpression,
} from '../schedule'
import type { RemReminder, RemReminderDraft, RemScheduleMode } from '../types'

interface RemEditorDialogProps {
  open: boolean
  reminder?: RemReminder
  tags: string[]
  onOpenChange: (open: boolean) => void
  onSave: (draft: RemReminderDraft) => void
}

const weekdays = [0, 1, 2, 3, 4, 5, 6]

export function RemEditorDialog({
  open,
  reminder,
  tags,
  onOpenChange,
  onSave,
}: RemEditorDialogProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(() =>
    reminderToDraft(reminder, t('modules.rem.tags.life'))
  )

  if (!open) {
    return null
  }

  const schedulePreview = formatSchedulePreview(draft.schedule, t)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {reminder
              ? t('modules.rem.editor.editTitle')
              : t('modules.rem.editor.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('modules.rem.editor.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <EditorSection icon={Info} title={t('modules.rem.editor.basic')}>
            <div className="grid gap-3">
              <Field label={t('modules.rem.fields.title')}>
                <Input
                  value={draft.title}
                  placeholder={t('modules.rem.placeholders.title')}
                  onChange={event =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
              </Field>
              <Field label={t('modules.rem.fields.description')}>
                <Textarea
                  value={draft.description}
                  placeholder={t('modules.rem.placeholders.description')}
                  onChange={event =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </Field>
              <div className="grid gap-2">
                <Label>{t('modules.rem.fields.tag')}</Label>
                <div className="flex flex-wrap gap-2">
                  {uniqueTags(tags, draft.tag).map(tag => (
                    <Button
                      key={tag}
                      type="button"
                      size="sm"
                      variant={draft.tag === tag ? 'default' : 'secondary'}
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() => setDraft({ ...draft, tag })}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                <Input
                  value={draft.tag}
                  placeholder={t('modules.rem.placeholders.customTag')}
                  onChange={event =>
                    setDraft({ ...draft, tag: event.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="rem-enabled">
                  {t('modules.rem.fields.enabled')}
                </Label>
                <Switch
                  id="rem-enabled"
                  checked={draft.enabled}
                  onCheckedChange={enabled => setDraft({ ...draft, enabled })}
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection icon={Clock} title={t('modules.rem.editor.schedule')}>
            <div className="grid gap-3">
              <div className="flex rounded-md border bg-muted/40 p-1">
                {(['cron', 'interval'] satisfies RemScheduleMode[]).map(
                  mode => (
                    <Button
                      key={mode}
                      type="button"
                      variant={
                        draft.schedule.mode === mode ? 'default' : 'ghost'
                      }
                      className="h-8 flex-1"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          schedule: updateCronExpression({
                            ...draft.schedule,
                            mode,
                          }),
                        })
                      }
                    >
                      {t(`modules.rem.scheduleMode.${mode}`)}
                    </Button>
                  )
                )}
              </div>

              {draft.schedule.mode === 'cron' ? (
                <CronFields draft={draft} setDraft={setDraft} />
              ) : (
                <Field label={t('modules.rem.fields.intervalHours')}>
                  <Input
                    type="number"
                    min={1}
                    value={draft.schedule.intervalHours}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        schedule: updateCronExpression({
                          ...draft.schedule,
                          intervalHours: Number(event.target.value),
                        }),
                      })
                    }
                  />
                </Field>
              )}

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {draft.schedule.mode === 'cron' &&
                draft.schedule.cadence !== 'custom' ? (
                  <>
                    <span className="font-medium text-foreground">
                      {buildCronExpression(draft.schedule)}
                    </span>
                    <span className="mx-2">→</span>
                    {schedulePreview}
                  </>
                ) : (
                  <span className="font-medium text-foreground">
                    {schedulePreview}
                  </span>
                )}
              </div>
            </div>
          </EditorSection>

          <EditorSection icon={Bell} title={t('modules.rem.editor.channels')}>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="rem-system-channel">
                  {t('modules.rem.fields.systemNotification')}
                </Label>
                <Switch
                  id="rem-system-channel"
                  checked={draft.notifications.system}
                  onCheckedChange={system =>
                    setDraft({
                      ...draft,
                      notifications: { ...draft.notifications, system },
                    })
                  }
                />
              </div>
              <Field label={t('modules.rem.fields.webhook')}>
                <div className="relative">
                  <Link className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    value={draft.notifications.webhookUrl}
                    placeholder={t('modules.rem.placeholders.webhook')}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        notifications: {
                          ...draft.notifications,
                          webhookUrl: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </Field>
            </div>
          </EditorSection>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={
              !draft.title.trim() ||
              !draft.tag.trim() ||
              (draft.schedule.mode === 'cron' &&
                draft.schedule.cadence === 'custom' &&
                !draft.schedule.cronExpression.trim())
            }
            onClick={() => onSave(normalizeDraft(draft))}
          >
            {reminder
              ? t('modules.rem.actions.save')
              : t('modules.rem.actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CronFields({
  draft,
  setDraft,
}: {
  draft: RemReminderDraft
  setDraft: (draft: RemReminderDraft) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-5">
        {(
          ['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const
        ).map(cadence => (
          <Button
            key={cadence}
            type="button"
            variant={
              draft.schedule.cadence === cadence ? 'default' : 'secondary'
            }
            onClick={() =>
              setDraft({
                ...draft,
                schedule: updateCronExpression(draft.schedule, cadence),
              })
            }
          >
            {t(`modules.rem.cadence.${cadence}`)}
          </Button>
        ))}
      </div>
      {draft.schedule.cadence === 'custom' ? (
        <Field label={t('modules.rem.fields.cronExpression')}>
          <Input
            value={draft.schedule.cronExpression}
            placeholder={t('modules.rem.placeholders.cronExpression')}
            className="font-mono"
            onChange={event =>
              setDraft({
                ...draft,
                schedule: {
                  ...draft.schedule,
                  cronExpression: event.target.value,
                },
              })
            }
          />
        </Field>
      ) : (
        <>
      <Field label={t('modules.rem.fields.time')}>
        <Input
          type="time"
          value={draft.schedule.time}
          onChange={event =>
            setDraft({
              ...draft,
              schedule: updateCronExpression({
                ...draft.schedule,
                time: event.target.value,
              }),
            })
          }
        />
      </Field>
      {draft.schedule.cadence === 'weekly' && (
        <div className="grid gap-2">
          <Label>{t('modules.rem.fields.weekdays')}</Label>
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map(day => {
              const selected = draft.schedule.weekdays.includes(day)
              return (
                <Button
                  key={day}
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'secondary'}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      schedule: updateCronExpression({
                        ...draft.schedule,
                        weekdays: toggleWeekday(draft.schedule.weekdays, day),
                      }),
                    })
                  }
                >
                  {t(`modules.rem.weekday.${day}`)}
                </Button>
              )
            })}
          </div>
        </div>
      )}
      {['monthly', 'yearly'].includes(draft.schedule.cadence) && (
        <Field label={t('modules.rem.fields.monthDay')}>
          <Input
            type="number"
            min={1}
            max={31}
            value={draft.schedule.monthDay}
            onChange={event =>
              setDraft({
                ...draft,
                schedule: updateCronExpression({
                  ...draft.schedule,
                  monthDay: Number(event.target.value),
                }),
              })
            }
          />
        </Field>
      )}
      {draft.schedule.cadence === 'yearly' && (
        <Field label={t('modules.rem.fields.month')}>
          <Input
            type="number"
            min={1}
            max={12}
            value={draft.schedule.month}
            onChange={event =>
              setDraft({
                ...draft,
                schedule: updateCronExpression({
                  ...draft.schedule,
                  month: Number(event.target.value),
                }),
              })
            }
          />
        </Field>
      )}
        </>
      )}
    </div>
  )
}

function EditorSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function reminderToDraft(
  reminder: RemReminder | undefined,
  fallbackTag: string
): RemReminderDraft {
  if (reminder) {
    const schedule = resolveScheduleForEdit(reminder.schedule)

    return {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      tag: reminder.tag,
      enabled: reminder.enabled,
      schedule,
      notifications: reminder.notifications,
    }
  }

  return {
    title: '',
    description: '',
    tag: fallbackTag,
    enabled: true,
    schedule: createDefaultSchedule(),
    notifications: {
      system: true,
      webhookUrl: '',
    },
  }
}

function resolveScheduleForEdit(
  schedule: RemReminderDraft['schedule']
): RemReminderDraft['schedule'] {
  if (schedule.mode !== 'cron' || schedule.cadence === 'custom') {
    return schedule
  }

  const builtExpression = buildCronExpression(schedule)
  if (schedule.cronExpression.trim() === builtExpression) {
    return schedule
  }

  return {
    ...schedule,
    cadence: 'custom',
  }
}

function normalizeDraft(draft: RemReminderDraft): RemReminderDraft {
  const schedule =
    draft.schedule.cadence === 'custom'
      ? {
          ...draft.schedule,
          cronExpression: draft.schedule.cronExpression.trim(),
        }
      : updateCronExpression(draft.schedule)

  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    tag: draft.tag.trim(),
    schedule,
    notifications: {
      ...draft.notifications,
      webhookUrl: draft.notifications.webhookUrl.trim(),
    },
  }
}

function uniqueTags(tags: string[], activeTag: string): string[] {
  return Array.from(new Set([activeTag, ...tags].filter(Boolean)))
}

function toggleWeekday(weekdaysValue: number[], day: number): number[] {
  if (weekdaysValue.includes(day)) {
    const nextValue = weekdaysValue.filter(value => value !== day)
    return nextValue.length > 0 ? nextValue : weekdaysValue
  }

  return [...weekdaysValue, day].sort((left, right) => left - right)
}

