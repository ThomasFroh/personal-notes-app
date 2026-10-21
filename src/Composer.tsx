import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

type ComposerProps = {
  onSave: (body: string) => Promise<string | null>
}

export function Composer({ onSave }: ComposerProps) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fieldRef.current?.focus()
  }, [])

  function resize(field: HTMLTextAreaElement) {
    field.style.height = 'auto'
    field.style.height = `${Math.min(field.scrollHeight, 160)}px`
  }

  async function save() {
    const body = text.trim()
    if (!body || pending) return

    const draft = text
    setText('')
    setError(null)
    setPending(true)
    const field = fieldRef.current
    if (field) {
      field.style.height = 'auto'
      field.focus()
    }

    const message = await onSave(body)
    setPending(false)
    if (message) {
      setText(draft)
      setError(message)
      requestAnimationFrame(() => {
        if (fieldRef.current) resize(fieldRef.current)
        fieldRef.current?.focus()
      })
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void save()
    }
  }

  return (
    <footer className="shrink-0 border-t border-line bg-paper/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 pt-3"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <label className="sr-only" htmlFor="capture">
          New note
        </label>
        <textarea
          id="capture"
          ref={fieldRef}
          className="field min-h-16 resize-none font-serif text-lg leading-7"
          rows={2}
          placeholder="Write a note. Ctrl+Enter to save."
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            resize(event.target)
          }}
          onKeyDown={onKeyDown}
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Enter adds a line.</p>
          <button className="primary-button" type="submit" disabled={pending || text.trim().length === 0}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </footer>
  )
}
