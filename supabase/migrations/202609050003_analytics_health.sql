-- Phase 3 of plans/007: first-party, cookieless visitor analytics and site
-- health history.
--
-- Privacy posture: no IP address, no full user agent, no cookie. A visit is a
-- path plus a random per-tab session id (sessionStorage), a coarse device
-- class, the referrer host and UTM tags, and the country Vercel already
-- derives at the edge. A lead row can carry the same session id so the CRM
-- can show the path that led to an enquiry.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 8 and 64),
  path text not null check (char_length(path) <= 512),
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop')),
  country text,
  viewport_width integer,
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
create index if not exists site_visits_session_idx on public.site_visits (session_id, created_at);
create index if not exists site_visits_path_idx on public.site_visits (path, created_at desc);

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 8 and 64),
  name text not null check (char_length(name) between 1 and 64),
  path text check (char_length(path) <= 512),
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_idx on public.site_events (created_at desc);
create index if not exists site_events_name_idx on public.site_events (name, created_at desc);
create index if not exists site_events_session_idx on public.site_events (session_id, created_at);

create table if not exists public.health_checks (
  id uuid primary key default gen_random_uuid(),
  target text not null check (char_length(target) between 1 and 64),
  ok boolean not null,
  status_code integer,
  latency_ms integer,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists health_checks_target_idx on public.health_checks (target, created_at desc);
create index if not exists health_checks_created_idx on public.health_checks (created_at desc);

alter table public.site_visits enable row level security;
alter table public.site_events enable row level security;
alter table public.health_checks enable row level security;

revoke all on table public.site_visits from anon, authenticated;
revoke all on table public.site_events from anon, authenticated;
revoke all on table public.health_checks from anon, authenticated;
grant all on table public.site_visits to service_role;
grant all on table public.site_events to service_role;
grant all on table public.health_checks to service_role;

-- Daily rollups the analytics page reads in one query each.
create or replace view public.admin_daily_visits_v as
  select
    (created_at at time zone 'Africa/Johannesburg')::date as day,
    count(*)::integer as views,
    count(distinct session_id)::integer as sessions
  from public.site_visits
  where created_at > now() - interval '90 days'
  group by 1
  order by 1;

create or replace view public.admin_top_paths_v as
  select
    path,
    count(*)::integer as views,
    count(distinct session_id)::integer as sessions
  from public.site_visits
  where created_at > now() - interval '30 days'
  group by path
  order by views desc
  limit 50;

create or replace view public.admin_top_referrers_v as
  select
    coalesce(referrer_host, '(direct)') as referrer_host,
    count(distinct session_id)::integer as sessions
  from public.site_visits
  where created_at > now() - interval '30 days'
  group by 1
  order by sessions desc
  limit 30;

-- Uptime per target over the trailing day and week.
create or replace view public.admin_health_summary_v as
  select
    target,
    (select ok from public.health_checks h2 where h2.target = h.target order by created_at desc limit 1) as current_ok,
    (select latency_ms from public.health_checks h2 where h2.target = h.target order by created_at desc limit 1) as current_latency_ms,
    (select detail from public.health_checks h2 where h2.target = h.target order by created_at desc limit 1) as current_detail,
    (select created_at from public.health_checks h2 where h2.target = h.target order by created_at desc limit 1) as checked_at,
    round(100.0 * avg(case when ok then 1 else 0 end) filter (where created_at > now() - interval '24 hours'), 2) as uptime_24h,
    round(100.0 * avg(case when ok then 1 else 0 end) filter (where created_at > now() - interval '7 days'), 2) as uptime_7d,
    round(avg(latency_ms) filter (where ok and created_at > now() - interval '24 hours')) as avg_latency_24h
  from public.health_checks h
  where created_at > now() - interval '7 days'
  group by target;

-- Keep the tables small: a scheduled task calls this.
create or replace function public.prune_analytics_and_health(
  p_visit_days integer default 180,
  p_health_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visits integer;
  v_events integer;
  v_health integer;
begin
  delete from public.site_visits where created_at < now() - make_interval(days => p_visit_days);
  get diagnostics v_visits = row_count;
  delete from public.site_events where created_at < now() - make_interval(days => p_visit_days);
  get diagnostics v_events = row_count;
  delete from public.health_checks where created_at < now() - make_interval(days => p_health_days);
  get diagnostics v_health = row_count;
  return jsonb_build_object('visits', v_visits, 'events', v_events, 'health', v_health);
end;
$$;

revoke all on public.admin_daily_visits_v from anon, authenticated;
revoke all on public.admin_top_paths_v from anon, authenticated;
revoke all on public.admin_top_referrers_v from anon, authenticated;
revoke all on public.admin_health_summary_v from anon, authenticated;
revoke all on function public.prune_analytics_and_health from public, anon, authenticated;
grant select on public.admin_daily_visits_v to service_role;
grant select on public.admin_top_paths_v to service_role;
grant select on public.admin_top_referrers_v to service_role;
grant select on public.admin_health_summary_v to service_role;
grant execute on function public.prune_analytics_and_health to service_role;
