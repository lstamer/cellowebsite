-- All reads/writes to these tables use the verified server-side service role.
-- RLS remains enabled as a second boundary; public client roles need no grants.
begin;
alter table public.site_visits enable row level security;
alter table public.site_events enable row level security;
alter table public.admin_events enable row level security;
revoke all on table public.site_visits, public.site_events, public.admin_events from anon, authenticated;
commit;
