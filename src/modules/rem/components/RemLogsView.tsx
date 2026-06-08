import { Bell, Check, CircleDashed, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { RemLogEntry, RemLogStatus } from '../types'
import { formatDateTime, statusKey } from '../format'

interface RemLogsViewProps {
  logs: RemLogEntry[]
  statusFilter: RemLogStatus | 'all'
  searchQuery: string
  onStatusFilterChange: (status: RemLogStatus | 'all') => void
  onSearchQueryChange: (query: string) => void
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
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
    .sort((left, right) => right.triggeredAt.localeCompare(left.triggeredAt))

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
        {filteredLogs.map(log => (
          <LogCard
            key={log.id}
            log={log}
            onUpdateLogStatus={onUpdateLogStatus}
          />
        ))}
        {filteredLogs.length === 0 && (
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
}: {
  log: RemLogEntry
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
}) {
  const { t, i18n } = useTranslation()
  const Icon = statusIcon[log.status]

  return (
    <div className="grid gap-2 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-md',
              statusClass[log.status]
            )}
          >
            <Icon className="size-4" />
          </span>
          <h3 className="truncate text-sm font-semibold">
            {log.reminderTitle}
          </h3>
          <Badge variant="secondary">{log.tag}</Badge>
          <Badge variant="outline">{t(statusKey(log.status))}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{formatDateTime(log.triggeredAt, i18n.language)}</span>
          <span>·</span>
          <span>
            <Bell className="me-1 inline size-3" />
            {log.channels
              .map(channel => t(`modules.rem.channels.${channel}`))
              .join(' · ')}
          </span>
        </div>
        {log.note && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {log.note}
          </p>
        )}
      </div>
      {log.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateLogStatus(log.id, 'ignored')}
          >
            <X className="size-4" />
            {t('modules.rem.actions.ignore')}
          </Button>
          <Button
            size="sm"
            onClick={() => onUpdateLogStatus(log.id, 'confirmed')}
          >
            <Check className="size-4" />
            {t('modules.rem.actions.confirm')}
          </Button>
        </div>
      )}
    </div>
  )
}
