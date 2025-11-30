-- Tilawa Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. WAITLIST TABLE
-- ============================================
create table if not exists waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  user_number serial,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table waitlist enable row level security;

-- Policies
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

create policy "Anyone can read count"
  on waitlist for select
  using (true);

-- ============================================
-- 2. USERS TABLE (extends Supabase auth.users)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ============================================
-- 3. RECITATIONS TABLE
-- ============================================
create table if not exists recitations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  surah_number int not null check (surah_number >= 1 and surah_number <= 114),
  surah_name text not null,
  verse_from int not null,
  verse_to int not null,
  audio_url text not null,  -- Current audio URL (enhanced if available, otherwise original)
  audio_url_original text,  -- Original uploaded file
  audio_url_enhanced text,  -- Auphonic processed file (if available)
  auphonic_production_id text,  -- Auphonic production UUID
  duration int, -- in seconds
  plays int default 0,
  status text default 'processing' check (status in ('processing', 'ready', 'failed')),
  enhancement text check (enhancement in ('clean', 'studio', 'mosque_light', 'mosque_deep')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table recitations enable row level security;

-- Policies
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
create index recitations_user_id_idx on recitations(user_id);
create index recitations_surah_number_idx on recitations(surah_number);
create index recitations_created_at_idx on recitations(created_at desc);

-- ============================================
-- 4. STORAGE BUCKETS
-- ============================================
-- Run this in Supabase Dashboard > Storage > Create new bucket
-- Bucket name: 'recitations'
-- Settings: 
--   - Public bucket: YES
--   - Max file size: 50MB (50000000 bytes)
--   - Allowed MIME types: audio/mpeg, audio/wav, audio/x-wav, audio/webm, audio/mp4, audio/aac

-- Storage policies (run after bucket creation)
create policy "Anyone can view recitations"
  on storage.objects for select
  using (bucket_id = 'recitations');

create policy "Authenticated users can upload recitations"
  on storage.objects for insert
  with check (
    bucket_id = 'recitations' 
    and auth.role() = 'authenticated'
  );

create policy "Users can update own recitations"
  on storage.objects for update
  using (
    bucket_id = 'recitations'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own recitations"
  on storage.objects for delete
  using (
    bucket_id = 'recitations'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to get total waitlist count
create or replace function get_waitlist_count()
returns bigint
language sql
security definer
as $$
  select count(*) from waitlist;
$$;

-- Function to increment recitation plays
create or replace function increment_plays(recitation_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update recitations
  set plays = plays + 1
  where id = recitation_id;
end;
$$;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute procedure update_updated_at_column();

create trigger update_recitations_updated_at
  before update on recitations
  for each row
  execute procedure update_updated_at_column();

-- ============================================
-- DONE! 
-- Copy this entire file and run it in Supabase SQL Editor
-- ============================================
