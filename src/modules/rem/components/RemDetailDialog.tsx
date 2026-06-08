import {
  Bell,
  CalendarClock,
  Clock,
  FilePenLine,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RemLogEntry, RemLogStatus, RemReminder } from '../types'
import { sortRemLogs } from '../sort'
import {
  LogEntryActionButtons,
  LogEntryNoteEditor,
  useLogEntryNote,
} from './LogEntryControls'
import { LogTimestamps } from './LogTimestamps'
import {
  formatDateTime,
  formatFullDateTime,
  frequencyKey,
  statusKey,
} from '../format'

interface RemDetailDialogProps {
  open: boolean
  reminder?: RemReminder
  logs: RemLogEntry[]
  onOpenChange: (open: boolean) => void
  onEditReminder: (reminder: RemReminder) => void
  onDeleteReminder: (id: string) => void
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
  onUpdateLogNote: (id: string, note: string) => void
}

const statusClass = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  ignored: 'bg-muted-foreground',
} satisfies Record<RemLogStatus, string>

export function RemDetailDialog({
  open,
  reminder,
  logs,
  onOpenChange,
  onEditReminder,
  onDeleteReminder,
  onUpdateLogStatus,
  onUpdateLogNote,
}: RemDetailDialogProps) {
  const { t, i18n } = useTranslation()

  if (!reminder) {
    return null
  }

  const reminderLogs = sortRemLogs(
    logs.filter(log => log.reminderId === reminder.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] overflow-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3 pe-8">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#06b6d4,#8b5cf6,#f97316)] text-white">
                <CalendarClock className="size-6" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate">{reminder.title}</DialogTitle>
                <DialogDescription className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="secondary">{reminder.tag}</Badge>
                  <Badge variant={reminder.enabled ? 'default' : 'outline'}>
                    {reminder.enabled
                      ? t('modules.rem.status.active')
                      : t('modules.rem.status.paused')}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                aria-label={t('modules.rem.actions.edit')}
                onClick={() => onEditReminder(reminder)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="destructive"
                aria-label={t('modules.rem.actions.delete')}
                onClick={() => onDeleteReminder(reminder.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoTile
              icon={FilePenLine}
              label={t('modules.rem.detail.description')}
              value={reminder.description}
            />
            <InfoTile
              icon={Clock}
              label={t('modules.rem.detail.nextTrigger')}
              value={formatFullDateTime(reminder.nextTriggerAt, i18n.language)}
            />
            <InfoTile
              icon={Bell}
              label={t('modules.rem.detail.channels')}
              value={channelText(reminder, t)}
            />
          </div>

          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t('modules.rem.detail.schedule')}
              </h3>
              <Badge variant="secondary">
                {t(frequencyKey(reminder.frequency))}
              </Badge>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between gap-3">
                <span>{t('modules.rem.detail.cron')}</span>
                <code className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                  {reminder.schedule.cronExpression}
                </code>
              </div>
              <div className="flex justify-between gap-3">
                <span>{t('modules.rem.detail.naturalTime')}</span>
                <span className="text-foreground">{reminder.scheduleText}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t('modules.rem.detail.logDots')}
              </h3>
              <span className="text-xs text-muted-foreground">
                {t('modules.rem.detail.logCount', {
                  count: reminderLogs.length,
                })}
              </span>
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {reminderLogs.slice(0, 30).map(log => (
                <span
                  key={log.id}
                  title={`${formatFullDateTime(log.triggeredAt, i18n.language)} · ${t(
                    statusKey(log.status)
                  )}`}
                  className={cn('size-3 rounded-full', statusClass[log.status])}
                />
              ))}
            </div>
            <div className="grid gap-2">
              {reminderLogs.map(log => (
                <DetailLogRow
                  key={log.id}
                  log={log}
                  onUpdateLogStatus={onUpdateLogStatus}
                  onUpdateLogNote={onUpdateLogNote}
                />
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="min-h-24 rounded-lg border p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="line-clamp-3 text-sm">{value}</div>
    </div>
  )
}

function DetailLogRow({
  log,
  onUpdateLogStatus,
  onUpdateLogNote,
}: {
  log: RemLogEntry
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
  onUpdateLogNote: (id: string, note: string) => void
}) {
  const { t } = useTranslation()
  const { editingNote, note, setNote, resetNote, toggleNote } = useLogEntryNote(log)

  return (
    <div className="grid gap-1.5 rounded-md border bg-muted/20 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('size-2 rounded-full', statusClass[log.status])} />
        <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
          {t(statusKey(log.status))}
        </Badge>
        <LogTimestamps log={log} />
        <LogEntryActionButtons
          log={log}
          onUpdateLogStatus={onUpdateLogStatus}
          onToggleNote={toggleNote}
          className="ms-auto flex gap-0.5"
        />
      </div>
      <LogEntryNoteEditor
        log={log}
        editingNote={editingNote}
        note={note}
        onNoteChange={setNote}
        onCancel={resetNote}
        onSave={() => {
          onUpdateLogNote(log.id, note.trim())
          toggleNote()
        }}
      />
    </div>
  )
}

function channelText(reminder: RemReminder, t: TFunction) {
  const channels = []

  if (reminder.notifications.system) {
    channels.push(t('modules.rem.channels.system'))
  }

  if (reminder.notifications.webhookUrl) {
    channels.push(t('modules.rem.channels.webhook'))
  }

  return channels.length > 0
    ? channels.join(' · ')
    : t('modules.rem.channels.none')
}
