import { Check, FilePenLine, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { RemLogEntry, RemLogStatus } from '../types'

interface LogEntryActionButtonsProps {
  log: RemLogEntry
  onUpdateLogStatus: (id: string, status: RemLogStatus) => void
  onToggleNote: () => void
  className?: string
}

export function LogEntryActionButtons({
  log,
  onUpdateLogStatus,
  onToggleNote,
  className = 'flex gap-1',
}: LogEntryActionButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      {log.status === 'pending' && (
        <>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('modules.rem.actions.confirm')}
            onClick={() => onUpdateLogStatus(log.id, 'confirmed')}
          >
            <Check className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('modules.rem.actions.ignore')}
            onClick={() => onUpdateLogStatus(log.id, 'ignored')}
          >
            <X className="size-4" />
          </Button>
        </>
      )}
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={t('modules.rem.actions.note')}
        onClick={onToggleNote}
      >
        <FilePenLine className="size-4" />
      </Button>
    </div>
  )
}

interface LogEntryNoteEditorProps {
  log: RemLogEntry
  editingNote: boolean
  note: string
  onNoteChange: (note: string) => void
  onCancel: () => void
  onSave: () => void
}

export function LogEntryNoteEditor({
  log,
  editingNote,
  note,
  onNoteChange,
  onCancel,
  onSave,
}: LogEntryNoteEditorProps) {
  const { t } = useTranslation()

  if (editingNote) {
    return (
      <div className="grid gap-2">
        <Textarea value={note} onChange={event => onNoteChange(event.target.value)} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={onSave}>
            {t('modules.rem.actions.save')}
          </Button>
        </div>
      </div>
    )
  }

  if (log.note) {
    return <p className="text-sm text-muted-foreground">{log.note}</p>
  }

  return null
}

export function useLogEntryNote(log: RemLogEntry) {
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(log.note)

  function resetNote() {
    setNote(log.note)
    setEditingNote(false)
  }

  function toggleNote() {
    setEditingNote(current => !current)
  }

  return {
    editingNote,
    note,
    setNote,
    resetNote,
    toggleNote,
  }
}
