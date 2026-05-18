import type React from 'react'
import type { LucideIcon } from 'lucide-react'
import type { AppCommand } from '@/lib/commands/types'

export interface AppModule {
  id: string
  labelKey: string
  shortLabel: string
  icon: LucideIcon
  order: number
  component: React.LazyExoticComponent<React.ComponentType>
  rightSidebarComponent?: React.LazyExoticComponent<React.ComponentType>
  commands?: AppCommand[]
}
