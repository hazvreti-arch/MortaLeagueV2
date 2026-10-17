-- MortaLeague profile enhancements + private realtime channel authorization.
-- Run in Supabase SQL Editor AFTER 01_profiles_auth.sql, 02_direct_messages.sql and 03_social_community.sql.
-- Safe to rerun. Never paste a service_role key into browser code.

begin;

-- Rich public profiles: the cover image is an HTTPS URL, not an uploaded private object.
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles drop constraint if exists profiles_cover_url_https_check;
alter table public.profiles add constraint profiles_cover_url_https_check
  check (cover_url is null or cover_url ~* '^https://');
grant select (cover_url) on public.profiles to anon, authenticated;
grant update (cover_url) on public.profiles to authenticated;

-- Follow graph indexes support profile stats, discovery sorting and follower feeds.
create index if not exists user_follows_follower_created_idx
  on public.user_follows (follower_id, created_at desc);
create index if not exists user_follows_following_created_idx
  on public.user_follows (following_id, created_at desc);

-- Live chat uses a PRIVATE Realtime channel per conversation. Only authenticated
-- participants in the matching dm_conversations row can join it. This covers
-- presence (online status) and transient typing broadcasts; actual messages remain
-- protected by dm_messages RLS and are never stored in the Realtime broadcast table.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    execute 'drop policy if exists "MortaLeague DM participants use private realtime" on realtime.messages';
    execute $policy$
      create policy "MortaLeague DM participants use private realtime"
      on realtime.messages
      for all
      to authenticated
      using (
        realtime.topic() ~ '^mortaleague-dm-[0-9a-fA-F-]{36}$'
        and exists (
          select 1
          from public.dm_conversations c
          where c.id = substring(realtime.topic() from '^mortaleague-dm-([0-9a-fA-F-]{36})$')::uuid
            and (c.user_one = auth.uid() or c.user_two = auth.uid())
            and not public.is_direct_message_blocked(
              case when c.user_one = auth.uid() then c.user_two else c.user_one end
            )
        )
      )
      with check (
        realtime.topic() ~ '^mortaleague-dm-[0-9a-fA-F-]{36}$'
        and exists (
          select 1
          from public.dm_conversations c
          where c.id = substring(realtime.topic() from '^mortaleague-dm-([0-9a-fA-F-]{36})$')::uuid
            and (c.user_one = auth.uid() or c.user_two = auth.uid())
            and not public.is_direct_message_blocked(
              case when c.user_one = auth.uid() then c.user_two else c.user_one end
            )
        )
      )
    $policy$;
  end if;
end $$;

commit;
