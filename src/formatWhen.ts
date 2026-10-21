export function formatWhen(iso: string, now = Date.now()): string {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return ''

  const minutes = Math.round((now - time) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function wasEdited(note: { created_at: string; updated_at: string }): boolean {
  const created = new Date(note.created_at).getTime()
  const updated = new Date(note.updated_at).getTime()
  return updated - created > 2000
}
