import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthScreen } from './AuthScreen'
import { Composer } from './Composer'
import { NoteList } from './NoteList'
import { SetupScreen } from './SetupScreen'
import { supabase, supabaseConfigured } from './lib/supabase'
import type { NoteView } from './types'
import { matchesView, useNotes } from './useNotes'

export default function App() {
  if (!supabaseConfigured) return <SetupScreen />
  return <SignedInApp />
}

function SignedInApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center text-sm text-muted">
        <p>Loading…</p>
      </main>
    )
  }

  if (!session) return <AuthScreen />
  return <NotesScreen userId={session.user.id} email={session.user.email ?? ''} />
}

function NotesScreen({ userId, email }: { userId: string; email: string }) {
  const [view, setView] = useState<NoteView>('inbox')
  const [query, setQuery] = useState('')
  const { notes, loading, error, setError, save, updateBody, setArchived, remove } = useNotes(userId)

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return notes.filter((note) => {
      if (!matchesView(note, view)) return false
      if (!needle) return true
      return note.body.toLowerCase().includes(needle)
    })
  }, [notes, query, view])

  return (
    <div className="flex h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl shrink-0 items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Notes</h1>
          {email && <p className="truncate text-sm text-muted">{email}</p>}
        </div>
        <button
          className="ghost-button shrink-0"
          type="button"
          onClick={() => void supabase.auth.signOut()}
        >
          Sign out
        </button>
      </header>
      <div className="mx-auto flex w-full max-w-2xl shrink-0 flex-col gap-3 px-4 pb-3">
        <label className="sr-only" htmlFor="search">
          Search notes
        </label>
        <input
          id="search"
          className="field"
          type="search"
          placeholder="Search notes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-line/80 p-1" role="group" aria-label="Note list">
          <button
            className={view === 'inbox' ? 'tab tab-active' : 'tab'}
            type="button"
            aria-pressed={view === 'inbox'}
            onClick={() => setView('inbox')}
          >
            Inbox
          </button>
          <button
            className={view === 'archive' ? 'tab tab-active' : 'tab'}
            type="button"
            aria-pressed={view === 'archive'}
            onClick={() => setView('archive')}
          >
            Archive
          </button>
        </div>
        {error && (
          <p role="alert" className="flex items-start justify-between gap-3 text-sm text-danger">
            <span>{error}</span>
            <button className="ghost-button shrink-0" type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </p>
        )}
      </div>
      <main className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4">
        <NoteList
          notes={visible}
          view={view}
          loading={loading}
          searching={query.trim().length > 0}
          onEdit={updateBody}
          onArchive={setArchived}
          onDelete={remove}
        />
      </main>
      <Composer
        onSave={async (body) => {
          setView('inbox')
          setQuery('')
          return save(body)
        }}
      />
    </div>
  )
}
