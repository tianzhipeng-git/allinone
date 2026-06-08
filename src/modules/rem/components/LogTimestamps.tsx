import { CircleCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RemLogEntry } from '../types'
import { formatDateTime } from '../format'

interface LogTimestampsProps {
  log: RemLogEntry
  className?: string
}

export function LogTimestamps({ log, className }: LogTimestampsProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className={cn('flex items-center gap-2.5 text-xs text-muted-foreground', className)}>
      <span
        className="inline-flex items-center gap-1"
        title={t('modules.rem.logs.triggeredAt')}
      >
        <Zap className="size-3 shrink-0 text-amber-500" />
        {formatDateTime(log.triggeredAt, i18n.language)}
      </span>
      <span
        className="inline-flex items-center gap-1"
        title={t('modules.rem.logs.completedAt')}
      >
        <CircleCheck className="size-3 shrink-0 text-emerald-500" />
        {log.completedAt
          ? formatDateTime(log.completedAt, i18n.language)
          : t('modules.rem.logs.notCompleted')}
      </span>
    </div>
  )
}
