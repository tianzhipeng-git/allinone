import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commands, unwrapResult, type GtdDocument } from '@/lib/tauri-bindings'

export const gtdQueryKeys = {
  tree: ['module', 'gtd', 'tree'] as const,
  document: (documentId: number | null) =>
    ['module', 'gtd', 'document', documentId] as const,
}

export function useGtdTree() {
  return useQuery({
    queryKey: gtdQueryKeys.tree,
    queryFn: async () => unwrapResult(await commands.gtdGetTree()),
  })
}

export function useGtdDocument(documentId: number | null) {
  return useQuery({
    queryKey: gtdQueryKeys.document(documentId),
    enabled: documentId !== null,
    queryFn: async () =>
      unwrapResult(await commands.gtdReadDocument(documentId as number)),
  })
}

export function useCreateGtdGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string; parentId: number | null }) =>
      commands.gtdCreateGroup(input.name, input.parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gtdQueryKeys.tree })
    },
  })
}

export function useRegisterGtdDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      path: string
      groupId: number
      title: string | null
    }) => commands.gtdRegisterDocument(input.path, input.groupId, input.title),
    onSuccess: result => {
      if (result.status === 'ok') {
        queryClient.invalidateQueries({ queryKey: gtdQueryKeys.tree })
      }
    },
  })
}

export function useSaveGtdDocument(document: GtdDocument | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => {
      if (!document) {
        throw new Error('No GTD document selected')
      }

      return commands.gtdSaveDocument(document.id, content)
    },
    onSuccess: result => {
      if (result.status === 'ok' && document) {
        queryClient.invalidateQueries({ queryKey: gtdQueryKeys.tree })
        queryClient.invalidateQueries({
          queryKey: gtdQueryKeys.document(document.id),
        })
      }
    },
  })
}
