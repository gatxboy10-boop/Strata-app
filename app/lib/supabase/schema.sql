-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  stress_level int not null check (stress_level between 1 and 5),
  note text,
  prompt text
);

create table if not exists value_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  values text[] not null
);

alter table entries enable row level security;
alter table value_readings enable row level security;

-- Each person can only ever see or modify their own rows.
create policy "Users manage their own entries"
  on entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own value readings"
  on value_readings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
