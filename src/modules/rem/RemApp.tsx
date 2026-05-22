import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Bell,
  Calendar,
  CalendarClock,
  Infinity as InfinityIcon,
  Link,
  Play,
  Search,
  Sun,
  Tag,
  Pause,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Frequency = 'day' | 'week' | 'month' | 'year'

interface ReminderItem {
  id: string
  title: string
  description: string
  active: boolean
  tag: string
  natural: string
  frequency: Frequency
  webhook: boolean
}

const sampleReminders: ReminderItem[] = [
  {
    id: 'r1',
    title: '喝水提醒',
    description: '每小时补充水分，防止脱水',
    active: true,
    tag: '健康',
    natural: '每小时一次',
    frequency: 'day',
    webhook: false,
  },
  {
    id: 'r2',
    title: '站立拉伸',
    description: '每周一三五 09:00 做肩颈拉伸',
    active: true,
    tag: '健康',
    natural: '周一/三/五 09:00',
    frequency: 'week',
    webhook: true,
  },
  {
    id: 'r3',
    title: '信用卡对账',
    description: '每月 10 日检查账单并归档',
    active: false,
    tag: '生活',
    natural: '每月 10 日 20:00',
    frequency: 'month',
    webhook: true,
  },
  {
    id: 'r4',
    title: '年度体检预约',
    description: '每年 1 月安排年度体检',
    active: true,
    tag: '健康',
    natural: '每年 1 月 5 日 10:00',
    frequency: 'year',
    webhook: false,
  },
]

export function RemApp() {
  const { t } = useTranslation()
  const [activeTag, setActiveTag] = useState('全部')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState(sampleReminders)

  const tags = useMemo(() => {
    return ['全部', ...new Set(items.map(item => item.tag))]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const byTag = activeTag === '全部' || item.tag === activeTag
      const byQuery =
        query.length === 0 ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      return byTag && byQuery
    })
  }, [items, activeTag, query])

  const grouped = useMemo(() => {
    return {
      day: filteredItems.filter(item => item.frequency === 'day'),
      week: filteredItems.filter(item => item.frequency === 'week'),
      month: filteredItems.filter(item => item.frequency === 'month'),
      year: filteredItems.filter(item => item.frequency === 'year'),
    }
  }, [filteredItems])

  const toggleActive = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('modules.rem.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('modules.rem.subtitle')}
          </p>
        </div>
        <Button>{t('modules.rem.create')}</Button>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('modules.rem.searchPlaceholder')}
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {tags.map(tag => (
              <Button
                key={tag}
                type="button"
                variant={activeTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
        <FrequencySection
          title={t('modules.rem.sections.day')}
          icon={Sun}
          items={grouped.day}
          onToggle={toggleActive}
        />
        <FrequencySection
          title={t('modules.rem.sections.week')}
          icon={CalendarClock}
          items={grouped.week}
          onToggle={toggleActive}
        />
        <FrequencySection
          title={t('modules.rem.sections.month')}
          icon={Calendar}
          items={grouped.month}
          onToggle={toggleActive}
        />
        <FrequencySection
          title={t('modules.rem.sections.year')}
          icon={InfinityIcon}
          items={grouped.year}
          onToggle={toggleActive}
        />
      </div>
    </div>
  )
}

function FrequencySection({
  title,
  icon: Icon,
  items,
  onToggle,
}: {
  title: string
  icon: typeof Sun
  items: ReminderItem[]
  onToggle: (id: string) => void
}) {
  return (
    <Card className="min-h-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0">
        <ScrollArea className="h-[240px] pr-3">
          <div className="space-y-3">
            {items.map(item => (
              <Card key={item.id} className="border-muted">
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'inline-block size-2 rounded-full',
                          item.active ? 'bg-emerald-500' : 'bg-rose-500'
                        )}
                      />
                      {item.active ? '活跃' : '暂停'}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => onToggle(item.id)}
                    >
                      {item.active ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </Button>
                  </div>

                  <div>
                    <div className="line-clamp-2 text-sm font-medium">
                      {item.title}
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Bell className="size-3.5" />
                      {item.natural}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="size-3.5" />
                        {item.tag}
                      </span>
                      {item.webhook ? <Link className="size-3.5" /> : null}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
