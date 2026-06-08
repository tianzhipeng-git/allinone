import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RemDetailDialog } from './components/RemDetailDialog'
import { RemEditorDialog } from './components/RemEditorDialog'
import { RemLogsView } from './components/RemLogsView'
import { RemReminderBoard } from './components/RemReminderBoard'
import {
  remQueryKeys,
  useCreateRemReminder,
  useDeleteRemReminder,
  useRemState,
  useToggleRemReminder,
  useUpdateRemLogNote,
  useUpdateRemLogStatus,
  useUpdateRemReminder,
} from './services'
import { useRemUiStore } from './store'
import type {
  RemEnabledFilter,
  RemLogStatus,
  RemReminder,
  RemReminderDraft,
  RemReminderSort,
} from './types'
import { defaultRemEnabledFilter, defaultRemReminderSort } from './types'

export function RemApp() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const view = useRemUiStore(state => state.view)
  const createRequestId = useRemUiStore(state => state.createRequestId)
  const remState = useRemState(t)
  const createReminder = useCreateRemReminder()
  const updateReminder = useUpdateRemReminder()
  const toggleReminder = useToggleRemReminder()
  const deleteReminder = useDeleteRemReminder()
  const updateLogStatusMutation = useUpdateRemLogStatus()
  const updateLogNoteMutation = useUpdateRemLogNote()
  const [selectedTag, setSelectedTag] = useState('all')
  const [reminderSort, setReminderSort] =
    useState<RemReminderSort>(defaultRemReminderSort)
  const [enabledFilter, setEnabledFilter] =
    useState<RemEnabledFilter>(defaultRemEnabledFilter)
  const [reminderSearch, setReminderSearch] = useState('')
  const [logSearch, setLogSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RemLogStatus | 'all'>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<RemReminder>()
  const [detailReminderId, setDetailReminderId] = useState<string>()
  const reminders = remState.data?.reminders ?? []
  const logs = remState.data?.logs ?? []
  const detailReminder = reminders.find(
    reminder => reminder.id === detailReminderId
  )

  useEffect(() => {
    return useRemUiStore.subscribe((state, previousState) => {
      if (
        state.createRequestId > 0 &&
        state.createRequestId !== previousState.createRequestId
      ) {
        setEditingReminder(undefined)
        setEditorOpen(true)
      }
    })
  }, [])

  useEffect(() => {
    const unlisten = listen('rem://state-changed', () => {
      queryClient.invalidateQueries({ queryKey: remQueryKeys.state })
    })

    return () => {
      void unlisten.then(dispose => dispose())
    }
  }, [queryClient])

  function openCreateDialog() {
    setEditingReminder(undefined)
    setEditorOpen(true)
  }

  function openEditDialog(reminder: RemReminder) {
    setEditingReminder(reminder)
    setEditorOpen(true)
  }

  async function saveReminder(draft: RemReminderDraft) {
    const result = draft.id
      ? await updateReminder.mutateAsync(draft)
      : await createReminder.mutateAsync(draft)

    if (result.status === 'ok') {
      setEditorOpen(false)
      setEditingReminder(undefined)
    }
  }

  function deleteReminderById(id: string) {
    deleteReminder.mutate(id)

    if (detailReminderId === id) {
      setDetailReminderId(undefined)
    }
  }

  function updateLogStatus(id: string, status: RemLogStatus) {
    updateLogStatusMutation.mutate({ id, status })
  }

  function updateLogNote(id: string, note: string) {
    updateLogNoteMutation.mutate({ id, note })
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {view === 'home' ? (
        <RemReminderBoard
          reminders={reminders}
          selectedTag={selectedTag}
          enabledFilter={enabledFilter}
          reminderSort={reminderSort}
          searchQuery={reminderSearch}
          onSelectedTagChange={setSelectedTag}
          onEnabledFilterChange={setEnabledFilter}
          onReminderSortChange={setReminderSort}
          onSearchQueryChange={setReminderSearch}
          onCreateReminder={openCreateDialog}
          onEditReminder={openEditDialog}
          onOpenReminder={reminder => setDetailReminderId(reminder.id)}
          onToggleReminder={id => toggleReminder.mutate(id)}
          onDeleteReminder={deleteReminderById}
        />
      ) : (
        <RemLogsView
          logs={logs}
          statusFilter={statusFilter}
          searchQuery={logSearch}
          onStatusFilterChange={setStatusFilter}
          onSearchQueryChange={setLogSearch}
          onUpdateLogStatus={updateLogStatus}
          onUpdateLogNote={updateLogNote}
        />
      )}

      <RemEditorDialog
        key={editingReminder?.id ?? `new-reminder-${createRequestId}`}
        open={editorOpen}
        reminder={editingReminder}
        tags={Array.from(new Set(reminders.map(reminder => reminder.tag)))}
        onOpenChange={setEditorOpen}
        onSave={saveReminder}
      />
      <RemDetailDialog
        open={Boolean(detailReminder)}
        reminder={detailReminder}
        logs={logs}
        onOpenChange={open => {
          if (!open) {
            setDetailReminderId(undefined)
          }
        }}
        onEditReminder={reminder => {
          setDetailReminderId(undefined)
          openEditDialog(reminder)
        }}
        onDeleteReminder={deleteReminderById}
        onUpdateLogStatus={updateLogStatus}
        onUpdateLogNote={updateLogNote}
      />
    </div>
  )
}
