-- Run once in the Supabase SQL editor.
-- Each account can only read and write its own notes.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint notes_body_not_blank check (char_length(btrim(body)) > 0)
);

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);

alter table public.notes replica identity full;

alter table public.notes enable row level security;

grant select, insert, update, delete on table public.notes to authenticated;

drop policy if exists "select own notes" on public.notes;
create policy "select own notes"
  on public.notes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own notes" on public.notes;
create policy "insert own notes"
  on public.notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own notes" on public.notes;
create policy "update own notes"
  on public.notes 
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own notes" on public.notes;
create policy "delete own notes"
  on public.notes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_notes_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end $$;
