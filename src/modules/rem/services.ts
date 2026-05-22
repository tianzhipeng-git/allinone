import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  commands,
  unwrapResult,
  type RemLogStatus,
  type RemUpsertReminderInput,
} from '@/lib/tauri-bindings'

export const remQueryKeys = {
  dashboard: ['module', 'rem', 'dashboard'] as const,
}

export function useRemDashboard() {
  return useQuery({
    queryKey: remQueryKeys.dashboard,
    queryFn: async () => unwrapResult(await commands.remGetDashboard()),
  })
}

export function useUpsertReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RemUpsertReminderInput) =>
      commands.remUpsertReminder(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: remQueryKeys.dashboard }),
  })
}

export function useToggleReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { reminderId: number; active: boolean }) =>
      commands.remToggleReminder(input.reminderId, input.active),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: remQueryKeys.dashboard }),
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reminderId: number) => commands.remDeleteReminder(reminderId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: remQueryKeys.dashboard }),
  })
}

export function useUpdateLogStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      logId: number
      status: RemLogStatus
      note?: string
    }) =>
      commands.remUpdateLogStatus(
        input.logId,
        input.status,
        input.note ?? null
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: remQueryKeys.dashboard }),
  })
}
