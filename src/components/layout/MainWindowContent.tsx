import { cn } from '@/lib/utils'
import { getModuleById } from '@/modules/registry'
import { useUIStore } from '@/store/ui-store'
import { Suspense } from 'react'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  const activeModuleId = useUIStore(state => state.activeModuleId)
  const activeModule = getModuleById(activeModuleId)
  const ActiveModuleComponent = activeModule.component

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children || (
        <Suspense
          fallback={<div className="flex flex-1 items-center justify-center" />}
        >
          <ActiveModuleComponent />
        </Suspense>
      )}
    </div>
  )
}
