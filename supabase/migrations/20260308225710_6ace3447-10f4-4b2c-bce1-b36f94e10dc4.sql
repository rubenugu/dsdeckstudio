
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── flashcards ───────────────────────────────────────────────────────────────
create table public.flashcards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category        text not null,
  subcategory     text not null default '',
  front           text not null,
  back            text not null,
  code_example    text,
  difficulty      text not null default 'beginner',
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  last_reviewed   timestamptz,
  next_review     timestamptz,
  repetitions     integer not null default 0,
  ease_factor     numeric not null default 2.5,
  interval_days   integer not null default 1,
  quality         integer
);

alter table public.flashcards enable row level security;

create policy "Users see own cards"
  on public.flashcards for select
  using (auth.uid() = user_id);

create policy "Users insert own cards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users update own cards"
  on public.flashcards for update
  using (auth.uid() = user_id);

create policy "Users delete own cards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- ── study_sessions ───────────────────────────────────────────────────────────
create table public.study_sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  date              timestamptz not null default now(),
  cards_reviewed    integer not null default 0,
  accuracy          numeric not null default 0,
  duration_minutes  numeric not null default 0
);

alter table public.study_sessions enable row level security;

create policy "Users see own sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

-- ── user_settings ────────────────────────────────────────────────────────────
create table public.user_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  theme           text not null default 'dark',
  streak          integer not null default 0,
  last_study_date text,
  updated_at      timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users see own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);
