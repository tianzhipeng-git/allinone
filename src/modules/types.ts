import type React from 'react'
import type { LucideIcon } from 'lucide-react'
import type { AppCommand } from '@/lib/commands/types'

export interface AppModuleQuickSearchItem {
  id: string
  title: string
  subtitle?: string
  keywords?: string[]
}

export interface AppModuleQuickSearch {
  search: (query: string) => Promise<AppModuleQuickSearchItem[]>
  submit: (itemId: string) => void | Promise<void>
}

export interface AppModule {
  id: string
  labelKey: string
  shortLabel: string
  aliases?: string[]
  icon: LucideIcon
  order: number
  component: React.LazyExoticComponent<React.ComponentType>
  rightSidebarComponent?: React.LazyExoticComponent<React.ComponentType>
  commands?: AppCommand[]
  quickSearch?: AppModuleQuickSearch
}
