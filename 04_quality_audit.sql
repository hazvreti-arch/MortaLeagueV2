-- MortaLeague read-only quality/security audit.
-- Run this in Supabase SQL Editor AFTER 01_profiles_auth.sql, 02_direct_messages.sql, 03_social_community.sql
-- and 05_security_hardening.sql.
-- This script contains SELECT statements only; it does not modify data or policies.

-- 1) Verify RLS is enabled on every app-owned private/public application table.
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles','announcements','dm_blocks','dm_conversations','dm_messages',
    'posts','post_comments','post_likes','user_follows','notifications',
    'achievement_catalog','user_achievements','content_reports','admin_audit_log'
  )
order by c.relname;

-- 2) Review the actual active row-level policies, including USING and WITH CHECK.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles','announcements','dm_blocks','dm_conversations','dm_messages',
    'posts','post_comments','post_likes','user_follows','notifications',
    'achievement_catalog','user_achievements','content_reports','admin_audit_log'
  )
order by tablename, cmd, policyname;

-- 3) Check public/authenticated table privileges on sensitive tables.
select table_name,
       has_table_privilege('anon', format('public.%I', table_name), 'SELECT') as anon_can_select,
       has_table_privilege('anon', format('public.%I', table_name), 'INSERT') as anon_can_insert,
       has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') as signed_in_can_select,
       has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT') as signed_in_can_insert,
       has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE') as signed_in_can_delete
from (values
  ('profiles'),('announcements'),('dm_blocks'),('dm_conversations'),('dm_messages'),
  ('posts'),('post_comments'),('post_likes'),('user_follows'),('notifications'),
  ('achievement_catalog'),('user_achievements'),('content_reports'),('admin_audit_log')
) as t(table_name)
where to_regclass(format('public.%I', table_name)) is not null
order by table_name;

-- 4) Verify the @emir profile is present and already has the expected role.
-- This is read-only. It deliberately does not promote accounts by username.
select username, role, is_suspended, created_at
from public.profiles
where lower(username) = 'emir';

-- 5) Review SECURITY DEFINER RPCs and whether they lock search_path.
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '), '') as function_config,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as signed_in_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_mortaleague_admin','is_mortaleague_suspended','is_direct_message_blocked',
    'can_direct_message','create_direct_conversation','admin_set_profile_suspension',
    'admin_get_reported_message','admin_remove_reported_message'
  )
order by p.proname;
