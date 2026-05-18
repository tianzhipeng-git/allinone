import { gtdModule } from './gtd'
import type { AppModule } from './types'

export const modules: AppModule[] = [gtdModule].sort(
  (a, b) => a.order - b.order
)

export function getModuleById(id: string): AppModule {
  const fallback = modules[0]
  if (!fallback) {
    throw new Error('No app modules registered')
  }

  return modules.find(module => module.id === id) ?? fallback
}
