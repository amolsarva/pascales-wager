-- Pascal database schema
-- Run this in your Supabase SQL editor

-- Enable pgvector extension for embeddings (optional, for v2)
-- create extension if not exists vector;

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  onboarding_complete boolean default false,
  seed_identity jsonb,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  conversation_id uuid,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Users can read own messages" on public.messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.messages for insert with check (auth.uid() = user_id);

create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- Memories table
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('episodic', 'semantic', 'narrative')),
  content text not null,
  confidence float default 0.7,
  source_message_ids uuid[],
  created_at timestamptz default now()
);

alter table public.memories enable row level security;
create policy "Users can read own memories" on public.memories for select using (auth.uid() = user_id);
create policy "Users can insert own memories" on public.memories for insert with check (auth.uid() = user_id);

create index if not exists memories_user_id_idx on public.memories(user_id);
create index if not exists memories_type_idx on public.memories(user_id, type);
create index if not exists memories_created_at_idx on public.memories(created_at desc);

-- Identity summaries table
create table if not exists public.identity_summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  summary text not null,
  traits jsonb default '[]'::jsonb,
  themes text[] default '{}',
  contradictions text[] default '{}',
  created_at timestamptz default now()
);

alter table public.identity_summaries enable row level security;
create policy "Users can read own summaries" on public.identity_summaries for select using (auth.uid() = user_id);
create policy "Users can insert own summaries" on public.identity_summaries for insert with check (auth.uid() = user_id);

create index if not exists identity_summaries_user_id_idx on public.identity_summaries(user_id);

-- Rituals table
create table if not exists public.rituals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  prompt text not null,
  response text,
  date date default current_date,
  created_at timestamptz default now()
);

alter table public.rituals enable row level security;
create policy "Users can read own rituals" on public.rituals for select using (auth.uid() = user_id);
create policy "Users can insert own rituals" on public.rituals for insert with check (auth.uid() = user_id);

-- Auto-create user record on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
