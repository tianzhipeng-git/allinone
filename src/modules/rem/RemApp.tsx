import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { RemReminder, RemUpsertReminderInput } from '@/lib/tauri-bindings'
import {
  Calendar,
  CalendarClock,
  Infinity as InfinityIcon,
  Plus,
  Search,
  Sun,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  useDeleteReminder,
  useRemDashboard,
  useToggleReminder,
  useUpdateLogStatus,
  useUpsertReminder,
} from './services'

type TabKey = 'home' | 'logs'

export function RemApp() {
  const dashboardQuery = useRemDashboard()
  const upsertMutation = useUpsertReminder()
  const toggleMutation = useToggleReminder()
  const deleteMutation = useDeleteReminder()
  const updateLogMutation = useUpdateLogStatus()

  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [activeTag, setActiveTag] = useState('全部')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<RemReminder | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  if (dashboardQuery.isLoading) {
    return <Skeleton className="m-4 h-full" />
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <div className="p-4 text-sm text-destructive">加载 REM 失败</div>
  }

  const reminders = dashboardQuery.data.reminders
  const logs = dashboardQuery.data.logs
  const tags = ['全部', ...new Set(reminders.map(item => item.tag))]

  const filteredReminders = reminders.filter(item => {
    const byTag = activeTag === '全部' || item.tag === activeTag
    const byQuery =
      query.length === 0 ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    return byTag && byQuery
  })

  const grouped = {
    day: filteredReminders.filter(
      item => (item.interval_minutes ?? 10_000) <= 60 * 24
    ),
    week: filteredReminders.filter(
      item =>
        (item.interval_minutes ?? 10_000) > 60 * 24 &&
        (item.interval_minutes ?? 10_000) <= 60 * 24 * 7
    ),
    month: filteredReminders.filter(
      item =>
        (item.interval_minutes ?? 10_000) > 60 * 24 * 7 &&
        (item.interval_minutes ?? 10_000) <= 60 * 24 * 30
    ),
    year: filteredReminders.filter(
      item => (item.interval_minutes ?? 10_000) > 60 * 24 * 30
    ),
  }

  const pendingLogs = logs.filter(log => log.status === 'Pending')

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">怪奇提醒（REM）</h1>
          <p className="text-sm text-muted-foreground">
            首页 / 日志 / 详情 / 编辑 全流程
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setShowEditor(true)
          }}
        >
          <Plus className="size-4" />
          新建提醒
        </Button>
      </header>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'home' ? 'default' : 'outline'}
          onClick={() => setActiveTab('home')}
        >
          首页
        </Button>
        <Button
          variant={activeTab === 'logs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('logs')}
        >
          全局日志
        </Button>
      </div>

      {activeTab === 'home' ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="搜索提醒"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {tags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={activeTag === tag ? 'default' : 'outline'}
                    onClick={() => setActiveTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
            <Section
              title="天级"
              icon={Sun}
              items={grouped.day}
              onEdit={x => {
                setEditing(x)
                setShowEditor(true)
              }}
              onToggle={x =>
                toggleMutation.mutate({ reminderId: x.id, active: !x.active })
              }
              onDelete={x => deleteMutation.mutate(x.id)}
            />
            <Section
              title="周级"
              icon={CalendarClock}
              items={grouped.week}
              onEdit={x => {
                setEditing(x)
                setShowEditor(true)
              }}
              onToggle={x =>
                toggleMutation.mutate({ reminderId: x.id, active: !x.active })
              }
              onDelete={x => deleteMutation.mutate(x.id)}
            />
            <Section
              title="月级"
              icon={Calendar}
              items={grouped.month}
              onEdit={x => {
                setEditing(x)
                setShowEditor(true)
              }}
              onToggle={x =>
                toggleMutation.mutate({ reminderId: x.id, active: !x.active })
              }
              onDelete={x => deleteMutation.mutate(x.id)}
            />
            <Section
              title="年级"
              icon={InfinityIcon}
              items={grouped.year}
              onEdit={x => {
                setEditing(x)
                setShowEditor(true)
              }}
              onToggle={x =>
                toggleMutation.mutate({ reminderId: x.id, active: !x.active })
              }
              onDelete={x => deleteMutation.mutate(x.id)}
            />
          </div>
        </>
      ) : (
        <Card className="min-h-0 flex-1">
          <CardHeader>
            <CardTitle>全局日志</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <ScrollArea className="h-[420px]">
              <div className="space-y-2">
                {logs.map(log => {
                  const reminder = reminders.find(r => r.id === log.reminder_id)
                  return (
                    <div key={log.id} className="rounded border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          {reminder?.title ?? '未知提醒'} ·{' '}
                          {new Date(log.triggered_at).toLocaleString()}
                        </div>
                        <Badge>{log.status}</Badge>
                      </div>
                      <div className="mt-2 text-muted-foreground">
                        {log.note ?? '无备注'}
                      </div>
                      {log.status === 'Pending' ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              updateLogMutation.mutate({
                                logId: log.id,
                                status: 'Confirmed',
                              })
                            }
                          >
                            确认
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateLogMutation.mutate({
                                logId: log.id,
                                status: 'Ignored',
                              })
                            }
                          >
                            忽略
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Separator />
      <div className="text-xs text-muted-foreground">
        MenuBar 预览：待处理{' '}
        <Badge variant="secondary">{pendingLogs.length}</Badge>
      </div>

      <ReminderEditor
        open={showEditor}
        reminder={editing}
        onClose={() => setShowEditor(false)}
        onSubmit={async input => {
          await upsertMutation.mutateAsync(input)
          setShowEditor(false)
        }}
      />
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  items,
  onEdit,
  onToggle,
  onDelete,
}: {
  title: string
  icon: typeof Sun
  items: RemReminder[]
  onEdit: (r: RemReminder) => void
  onToggle: (r: RemReminder) => void
  onDelete: (r: RemReminder) => void
}) {
  return (
    <Card className="min-h-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0">
        <ScrollArea className="h-[220px]">
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{item.title}</div>
                  <Badge variant={item.active ? 'default' : 'outline'}>
                    {item.active ? '活跃' : '暂停'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
                <div className="mt-2 text-xs">{item.natural_text}</div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                  >
                    详情/编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggle(item)}
                  >
                    {item.active ? '暂停' : '启用'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(item)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function ReminderEditor({
  open,
  reminder,
  onClose,
  onSubmit,
}: {
  open: boolean
  reminder: RemReminder | null
  onClose: () => void
  onSubmit: (input: RemUpsertReminderInput) => Promise<void>
}) {
  const [title, setTitle] = useState(reminder?.title ?? '')
  const [description, setDescription] = useState(reminder?.description ?? '')
  const [tag, setTag] = useState(reminder?.tag ?? '默认')
  const [cronExpr, setCronExpr] = useState(
    reminder?.cron_expr ?? '0 9 * * 1,3,5'
  )
  const [naturalText, setNaturalText] = useState(
    reminder?.natural_text ?? '每周一三五 09:00'
  )

  const payload = useMemo<RemUpsertReminderInput>(
    () => ({
      id: reminder?.id ?? null,
      title,
      description,
      tag,
      active: reminder?.active ?? true,
      schedule_mode: 'Cron',
      cron_expr: cronExpr,
      interval_minutes: null,
      natural_text: naturalText,
      webhook_url: null,
      notify_system: true,
    }),
    [
      reminder?.id,
      reminder?.active,
      title,
      description,
      tag,
      cronExpr,
      naturalText,
    ]
  )

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reminder ? '编辑提醒' : '创建提醒'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="名称"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="描述"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Input
            placeholder="标签"
            value={tag}
            onChange={e => setTag(e.target.value)}
          />
          <Input
            placeholder="Cron"
            value={cronExpr}
            onChange={e => setCronExpr(e.target.value)}
          />
          <Input
            placeholder="自然语言"
            value={naturalText}
            onChange={e => setNaturalText(e.target.value)}
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={() => void onSubmit(payload)}
            disabled={!title.trim()}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
