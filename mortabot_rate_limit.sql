-- MortaBot request limits. Run once in Supabase SQL Editor before enabling public access.
-- Limits are enforced by a SECURITY DEFINER RPC that only service_role can call.
create table if not exists public.mortabot_usage_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists mortabot_usage_log_user_time_idx
  on public.mortabot_usage_log (user_id, created_at desc);
alter table public.mortabot_usage_log enable row level security;
revoke all on table public.mortabot_usage_log from public, anon, authenticated;
grant all on table public.mortabot_usage_log to service_role;

create or replace function public.mortabot_allow_request(
  p_user_id uuid,
  p_minute_limit integer default 12,
  p_daily_limit integer default 100
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  minute_count integer;
  daily_count integer;
begin
  if p_user_id is null or p_minute_limit < 1 or p_minute_limit > 30
     or p_daily_limit < 1 or p_daily_limit > 200 then
    return false;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  delete from public.mortabot_usage_log
    where created_at < pg_catalog.now() - interval '7 days';
  select
    count(*) filter (where created_at >= pg_catalog.now() - interval '1 minute'),
    count(*) filter (where created_at >= pg_catalog.now() - interval '24 hours')
  into minute_count, daily_count
  from public.mortabot_usage_log
  where user_id = p_user_id;
  if minute_count >= p_minute_limit or daily_count >= p_daily_limit then
    return false;
  end if;
  insert into public.mortabot_usage_log (user_id, created_at)
    values (p_user_id, pg_catalog.now());
  return true;
end;
$$;
revoke all on function public.mortabot_allow_request(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.mortabot_allow_request(uuid, integer, integer) to service_role;
