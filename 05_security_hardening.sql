-- MortaLeague: additive permission hardening.
-- Run only after 01_profiles_auth.sql, 02_direct_messages.sql and 03_social_community.sql.
-- Safe to rerun. This migration does not modify user rows or delete any data.

begin;

-- Direct-message contents and block records must never be granted to PUBLIC/anon.
-- Authenticated users retain the explicit column/table privileges from migration 02;
-- row-level security still limits each user to conversations they participate in.
revoke all on table public.dm_blocks, public.dm_conversations, public.dm_messages
  from public, anon;

-- These records are private by design. Signed-in permissions are preserved.
revoke all on table public.notifications, public.content_reports, public.admin_audit_log
  from public, anon;

-- The admin predicate is only needed by authenticated RLS policies and admin RPCs.
-- Revoking anon/PUBLIC execution reduces unnecessary exposure of the admin check.
revoke all on function public.is_mortaleague_admin() from public, anon;
grant execute on function public.is_mortaleague_admin() to authenticated;

-- This is an auth.users INSERT trigger function; clients should not invoke it directly.
revoke all on function public.handle_new_mortaleague_user() from public, anon, authenticated;

commit;
