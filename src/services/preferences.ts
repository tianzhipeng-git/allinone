import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, type AppPreferences } from '@/lib/tauri-bindings'

/** Fully resolved sidebar fields (`AppPreferences` from specta may mark them optional after serde defaults). */
export type ResolvedAppPreferences = Omit<
  AppPreferences,
  | 'left_sidebar_visible'
  | 'right_sidebar_visible'
  | 'left_sidebar_size'
  | 'right_sidebar_size'
> & {
  left_sidebar_visible: boolean
  right_sidebar_visible: boolean
  left_sidebar_size: number
  right_sidebar_size: number
}

// Query keys for preferences
export const preferencesQueryKeys = {
  all: ['preferences'] as const,
  preferences: () => [...preferencesQueryKeys.all] as const,
}

/** Full defaults matching `AppPreferences::default` in Rust (including layout). */
export const DEFAULT_APP_PREFERENCES: ResolvedAppPreferences = {
  theme: 'system',
  quick_pane_shortcut: null,
  language: null,
  left_sidebar_visible: true,
  right_sidebar_visible: true,
  left_sidebar_size: 20,
  right_sidebar_size: 20,
}

export function normalizeAppPreferences(
  prefs: AppPreferences | undefined
): ResolvedAppPreferences {
  if (!prefs) {
    return { ...DEFAULT_APP_PREFERENCES }
  }
  return {
    ...DEFAULT_APP_PREFERENCES,
    ...prefs,
    left_sidebar_visible: prefs.left_sidebar_visible ?? true,
    right_sidebar_visible: prefs.right_sidebar_visible ?? true,
    left_sidebar_size: prefs.left_sidebar_size ?? 20,
    right_sidebar_size: prefs.right_sidebar_size ?? 20,
  }
}

/** Writes preferences to disk without success toasts (e.g. sidebar drag auto-save). */
export async function savePreferencesQuietly(
  queryClient: QueryClient,
  preferences: AppPreferences
): Promise<void> {
  const merged = normalizeAppPreferences(preferences)
  const result = await commands.savePreferences(merged)
  if (result.status === 'error') {
    logger.warn('Quiet preferences save failed', { error: result.error })
    return
  }
  queryClient.setQueryData(preferencesQueryKeys.preferences(), merged)
}

// TanStack Query hooks following the architectural patterns
export function usePreferences() {
  return useQuery({
    queryKey: preferencesQueryKeys.preferences(),
    queryFn: async (): Promise<ResolvedAppPreferences> => {
      logger.debug('Loading preferences from backend')
      const result = await commands.loadPreferences()

      if (result.status === 'error') {
        // Return defaults if preferences file doesn't exist yet
        logger.warn('Failed to load preferences, using defaults', {
          error: result.error,
        })
        return { ...DEFAULT_APP_PREFERENCES }
      }

      logger.info('Preferences loaded successfully', {
        preferences: result.data,
      })
      return normalizeAppPreferences(result.data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: AppPreferences) => {
      const merged = normalizeAppPreferences(preferences)
      logger.debug('Saving preferences to backend', { preferences: merged })
      const result = await commands.savePreferences(merged)

      if (result.status === 'error') {
        logger.error('Failed to save preferences', {
          error: result.error,
          preferences: merged,
        })
        toast.error('Failed to save preferences', { description: result.error })
        throw new Error(result.error)
      }

      logger.info('Preferences saved successfully')
    },
    onSuccess: (_, preferences) => {
      // Update the cache with the new preferences
      queryClient.setQueryData(
        preferencesQueryKeys.preferences(),
        normalizeAppPreferences(preferences)
      )
      logger.info('Preferences cache updated')
      toast.success('Preferences saved')
    },
  })
}
