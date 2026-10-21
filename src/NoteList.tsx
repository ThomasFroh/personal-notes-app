import { useState } from 'react'
import { formatWhen, wasEdited } from './formatWhen'
import type { Note, NoteView } from './types'

type NoteListProps = {
  notes: Note[]
  view: NoteView
  loading: boolean
  searching: boolean
  onEdit: (id: string, body: string) => Promise<string | null>
  onArchive: (note: Note, archived: boolean) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
}

export function NoteList({
  notes,
  view,
  loading,
  searching,
  onEdit,
  onArchive,
  onDelete,
}: NoteListProps) {
  if (loading) {
    return <p className="px-1 py-6 text-sm text-muted">Loading notes…</p>
  }

  if (notes.length === 0) {
    const message = searching
      ? 'No notes match that search.'
      : view === 'inbox'
        ? 'Nothing here yet. The box below is ready.'
        : 'Nothing archived yet.'
    return <p className="px-1 py-6 text-sm text-muted">{message}</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          view={view}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

type NoteCardProps = {
  note: Note
  view: NoteView
  onEdit: (id: string, body: string) => Promise<string | null>
  onArchive: (note: Note, archived: boolean) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
}

function NoteCard({ note, view, onEdit, onArchive, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.body)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveEdit() {
    setPending(true)
    setError(null)
    const message = await onEdit(note.id, draft)
    setPending(false)
    if (message) {
      setError(message)
      return
    }
    setEditing(false)
  }

  async function toggleArchive() {
    setPending(true)
    setError(null)
    const message = await onArchive(note, view === 'inbox')
    setPending(false)
    if (message) setError(message)
  }

  async function remove() {
    setPending(true)
    setError(null)
    const message = await onDelete(note.id)
    setPending(false)
    if (message) setError(message)
  }

  const edited = wasEdited(note)

  return (
    <li className="rounded-2xl border border-line bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted">
        {formatWhen(note.created_at)}
        {edited ? ' · edited' : ''}
      </p>
      {editing ? (
        <textarea
          className="field mt-2 min-h-24 font-serif text-lg leading-7"
          value={draft}
          aria-label="Edit note"
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <p className="mt-2 font-serif text-lg leading-7 break-words whitespace-pre-wrap">{note.body}</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {editing ? (
          <>
            <button className="primary-button" type="button" disabled={pending} onClick={() => void saveEdit()}>
              Save
            </button>
            <button
              className="ghost-button"
              type="button"
              disabled={pending}
              onClick={() => {
                setDraft(note.body)
                setEditing(false)
                setError(null)
              }}
            >
              Cancel
            </button>
          </>
        ) : confirmingDelete ? (
          <>
            <p className="self-center px-2 text-sm">Delete this note?</p>
            <button className="danger-button" type="button" disabled={pending} onClick={() => void remove()}>
              Delete
            </button>
            <button
              className="ghost-button"
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setDraft(note.body)
                setEditing(true)
              }}
            >
              Edit
            </button>
            <button className="ghost-button" type="button" disabled={pending} onClick={() => void toggleArchive()}>
              {view === 'inbox' ? 'Archive' : 'Put back'}
            </button>
            <button className="ghost-button" type="button" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  )
}
