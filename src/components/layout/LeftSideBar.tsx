import { cn } from '@/lib/utils'
import { modules } from '@/modules/registry'
import { useUIStore } from '@/store/ui-store'
import { useTranslation } from 'react-i18next'

interface LeftSideBarProps {
  children?: React.ReactNode
  className?: string
}

export function LeftSideBar({ children, className }: LeftSideBarProps) {
  const { t } = useTranslation()
  const activeModuleId = useUIStore(state => state.activeModuleId)
  const setActiveModuleId = useUIStore(state => state.setActiveModuleId)

  return (
    <div
      className={cn('flex h-full flex-col border-r bg-background', className)}
    >
      {children || (
        <>
          <div className="border-b px-3 py-3">
            <div className="text-xs font-medium text-muted-foreground">
              {t('modules.launcher')}
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-2">
            {modules.map(module => {
              const Icon = module.icon
              const isActive = module.id === activeModuleId

              return (
                <button
                  key={module.id}
                  type="button"
                  className={cn(
                    'flex h-10 w-full items-center gap-3 rounded-md px-3 text-start text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveModuleId(module.id)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    {t(module.labelKey)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {module.shortLabel}
                  </span>
                </button>
              )
            })}
          </nav>
        </>
      )}
    </div>
  )
}
