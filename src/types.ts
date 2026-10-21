export type Note = {
  id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type NoteView = 'inbox' | 'archive'
