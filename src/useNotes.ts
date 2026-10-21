import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Note, NoteView } from './types'

function byNewest(a: Note, b: Note) {
  if (a.created_at === b.created_at) return 0
  return a.created_at < b.created_at ? 1 : -1
}

function mergeNote(notes: Note[], note: Note): Note[] {
  return [...notes.filter((item) => item.id !== note.id), note].sort(byNewest)
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false
  const note = value as Partial<Note>
  return typeof note.id === 'string' && typeof note.body === 'string' && typeof note.user_id === 'string'
}

export function useNotes(userId: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        if (loadError) {
          setError(loadError.message)
          setNotes([])
        } else {
          const fetched = ((data ?? []) as unknown[]).filter(isNote)
          setNotes((current) => {
            const ids = new Set(fetched.map((note) => note.id))
            const localOnly = current.filter((note) => !ids.has(note.id))
            return [...localOnly, ...fetched].sort(byNewest)
          })
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    const channel = supabase
      .channel(`notes:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id
            if (!id) return
            setNotes((current) => current.filter((note) => note.id !== id))
            return
          }

          if (!isNote(payload.new)) return
          setNotes((current) => mergeNote(current, payload.new as Note))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const save = useCallback(
    async (body: string): Promise<string | null> => {
      const note: Note = {
        id: crypto.randomUUID(),
        user_id: userId,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
      }

      setNotes((current) => mergeNote(current, note))
      const { data, error: insertError } = await supabase
        .from('notes')
        .insert({
          id: note.id,
          user_id: note.user_id,
          body: note.body,
          created_at: note.created_at,
        })
        .select('*')
        .single()

      if (insertError) {
        setNotes((current) => current.filter((item) => item.id !== note.id))
        return insertError.message
      }

      if (isNote(data)) setNotes((current) => mergeNote(current, data))
      return null
    },
    [userId],
  )

  const updateBody = useCallback(async (id: string, body: string): Promise<string | null> => {
    const trimmed = body.trim()
    if (!trimmed) return 'Write something before saving.'

    let previous: Note | undefined
    setNotes((current) => {
      previous = current.find((note) => note.id === id)
      if (!previous) return current
      return mergeNote(current, { ...previous, body: trimmed, updated_at: new Date().toISOString() })
    })

    const { data, error: updateError } = await supabase
      .from('notes')
      .update({ body: trimmed })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      if (previous) {
        const snapshot = previous
        setNotes((current) => mergeNote(current, snapshot))
      }
      return updateError.message
    }

    if (isNote(data)) setNotes((current) => mergeNote(current, data))
    return null
  }, [])

  const setArchived = useCallback(async (note: Note, archived: boolean): Promise<string | null> => {
    const archivedAt = archived ? new Date().toISOString() : null
    setNotes((current) => mergeNote(current, { ...note, archived_at: archivedAt }))

    const { data, error: updateError } = await supabase
      .from('notes')
      .update({ archived_at: archivedAt })
      .eq('id', note.id)
      .select('*')
      .single()

    if (updateError) {
      setNotes((current) => mergeNote(current, note))
      return updateError.message
    }

    if (isNote(data)) setNotes((current) => mergeNote(current, data))
    return null
  }, [])

  const remove = useCallback(async (id: string): Promise<string | null> => {
    let removed: Note | undefined
    setNotes((current) => {
      removed = current.find((note) => note.id === id)
      return current.filter((note) => note.id !== id)
    })

    const { error: deleteError } = await supabase.from('notes').delete().eq('id', id)
    if (deleteError) {
      if (removed) {
        const snapshot = removed
        setNotes((current) => mergeNote(current, snapshot))
      }
      return deleteError.message
    }

    return null
  }, [])

  return { notes, loading, error, setError, save, updateBody, setArchived, remove }
}

export function matchesView(note: Note, view: NoteView): boolean {
  return view === 'archive' ? note.archived_at != null : note.archived_at == null
}
