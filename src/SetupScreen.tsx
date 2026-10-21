export function SetupScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
      <p className="mt-2 text-muted">
        Add your Supabase project before notes can be saved. They stay in the account you create.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-6">
        <li>Create a free project at supabase.com.</li>
        <li>In Authentication, turn off email confirmation so you can sign in right away.</li>
        <li>Open the SQL editor and run the script in supabase/schema.sql.</li>
        <li>
          Copy the project URL and anon key into <code className="rounded bg-line px-1">.env.local</code>{' '}
          using the names in <code className="rounded bg-line px-1">.env.example</code>, then restart
          the dev server.
        </li>
      </ol>
    </main>
  )
}
