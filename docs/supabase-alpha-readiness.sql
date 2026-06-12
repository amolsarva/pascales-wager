-- Pascale's Wager alpha readiness schema patch
-- Run this in the Supabase SQL editor for the production project, then run:
-- npm run audit:schema
-- npm run smoke:alpha

create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  mode text not null default 'freeform',
  title text,
  summary text,
  main_dilemma text,
  emotional_tone text,
  decision_status text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists session_id uuid;

alter table public.memories
  add column if not exists session_id uuid,
  add column if not exists importance integer default 5,
  add column if not exists source_message_ids uuid[];

create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  summary text not null,
  key_points text[] default '{}',
  next_actions text[] default '{}',
  memories_to_save text[] default '{}',
  follow_up_question text,
  created_at timestamptz not null default now()
);

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  archetype text not null,
  monogram text,
  tone text,
  best_for text,
  description text,
  accent text default '#B98A57',
  shadow text default '#34241C',
  worldview text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;
alter table public.session_summaries enable row level security;
alter table public.advisors enable row level security;

drop policy if exists "Users manage own sessions" on public.sessions;
create policy "Users manage own sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own session summaries" on public.session_summaries;
create policy "Users manage own session summaries"
  on public.session_summaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own advisors" on public.advisors;
create policy "Users manage own advisors"
  on public.advisors
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on
  public.sessions,
  public.messages,
  public.memories,
  public.session_summaries,
  public.advisors
to authenticated, service_role;

notify pgrst, 'reload schema';
