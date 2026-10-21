import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'

type Mode = 'sign-in' | 'sign-up'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const signingUp = mode === 'sign-up'

  function switchMode() {
    setMode(signingUp ? 'sign-in' : 'sign-up')
    setError(null)
    setNotice(null)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setPending(true)

    if (mode === 'sign-up') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      setPending(false)
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      if (!data.session) {
        setNotice(
          'Check your email to confirm the account. In Supabase, turn off email confirmation if you want to sign in immediately.',
        )
      }
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setPending(false)
    if (signInError) setError(signInError.message)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
      <p className="mt-2 text-muted">
        {signingUp
          ? 'Create an account. The same inbox opens on this computer and your phone.'
          : 'Sign in to capture a note.'}
      </p>
      <form className="mt-8 flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            className="field"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            className="field"
            type="password"
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {signingUp && <p className="text-sm text-muted">At least 6 characters.</p>}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}
        <button className="primary-button mt-2" type="submit" disabled={pending}>
          {pending ? 'Working…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <button
        className="ghost-button mt-4 self-start"
        type="button"
        onClick={switchMode}
      >
        {signingUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
      </button>
    </main>
  )
}
