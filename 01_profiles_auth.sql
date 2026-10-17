-- MortaLeague — profiles + signup trigger + RLS
-- Run this script in the SQL Editor of the Supabase project.
-- The username-only browser login maps each username to username@accounts.mortaleague.invalid.
-- In Supabase Auth settings, turn OFF email confirmation because this internal address is not deliverable.
-- Safe to rerun for the objects defined here.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default 'MortaLeague Player' check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 240),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists profiles_display_name_idx on public.profiles (lower(display_name));

alter table public.profiles enable row level security;

-- Keep the browser-facing roles least-privileged.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_url, updated_at)
  on table public.profiles to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Players can update their own profile" on public.profiles;
create policy "Players can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

create or replace function public.handle_new_mortaleague_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_username text;
  candidate_display_name text;
begin
  candidate_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_]', '', 'g'
  ));

  if char_length(candidate_username) < 3 then
    candidate_username := 'player_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  candidate_username := substr(candidate_username, 1, 20);

  candidate_display_name := left(
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), candidate_username),
    40
  );

  -- Do not silently rename a requested username when it is already taken.
  -- A duplicate username should make the signup transaction fail.
  insert into public.profiles (id, username, display_name)
  values (new.id, candidate_username, candidate_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_mortaleague on auth.users;
create trigger on_auth_user_created_mortaleague
after insert on auth.users
for each row execute function public.handle_new_mortaleague_user();

commit;

-- Security notes:
-- 1. NEVER expose the Supabase service_role/secret key to the browser.
-- 2. Public profile SELECT exposes only columns in this table; never add email or secrets here.
-- 3. RLS keeps profile UPDATE restricted to auth.uid() = id.
-- 4. Admin roles and the 16 gameplay-system tables will be designed in later phases.
