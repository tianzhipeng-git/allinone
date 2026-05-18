import { cn } from '@/lib/utils'
import { getModuleById } from '@/modules/registry'
import { useUIStore } from '@/store/ui-store'
import { Suspense } from 'react'

interface RightSideBarProps {
  children?: React.ReactNode
  className?: string
}

export function RightSideBar({ children, className }: RightSideBarProps) {
  const activeModuleId = useUIStore(state => state.activeModuleId)
  const activeModule = getModuleById(activeModuleId)
  const ActiveRightSidebar = activeModule.rightSidebarComponent

  return (
    <div
      className={cn('flex h-full flex-col border-l bg-background', className)}
    >
      {children ||
        (ActiveRightSidebar ? (
          <Suspense fallback={null}>
            <ActiveRightSidebar />
          </Suspense>
        ) : null)}
    </div>
  )
}
