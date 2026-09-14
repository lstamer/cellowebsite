-- Phase 0/1 of plans/007: a central operational event log, and durable
-- delivery tracking for the Telegram lead alert.
--
-- Before this migration the lead alert was fire-and-forget: a Telegram outage
-- cost Luke the notification and the only trace was a console.error in Vercel
-- logs. Now the lead row carries an alert_status, a claim/complete/fail trio
-- makes retries idempotent, and every failure lands in admin_events where the
-- admin console can show it.

-- 1. Central event log -------------------------------------------------------

create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warn', 'error')),
  -- Which integration or subsystem raised it.
  source text not null check (
    source in (
      'telegram', 'zernio', 'supabase', 'ai', 'trigger', 'email', 'webhook',
      'health', 'admin', 'analytics', 'site'
    )
  ),
  -- Short machine-readable kind, e.g. 'lead_alert_failed'.
  kind text not null check (btrim(kind) <> ''),
  message text not null check (btrim(message) <> ''),
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  lead_id uuid references public.inquiry_website_leads(id) on delete set null,
  conversation_id uuid references public.inquiry_conversations(id) on delete set null,
  acknowledged_at timestamptz,
  acknowledged_by text,
  created_at timestamptz not null default now()
);

create index if not exists admin_events_created_idx
  on public.admin_events(created_at desc);

create index if not exists admin_events_open_idx
  on public.admin_events(level, created_at desc)
  where acknowledged_at is null;

create index if not exists admin_events_lead_idx
  on public.admin_events(lead_id)
  where lead_id is not null;

alter table public.admin_events enable row level security;

-- 2. Lead alert delivery tracking -------------------------------------------

alter table public.inquiry_website_leads
  add column if not exists alert_status text not null default 'pending';

alter table public.inquiry_website_leads
  drop constraint if exists inquiry_website_leads_alert_status_check;

alter table public.inquiry_website_leads
  add constraint inquiry_website_leads_alert_status_check
  check (alert_status in ('pending', 'sending', 'sent', 'failed', 'skipped'));

alter table public.inquiry_website_leads
  add column if not exists alert_error text;

alter table public.inquiry_website_leads
  add column if not exists alert_attempts integer not null default 0;

alter table public.inquiry_website_leads
  add column if not exists alert_started_at timestamptz;

alter table public.inquiry_website_leads
  add column if not exists alert_sent_at timestamptz;

-- Cookieless analytics session that submitted the form (plans/007 §3.6).
alter table public.inquiry_website_leads
  add column if not exists session_id text;

-- Rows that predate alert tracking: a card id means the alert went out;
-- anything else is marked skipped so the retry sweep never resurrects an old
-- enquiry as a fresh Telegram ping.
update public.inquiry_website_leads
  set alert_status = 'sent', alert_sent_at = coalesce(alert_sent_at, created_at)
  where telegram_message_id is not null and alert_status = 'pending';

update public.inquiry_website_leads
  set alert_status = 'skipped'
  where telegram_message_id is null
    and alert_status = 'pending'
    and created_at < now() - interval '1 hour';

create index if not exists inquiry_website_leads_alert_retry_idx
  on public.inquiry_website_leads(created_at)
  where alert_status in ('pending', 'failed', 'sending');

-- Compare-and-set claim. Only one worker (the request itself, or the retry
-- sweep) can hold the alert at a time; a worker that dies mid-send leaves the
-- row in 'sending', which the sweep reclaims after a grace period.
create or replace function public.claim_website_lead_alert(
  p_lead_id uuid,
  p_max_attempts integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean;
begin
  update public.inquiry_website_leads
    set
      alert_status = 'sending',
      alert_started_at = now(),
      alert_attempts = alert_attempts + 1,
      updated_at = now()
    where id = p_lead_id
      and telegram_message_id is null
      and alert_attempts < p_max_attempts
      and (
        alert_status in ('pending', 'failed')
        or (alert_status = 'sending' and alert_started_at < now() - interval '10 minutes')
      )
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

-- Same signature as before so existing callers keep working; now also closes
-- the delivery state.
create or replace function public.complete_website_lead_alert(
  p_lead_id uuid,
  p_telegram_chat_id bigint,
  p_telegram_message_id bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_website_leads
    set
      telegram_chat_id = p_telegram_chat_id,
      telegram_message_id = p_telegram_message_id,
      alert_status = 'sent',
      alert_sent_at = now(),
      alert_error = null,
      updated_at = now()
    where id = p_lead_id
      and telegram_message_id is null;
$$;

create or replace function public.fail_website_lead_alert(
  p_lead_id uuid,
  p_error text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_website_leads
    set
      alert_status = 'failed',
      alert_error = left(coalesce(p_error, 'Unknown error'), 2000),
      updated_at = now()
    where id = p_lead_id
      and telegram_message_id is null;
$$;

-- Leads the sweep should look at. 'pending' rows younger than two minutes are
-- probably still being handled by the request that created them, so they are
-- left alone. Anything older than a day is not worth a surprise ping.
create or replace function public.list_website_leads_needing_alert(
  p_limit integer default 20,
  p_max_attempts integer default 5
)
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.inquiry_website_leads
  where telegram_message_id is null
    and alert_attempts < p_max_attempts
    and created_at > now() - interval '24 hours'
    and (
      alert_status = 'failed'
      or (alert_status = 'pending' and created_at < now() - interval '2 minutes')
      or (alert_status = 'sending' and alert_started_at < now() - interval '10 minutes')
    )
  order by created_at
  limit greatest(p_limit, 1);
$$;
