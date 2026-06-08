import {
  BellOff,
  Calendar,
  CalendarClock,
  Clock,
  ExternalLink,
  Infinity as InfinityIcon,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  SunMedium,
  Tag,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { remFrequencyLevels } from '../schedule'
import { sortReminders } from '../sort'
import type {
  RemEnabledFilter,
  RemFrequencyLevel,
  RemReminder,
  RemReminderSort,
} from '../types'
import { remEnabledFilterOptions, remReminderSortOptions } from '../types'
import { frequencyKey, formatDateTime } from '../format'

interface RemReminderBoardProps {
  reminders: RemReminder[]
  selectedTag: string
  enabledFilter: RemEnabledFilter
  reminderSort: RemReminderSort
  searchQuery: string
  onSelectedTagChange: (tag: string) => void
  onEnabledFilterChange: (filter: RemEnabledFilter) => void
  onReminderSortChange: (sort: RemReminderSort) => void
  onSearchQueryChange: (query: string) => void
  onCreateReminder: () => void
  onEditReminder: (reminder: RemReminder) => void
  onOpenReminder: (reminder: RemReminder) => void
  onToggleReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}

const frequencyIcons = {
  day: SunMedium,
  week: CalendarClock,
  month: Calendar,
  longTerm: InfinityIcon,
} satisfies Record<RemFrequencyLevel, LucideIcon>

const frequencyColor = {
  day: 'text-sky-500 bg-sky-500/10',
  week: 'text-violet-500 bg-violet-500/10',
  month: 'text-rose-500 bg-rose-500/10',
  longTerm: 'text-amber-500 bg-amber-500/10',
} satisfies Record<RemFrequencyLevel, string>

const coverflowThreshold = 4
const coverflowCardStep = 252
const flatCoverflowWindow = 4

export function RemReminderBoard({
  reminders,
  selectedTag,
  enabledFilter,
  reminderSort,
  searchQuery,
  onSelectedTagChange,
  onEnabledFilterChange,
  onReminderSortChange,
  onSearchQueryChange,
  onCreateReminder,
  onEditReminder,
  onOpenReminder,
  onToggleReminder,
  onDeleteReminder,
}: RemReminderBoardProps) {
  const { t } = useTranslation()
  const tags = Array.from(new Set(reminders.map(reminder => reminder.tag)))
  const filteredReminders = reminders.filter(reminder => {
    const matchesTag = selectedTag === 'all' || reminder.tag === selectedTag
    const matchesEnabled =
      enabledFilter === 'all' || reminder.enabled
    const matchesSearch =
      searchQuery.trim().length === 0 ||
      `${reminder.title} ${reminder.description} ${reminder.tag}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())

    return matchesTag && matchesEnabled && matchesSearch
  })
  const sortedReminders = sortReminders(filteredReminders, reminderSort)

  if (reminders.length === 0) {
    return <RemEmptyState onCreateReminder={onCreateReminder} />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 py-4">
      <div className="mb-5 flex shrink-0 flex-wrap items-center gap-2">
        <Select
          value={reminderSort}
          onValueChange={value => onReminderSortChange(value as RemReminderSort)}
        >
          <SelectTrigger className="h-7 w-auto min-w-40 gap-1 rounded-full px-3 text-xs">
            <SelectValue placeholder={t('modules.rem.sort.label')} />
          </SelectTrigger>
          <SelectContent align="start">
            {remReminderSortOptions.map(option => (
              <SelectItem key={option} value={option}>
                {t(`modules.rem.sort.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <TagChip
          label={t('modules.rem.tags.all')}
          active={selectedTag === 'all'}
          onClick={() => onSelectedTagChange('all')}
        />
        {tags.map(tag => (
          <TagChip
            key={tag}
            label={tag}
            active={selectedTag === tag}
            onClick={() => onSelectedTagChange(tag)}
          />
        ))}
        <div className="ms-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select
            value={enabledFilter}
            onValueChange={value =>
              onEnabledFilterChange(value as RemEnabledFilter)
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-28 gap-1 rounded-full px-3 text-xs">
              <SelectValue placeholder={t('modules.rem.enabledFilter.label')} />
            </SelectTrigger>
            <SelectContent align="end">
              {remEnabledFilterOptions.map(option => (
                <SelectItem key={option} value={option}>
                  {t(`modules.rem.enabledFilter.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative min-w-48 flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              value={searchQuery}
              placeholder={t('modules.rem.search.placeholder')}
              onChange={event => onSearchQueryChange(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-4">
        {remFrequencyLevels.map(level => (
          <FrequencySection
            key={level}
            level={level}
            reminders={sortedReminders.filter(
              reminder => reminder.frequency === level
            )}
            onEditReminder={onEditReminder}
            onOpenReminder={onOpenReminder}
            onToggleReminder={onToggleReminder}
            onDeleteReminder={onDeleteReminder}
          />
        ))}
      </div>
    </div>
  )
}

function RemEmptyState({ onCreateReminder }: { onCreateReminder: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),#22c55e,#f59e0b)] text-primary-foreground shadow-lg">
        <BellOff className="size-9" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {t('modules.rem.empty.title')}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t('modules.rem.empty.description')}
        </p>
      </div>
      <Button onClick={onCreateReminder}>
        <Plus className="size-4" />
        {t('modules.rem.actions.create')}
      </Button>
    </div>
  )
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'secondary'}
      className="h-7 rounded-full px-3 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function FrequencySection({
  level,
  reminders,
  onEditReminder,
  onOpenReminder,
  onToggleReminder,
  onDeleteReminder,
}: {
  level: RemFrequencyLevel
  reminders: RemReminder[]
  onEditReminder: (reminder: RemReminder) => void
  onOpenReminder: (reminder: RemReminder) => void
  onToggleReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}) {
  const { t } = useTranslation()
  const Icon = frequencyIcons[level]

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-md',
            frequencyColor[level]
          )}
        >
          <Icon className="size-4" />
        </span>
        <h2 className="text-base font-semibold">{t(frequencyKey(level))}</h2>
        <Badge variant="secondary">{reminders.length}</Badge>
      </div>
      {reminders.length > 0 ? (
        reminders.length > coverflowThreshold ? (
          <CoverflowCarousel
            reminders={reminders}
            onEditReminder={onEditReminder}
            onOpenReminder={onOpenReminder}
            onToggleReminder={onToggleReminder}
            onDeleteReminder={onDeleteReminder}
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {reminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEditReminder={onEditReminder}
                onOpenReminder={onOpenReminder}
                onToggleReminder={onToggleReminder}
                onDeleteReminder={onDeleteReminder}
              />
            ))}
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
          {t('modules.rem.empty.section')}
        </div>
      )}
    </section>
  )
}

function CoverflowCarousel({
  reminders,
  onEditReminder,
  onOpenReminder,
  onToggleReminder,
  onDeleteReminder,
}: {
  reminders: RemReminder[]
  onEditReminder: (reminder: RemReminder) => void
  onOpenReminder: (reminder: RemReminder) => void
  onToggleReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}) {
  const initialIndex = getInitialCoverflowIndex(reminders.length)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  useEffect(() => {
    const scroller = scrollerRef.current

    if (scroller) {
      scroller.scrollLeft = initialIndex * coverflowCardStep
    }
  }, [initialIndex])

  return (
    <div className="relative -mx-5 overflow-hidden px-5">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-5 pt-2 [perspective:900px]"
        onScroll={event => {
          const center =
            event.currentTarget.scrollLeft + event.currentTarget.clientWidth / 2
          const nextIndex = Math.round(
            (center - event.currentTarget.clientWidth / 2) / coverflowCardStep
          )
          setActiveIndex(Math.min(Math.max(nextIndex, 0), reminders.length - 1))
        }}
      >
        <div className="shrink-0 basis-[calc(50%-7.5rem)]" />
        {reminders.map((reminder, index) => (
          <CoverflowItem
            key={reminder.id}
            distance={index - activeIndex}
            reminder={reminder}
            onEditReminder={onEditReminder}
            onOpenReminder={onOpenReminder}
            onToggleReminder={onToggleReminder}
            onDeleteReminder={onDeleteReminder}
          />
        ))}
        <div className="shrink-0 basis-[calc(50%-7.5rem)]" />
      </div>
    </div>
  )
}

function getInitialCoverflowIndex(reminderCount: number): number {
  return Math.min(2, Math.max(reminderCount - 1, 0))
}

function CoverflowItem({
  distance,
  reminder,
  onEditReminder,
  onOpenReminder,
  onToggleReminder,
  onDeleteReminder,
}: {
  distance: number
  reminder: RemReminder
  onEditReminder: (reminder: RemReminder) => void
  onOpenReminder: (reminder: RemReminder) => void
  onToggleReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}) {
  const clampedDistance = Math.max(Math.min(distance, 3), -3)
  const absDistance = Math.abs(clampedDistance)
  const flatSideCount = flatCoverflowWindow / 2
  const isFlat = distance >= -flatSideCount && distance < flatSideCount
  const foldDirection = clampedDistance < 0 ? 1 : -1
  const foldDepth = isFlat ? 0 : Math.max(absDistance - flatSideCount + 1, 1)

  return (
    <div
      className="w-60 shrink-0 snap-center transition-[opacity,transform] duration-300 ease-out"
      style={{
        opacity: isFlat ? 1 : 1 - foldDepth * 0.16,
        transform: `rotateY(${isFlat ? 0 : foldDirection * 58}deg) translateZ(${
          isFlat ? 0 : -foldDepth * 44
        }px) scale(${isFlat ? 1 : 1 - foldDepth * 0.07})`,
        transformStyle: 'preserve-3d',
      }}
    >
      <ReminderCard
        reminder={reminder}
        onEditReminder={onEditReminder}
        onOpenReminder={onOpenReminder}
        onToggleReminder={onToggleReminder}
        onDeleteReminder={onDeleteReminder}
      />
    </div>
  )
}

function ReminderCard({
  reminder,
  onEditReminder,
  onOpenReminder,
  onToggleReminder,
  onDeleteReminder,
}: {
  reminder: RemReminder
  onEditReminder: (reminder: RemReminder) => void
  onOpenReminder: (reminder: RemReminder) => void
  onToggleReminder: (id: string) => void
  onDeleteReminder: (id: string) => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex h-44 w-60 shrink-0 flex-col rounded-lg border bg-card p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      onClick={() => onOpenReminder(reminder)}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          onOpenReminder(reminder)
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={cn(
              'size-2 rounded-full',
              reminder.enabled ? 'bg-emerald-500' : 'bg-rose-500'
            )}
          />
          {reminder.enabled
            ? t('modules.rem.status.active')
            : t('modules.rem.status.paused')}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={
              reminder.enabled
                ? t('modules.rem.actions.pause')
                : t('modules.rem.actions.resume')
            }
            onClick={event => {
              event.stopPropagation()
              onToggleReminder(reminder.id)
            }}
          >
            {reminder.enabled ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t('modules.rem.actions.more')}
                onClick={event => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenReminder(reminder)}>
                {t('modules.rem.actions.viewDetail')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditReminder(reminder)}>
                {t('modules.rem.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleReminder(reminder.id)}>
                {reminder.enabled
                  ? t('modules.rem.actions.pause')
                  : t('modules.rem.actions.resume')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteReminder(reminder.id)}
              >
                {t('modules.rem.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold">{reminder.title}</h3>
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {reminder.description}
        </p>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          <Clock className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{reminder.scheduleText}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <Tag className="size-3.5 shrink-0" />
            <span className="truncate">{reminder.tag}</span>
          </span>
          <span className="flex items-center gap-1">
            {reminder.notifications.webhookUrl && (
              <ExternalLink className="size-3.5" />
            )}
            <span>{formatDateTime(reminder.nextTriggerAt, i18n.language)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
