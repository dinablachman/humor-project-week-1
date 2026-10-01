-- Profiles, auth trigger, and avatar storage.
-- Safe to run more than once: every statement is idempotent.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).

-- 1. profiles table -----------------------------------------------------------
-- One row per auth.users row. first_name and last_name are nullable on purpose:
-- the app prompts the user to fill them in after their first login.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  favorite_movie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for each user in auth.users.';
comment on column public.profiles.avatar_url is 'Full URL to the avatar image. Binary data lives in Storage, never in this table.';

-- Keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 2. auth.users trigger --------------------------------------------------------
-- Runs after Supabase Auth inserts a new user (first Google sign-in, for example)
-- and creates the matching profiles row. security definer lets the function
-- write to public.profiles even though the auth schema fires it.
-- The Google avatar is copied over as a starting point; names are left null so
-- the onboarding prompt appears.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profiles for any users that signed up before this trigger existed.
insert into public.profiles (id, email, avatar_url)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do nothing;

-- 3. Row level security --------------------------------------------------------
-- The assignment allows RLS to stay off. It is turned on here with policies that
-- let a signed-in user read and edit only their own row, which is the behaviour
-- the app expects. The trigger above bypasses RLS because it is security definer.

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 4. Avatar storage ------------------------------------------------------------
-- Images go to a public Storage bucket; the database only stores the URL.
-- Files are stored under <user id>/<file name>, and the policies below use that
-- first folder segment to tie each object to its owner.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can replace their own avatar" on storage.objects;
create policy "Users can replace their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
