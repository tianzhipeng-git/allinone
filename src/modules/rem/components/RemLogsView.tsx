import { Bell, Check, CircleDashed, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { RemLogEntry, RemLogStatus } from '../types'
import { statusKey } from '../format'
import { sortRemLogs } from '../sort'
import {
  LogEntryActionButtons,
  LogEntryNoteEditor,
  useLogEntryNote,
} from './LogEntryControls'
import { LogTimestamps } from './LogTimestamps'

interface RemLogsViewProps {
  logs: RemLogEntry[]
  statusFilter: RemLogStatus | 'all'
  searchQuery: string
  onStatusFilterChange: (status: RemLogStatus | 'all') => void
  onSearchQueryChange: (query: string) => void
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
  onUpdateLogNote: (id: string, note: string) => void
}

const statusIcon = {
  pending: CircleDashed,
  confirmed: Check,
  ignored: X,
} satisfies Record<RemLogStatus, LucideIcon>

const statusClass = {
  pending: 'text-amber-600 bg-amber-500/10',
  confirmed: 'text-emerald-600 bg-emerald-500/10',
  ignored: 'text-muted-foreground bg-muted',
} satisfies Record<RemLogStatus, string>

export function RemLogsView({
  logs,
  statusFilter,
  searchQuery,
  onStatusFilterChange,
  onSearchQueryChange,
  onUpdateLogStatus,
  onUpdateLogNote,
}: RemLogsViewProps) {
  const { t } = useTranslation()
  const filteredLogs = logs
    .filter(log => statusFilter === 'all' || log.status === statusFilter)
    .filter(log => {
      if (searchQuery.trim().length === 0) {
        return true
      }

      return `${log.reminderTitle} ${log.note} ${log.tag}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    })

  const sortedLogs = sortRemLogs(filteredLogs)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 py-4">
      <div className="mb-4 grid shrink-0 gap-3 md:grid-cols-3">
        <StatusSummary
          status="pending"
          count={logs.filter(log => log.status === 'pending').length}
        />
        <StatusSummary
          status="confirmed"
          count={logs.filter(log => log.status === 'confirmed').length}
        />
        <StatusSummary
          status="ignored"
          count={logs.filter(log => log.status === 'ignored').length}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['all', 'pending', 'confirmed', 'ignored'] as const).map(status => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={statusFilter === status ? 'default' : 'secondary'}
            className="h-7 rounded-full px-3 text-xs"
            onClick={() => onStatusFilterChange(status)}
          >
            {status === 'all'
              ? t('modules.rem.filters.all')
              : t(statusKey(status))}
          </Button>
        ))}
        <div className="relative ms-auto w-full min-w-48 sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            value={searchQuery}
            placeholder={t('modules.rem.logs.searchPlaceholder')}
            onChange={event => onSearchQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2 pb-4">
        {sortedLogs.map(log => (
          <LogCard
            key={log.id}
            log={log}
            onUpdateLogStatus={onUpdateLogStatus}
            onUpdateLogNote={onUpdateLogNote}
          />
        ))}
        {sortedLogs.length === 0 && (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            {t('modules.rem.logs.empty')}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusSummary({
  status,
  count,
}: {
  status: RemLogStatus
  count: number
}) {
  const { t } = useTranslation()
  const Icon = statusIcon[status]

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-lg border bg-card px-4">
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-md',
          statusClass[status]
        )}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-xl font-semibold leading-none">{count}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t(statusKey(status))}
        </div>
      </div>
    </div>
  )
}

function LogCard({
  log,
  onUpdateLogStatus,
  onUpdateLogNote,
}: {
  log: RemLogEntry
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
  onUpdateLogNote: (id: string, note: string) => void
}) {
  const { t } = useTranslation()
  const Icon = statusIcon[log.status]
  const { editingNote, note, setNote, resetNote, toggleNote } = useLogEntryNote(log)

  return (
    <div className="grid gap-1.5 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            statusClass[log.status]
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <h3
          className="w-36 shrink-0 truncate text-sm font-semibold sm:w-44"
          title={log.reminderTitle}
        >
          {log.reminderTitle}
        </h3>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge
            variant="secondary"
            className="h-5 shrink-0 px-1.5 text-[11px]"
          >
            {log.tag}
          </Badge>
          <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[11px]">
            {t(statusKey(log.status))}
          </Badge>
          <LogTimestamps log={log} />
          <LogEntryActionButtons
            log={log}
            onUpdateLogStatus={onUpdateLogStatus}
            onToggleNote={toggleNote}
            className="ms-auto flex shrink-0 gap-0.5"
          />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <Bell className="me-1 inline size-3" />
        {log.channels
          .map(channel => t(`modules.rem.channels.${channel}`))
          .join(' · ')}
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
