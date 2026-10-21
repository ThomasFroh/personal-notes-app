# Notes

A capture inbox for personal and work notes. Type a note, save it, and file it later. The same account opens on this computer and your phone.

Notes are stored in a Supabase project you create. The app only talks to that project. Row-level security limits every account to its own notes.

## One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **Authentication** and turn off **Confirm email**, so a personal account can sign in immediately.
3. Open the **SQL editor**, paste [`supabase/schema.sql`](supabase/schema.sql), and run it.
4. In **Project Settings → API**, copy the project URL and the anon public key.
5. Copy [`.env.example`](.env.example) to `.env.local` and fill in both values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is meant to live in the browser. The database policies, not the key, decide who can read a row. Do not put the service role key in this app.

## Run it locally

```
npm install
npm run dev
```

Restart the dev server after you change `.env.local`. Open the printed local URL, create an account, and write a note. **Ctrl+Enter** or **⌘+Enter** saves. Enter adds a line.

- **Inbox** is newest first.
- **Archive** clears a note from the inbox without deleting it. **Put back** returns it.
- Search filters the list you are looking at.
- A note saved on your phone shows up here while both are open.

## Use it on your phone

Deploy the site, then open that URL on your phone. You can use **Add to Home Screen**. The app does not keep an offline copy; it needs a connection so you never edit a stale note.

### Deploy on Vercel

1. Push this folder to a Git host and import it in Vercel. The framework preset is Vite. The build command is `npm run build` and the output is `dist`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings, then redeploy.
3. In Supabase, open **Authentication → URL configuration**. Set the site URL to your Vercel URL, and add both that URL and `http://localhost:5173` to the redirect allow list.
