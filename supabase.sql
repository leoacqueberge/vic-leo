-- À exécuter une fois dans Supabase : SQL Editor → New query → Run

create table public.countdown (
  id text primary key default 'vic-leo',
  date text not null,
  time text not null,
  location text default '',
  updated_at timestamptz default now()
);

alter table public.countdown enable row level security;

create policy "Lecture publique"
  on public.countdown for select
  using (true);

create policy "Insertion publique"
  on public.countdown for insert
  with check (true);

create policy "Mise à jour publique"
  on public.countdown for update
  using (true);

-- Sync temps réel entre vos deux téléphones
alter publication supabase_realtime add table countdown;
