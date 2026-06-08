import { BellRing, ListChecks, Plus, Rows3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRemUiStore } from './store'

export function RemRightSidebar() {
  const { t } = useTranslation()
  const view = useRemUiStore(state => state.view)
  const setView = useRemUiStore(state => state.setView)
  const requestCreateReminder = useRemUiStore(
    state => state.requestCreateReminder
  )

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center gap-2 px-1">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BellRing className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {t('modules.rem.title')}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {t('modules.rem.subtitle')}
          </div>
        </div>
      </div>

      <Button className="w-full justify-start" onClick={requestCreateReminder}>
        <Plus className="size-4" />
        {t('modules.rem.actions.create')}
      </Button>

      <div className="grid gap-1">
        <SidebarButton
          active={view === 'home'}
          icon={Rows3}
          label={t('modules.rem.nav.home')}
          onClick={() => setView('home')}
        />
        <SidebarButton
          active={view === 'logs'}
          icon={ListChecks}
          label={t('modules.rem.nav.logs')}
          onClick={() => setView('logs')}
        />
      </div>
    </div>
  )
}

function SidebarButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'justify-start',
        active && 'bg-accent text-accent-foreground'
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  )
}
