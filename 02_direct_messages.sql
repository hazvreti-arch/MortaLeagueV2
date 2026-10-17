-- MortaLeague Direct Messages — additive migration
-- Run this file in Supabase SQL Editor AFTER 01_profiles_auth.sql.
-- Only conversation participants can read messages. Clients never receive service_role credentials.

begin;

create table if not exists public.dm_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint dm_blocks_no_self_block check (blocker_id <> blocked_id)
);

create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_one uuid not null references auth.users(id) on delete cascade,
  user_two uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default '',
  last_message_sender_id uuid references auth.users(id) on delete set null,
  constraint dm_conversations_two_different_users check (user_one < user_two),
  constraint dm_conversations_unique_pair unique (user_one, user_two)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists dm_conversations_user_one_idx on public.dm_conversations (user_one, last_message_at desc);
create index if not exists dm_conversations_user_two_idx on public.dm_conversations (user_two, last_message_at desc);
create index if not exists dm_messages_conversation_created_idx on public.dm_messages (conversation_id, created_at asc);
create index if not exists dm_messages_unread_idx on public.dm_messages (conversation_id, read_at) where read_at is null;

alter table public.dm_blocks enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_messages enable row level security;

revoke all on table public.dm_blocks from anon, authenticated;
revoke all on table public.dm_conversations from anon, authenticated;
revoke all on table public.dm_messages from anon, authenticated;
grant select, insert, delete on table public.dm_blocks to authenticated;
grant select on table public.dm_conversations to authenticated;
grant select on table public.dm_messages to authenticated;
grant insert (conversation_id, sender_id, body) on table public.dm_messages to authenticated;
grant update (read_at) on table public.dm_messages to authenticated;

create or replace function public.is_direct_message_blocked(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dm_blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = auth.uid())
  );
$$;
revoke all on function public.is_direct_message_blocked(uuid) from public;
grant execute on function public.is_direct_message_blocked(uuid) to authenticated;

create or replace function public.can_direct_message(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and target_user_id is not null
     and target_user_id <> auth.uid()
     and exists (select 1 from public.profiles p where p.id = target_user_id)
     and not public.is_direct_message_blocked(target_user_id);
$$;
revoke all on function public.can_direct_message(uuid) from public;
grant execute on function public.can_direct_message(uuid) to authenticated;

create or replace function public.create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_me is null then
    raise exception 'Giriş yapman gerekiyor.' using errcode = '28000';
  end if;
  if target_user_id is null or target_user_id = v_me then
    raise exception 'Kendinle sohbet başlatamazsın.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target_user_id) then
    raise exception 'Bu oyuncu bulunamadı.' using errcode = 'P0002';
  end if;
  if public.is_direct_message_blocked(target_user_id) then
    raise exception 'Bu oyuncuyla yeni bir sohbet başlatılamıyor. Engelleme durumunu kontrol edin.' using errcode = '42501';
  end if;
  insert into public.dm_conversations as existing (user_one, user_two)
  values (least(v_me, target_user_id), greatest(v_me, target_user_id))
  on conflict (user_one, user_two) do update
    set last_message_at = existing.last_message_at
  returning id into v_conversation_id;
  return v_conversation_id;
end;
$$;
revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create or replace function public.update_dm_conversation_preview()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dm_conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 180),
         last_message_sender_id = new.sender_id
   where id = new.conversation_id;
  return new;
end;
$$;
revoke all on function public.update_dm_conversation_preview() from public;
drop trigger if exists dm_message_updates_conversation on public.dm_messages;
create trigger dm_message_updates_conversation
after insert on public.dm_messages
for each row execute function public.update_dm_conversation_preview();

-- Blocks: a user may only view/manage blocks they initiated.
drop policy if exists "Users view own message blocks" on public.dm_blocks;
create policy "Users view own message blocks" on public.dm_blocks
  for select to authenticated using (blocker_id = auth.uid());
drop policy if exists "Users block other players" on public.dm_blocks;
create policy "Users block other players" on public.dm_blocks
  for insert to authenticated with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
drop policy if exists "Users remove own message blocks" on public.dm_blocks;
create policy "Users remove own message blocks" on public.dm_blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- Conversation and message access is restricted to its two participants.
drop policy if exists "Participants read direct conversations" on public.dm_conversations;
create policy "Participants read direct conversations" on public.dm_conversations
  for select to authenticated using (user_one = auth.uid() or user_two = auth.uid());
drop policy if exists "Participants read direct messages" on public.dm_messages;
create policy "Participants read direct messages" on public.dm_messages
  for select to authenticated using (
    exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id and (c.user_one = auth.uid() or c.user_two = auth.uid())
    )
  );
drop policy if exists "Users send direct messages when unblocked" on public.dm_messages;
create policy "Users send direct messages when unblocked" on public.dm_messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id
        and (c.user_one = auth.uid() or c.user_two = auth.uid())
        and not public.is_direct_message_blocked(case when c.user_one = auth.uid() then c.user_two else c.user_one end)
    )
  );
drop policy if exists "Recipients mark direct messages read" on public.dm_messages;
create policy "Recipients mark direct messages read" on public.dm_messages
  for update to authenticated using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id and (c.user_one = auth.uid() or c.user_two = auth.uid())
    )
  ) with check (
    sender_id <> auth.uid() and read_at is not null
    and exists (
      select 1 from public.dm_conversations c
      where c.id = conversation_id and (c.user_one = auth.uid() or c.user_two = auth.uid())
    )
  );

-- Enable live message events where Supabase Realtime is available; UI also refreshes periodically.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_messages'
     ) then
    execute 'alter publication supabase_realtime add table public.dm_messages';
  end if;
end $$;

commit;
