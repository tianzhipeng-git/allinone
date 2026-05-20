import { cn } from '@/lib/utils'
import {
  dispatchModuleSaveRequested,
  isModuleSaveShortcut,
} from '@/lib/module-save-events'
import { getModuleById } from '@/modules/registry'
import { useUIStore } from '@/store/ui-store'
import { Suspense, useEffect } from 'react'

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !isModuleSaveShortcut(event)) {
        return
      }

      event.preventDefault()
      dispatchModuleSaveRequested(activeModuleId)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeModuleId])

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
