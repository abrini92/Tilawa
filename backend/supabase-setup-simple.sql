-- ============================================
-- TILAWA DATABASE SETUP - SIMPLE VERSION
-- Copy-paste this ENTIRE file into Supabase SQL Editor
-- ============================================

-- 1. WAITLIST TABLE (for landing page)
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default now() not null
);

alter table waitlist enable row level security;

create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

create policy "Anyone can read waitlist"
  on waitlist for select
  using (true);

-- 2. PROFILES TABLE (user info)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- 3. RECITATIONS TABLE (uploaded audio)
create table if not exists recitations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  surah_number int not null check (surah_number >= 1 and surah_number <= 114),
  surah_name text not null,
  verse_from int not null,
  verse_to int not null,
  audio_url text,
  duration int default 0,
  plays int default 0,
  status text default 'processing' check (status in ('processing', 'ready', 'failed')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table recitations enable row level security;

create policy "Recitations are viewable by everyone"
  on recitations for select
  using (status = 'ready');

create policy "Users can insert own recitations"
  on recitations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recitations"
  on recitations for update
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists recitations_user_id_idx on recitations(user_id);
create index if not exists recitations_surah_number_idx on recitations(surah_number);
create index if not exists recitations_created_at_idx on recitations(created_at desc);

-- ============================================
-- DONE! Tables created successfully
-- ============================================

-- Verify tables exist:
select table_name from information_schema.tables 
where table_schema = 'public' 
and table_name in ('waitlist', 'profiles', 'recitations');
