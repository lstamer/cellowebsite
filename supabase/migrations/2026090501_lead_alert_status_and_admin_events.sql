-- Plan 007, Phase 1: the booking pipeline stops depending on Attio.
--
-- Supabase becomes the gate for every website enquiry (no row, no success
-- response) and the Telegram alert becomes best-effort BUT never silently
-- lost: each lead carries an alert state machine that a scheduled task retries,
-- and every integration failure lands in one central `admin_events` log that
-- the admin console reads. Until now a failed alert only reached
-- `console.error`, which nobody reads.

-- ---------------------------------------------------------------------------
-- 1. Lead alert state
-- ---------------------------------------------------------------------------

-- Guarded so the legacy backfill runs exactly once: a second run of this file
-- must not flip genuinely pending rows to 'skipped'.
do $$
begin
  if not exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'inquiry_website_leads'
       and column_name = 'alert_status'
  ) then
    alter table public.inquiry_website_leads
      add column alert_status text not null default 'pending' check (
        alert_status in ('pending', 'sending', 'sent', 'failed', 'skipped')
      ),
      add column alert_error text,
      add column alert_attempts integer not null default 0,
      add column alert_started_at timestamptz,
      add column alert_sent_at timestamptz;

    -- Rows that pre-date tracking: a stored card id proves the alert landed;
    -- anything else was alerted (or not) by code that never recorded the
    -- outcome, so it is marked skipped rather than re-alerted days later.
    update public.inquiry_website_leads
       set alert_status = case when telegram_message_id is not null then 'sent' else 'skipped' end,
           alert_sent_at = case when telegram_message_id is not null then created_at else null end,
           alert_error = case when telegram_message_id is null then 'Pre-dates alert tracking' else null end
     where alert_status = 'pending';
  end if;
end;
$$;

-- The visitor's per-tab analytics session (see 2026090502), so the CRM can
-- show the path a lead took through the site. Random, cookieless, no PII.
alter table public.inquiry_website_leads
  add column if not exists session_id text;

-- The retry sweep asks "which alerts still need sending?" every few minutes.
create index if not exists inquiry_website_leads_alert_retry_idx
  on public.inquiry_website_leads(created_at)
  where alert_status in ('pending', 'sending', 'failed');

-- ---------------------------------------------------------------------------
-- 2. Central event log
-- ---------------------------------------------------------------------------

create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warning', 'error')),
  -- Which integration or subsystem raised it.
  source text not null check (
    source in ('supabase', 'telegram', 'zernio', 'ai', 'trigger', 'health', 'admin', 'beacon', 'email', 'auth')
  ),
  -- Machine-readable kind, e.g. 'lead_alert_failed', 'lead_persist_failed'.
  kind text not null check (btrim(kind) <> ''),
  message text not null,
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  entity_type text,
  entity_id text,
  acknowledged_at timestamptz,
  acknowledged_by text,
  created_at timestamptz not null default now()
);

alter table public.admin_events enable row level security;

create index if not exists admin_events_created_idx
  on public.admin_events(created_at desc);

-- The console's default view and the dashboard's "needs attention" count.
create index if not exists admin_events_open_idx
  on public.admin_events(level, created_at desc)
  where acknowledged_at is null;

create index if not exists admin_events_entity_idx
  on public.admin_events(entity_type, entity_id)
  where entity_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Alert claim / complete / fail
--
-- The same claim pattern the review notification uses: a claim moves the row
-- to 'sending' and bumps the attempt counter, so a retry that races the
-- original request cannot post a second card.
-- ---------------------------------------------------------------------------

-- Everything the card renderer needs, in one shape shared by the request path
-- and the retry task.
create or replace function public.render_website_lead_alert_row(
  p_lead public.inquiry_website_leads
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'leadId', p_lead.id,
    'source', p_lead.source,
    'firstName', p_lead.first_name,
    'lastName', p_lead.last_name,
    'email', p_lead.email,
    'phone', p_lead.phone,
    'whatsapp', p_lead.whatsapp,
    'whatsappDigits', p_lead.whatsapp_digits,
    'contactPreference', p_lead.contact_preference,
    'eventType', p_lead.event_type,
    'eventDateText', p_lead.event_date_text,
    'location', p_lead.location,
    'guestCount', p_lead.guest_count,
    'performanceMinutes', p_lead.performance_minutes,
    'bookerRole', p_lead.booker_role,
    'message', p_lead.message,
    'alertAttempts', p_lead.alert_attempts,
    'createdAt', p_lead.created_at
  );
$$;

create or replace function public.claim_website_lead_alert(p_lead_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.inquiry_website_leads;
begin
  update public.inquiry_website_leads lead
     set alert_status = 'sending',
         alert_attempts = lead.alert_attempts + 1,
         alert_started_at = now(),
         updated_at = now()
   where lead.id = p_lead_id
     and (
       lead.alert_status in ('pending', 'failed')
       -- A worker that died mid-send leaves 'sending' behind; after five
       -- minutes it is reclaimable.
       or (lead.alert_status = 'sending' and lead.alert_started_at < now() - interval '5 minutes')
     )
  returning lead.* into v_lead;

  if v_lead.id is null then
    select lead.* into v_lead
      from public.inquiry_website_leads lead
     where lead.id = p_lead_id;

    return jsonb_build_object(
      'claimed', false,
      'status', v_lead.alert_status
    );
  end if;

  return jsonb_build_object('claimed', true, 'status', 'sending')
    || public.render_website_lead_alert_row(v_lead);
end;
$$;

-- The retry sweep: claim a batch of alerts that still need sending. Capped at
-- five attempts and seven days so an unreachable Telegram cannot spin forever;
-- beyond that the task raises a needs-attention event instead.
create or replace function public.claim_pending_website_lead_alerts(
  p_limit integer default 20,
  p_max_attempts integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_rows jsonb;
begin
  with candidates as (
    select lead.id
      from public.inquiry_website_leads lead
     where lead.created_at > now() - interval '7 days'
       and lead.alert_attempts < p_max_attempts
       and (
         lead.alert_status in ('pending', 'failed')
         or (lead.alert_status = 'sending' and lead.alert_started_at < now() - interval '5 minutes')
       )
       -- Give the request path's own in-flight send a minute before retrying.
       and lead.created_at < now() - interval '1 minute'
     order by lead.created_at
     limit greatest(p_limit, 1)
     for update skip locked
  ), claimed as (
    update public.inquiry_website_leads lead
       set alert_status = 'sending',
           alert_attempts = lead.alert_attempts + 1,
           alert_started_at = now(),
           updated_at = now()
      from candidates
     where lead.id = candidates.id
    returning lead.id
  )
  select coalesce(array_agg(claimed.id), '{}'::uuid[])
    into v_ids
    from claimed;

  -- Read back as a second statement so the rendered rows carry the bumped
  -- attempt counter (a data-modifying CTE is invisible to its own outer query).
  select coalesce(
           jsonb_agg(public.render_website_lead_alert_row(lead) order by lead.created_at),
           '[]'::jsonb
         )
    into v_rows
    from public.inquiry_website_leads lead
   where lead.id = any(v_ids);

  return v_rows;
end;
$$;

-- Same signature as before so existing callers keep working; now also closes
-- the alert state.
create or replace function public.complete_website_lead_alert(
  p_lead_id uuid,
  p_telegram_chat_id text,
  p_telegram_message_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inquiry_website_leads
     set telegram_chat_id = p_telegram_chat_id::bigint,
         telegram_message_id = p_telegram_message_id,
         alert_status = 'sent',
         alert_error = null,
         alert_sent_at = coalesce(alert_sent_at, now()),
         updated_at = now()
   where id = p_lead_id;
end;
$$;

create or replace function public.fail_website_lead_alert(
  p_lead_id uuid,
  p_error text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer;
begin
  update public.inquiry_website_leads
     set alert_status = 'failed',
         alert_error = left(coalesce(p_error, 'Unknown error'), 2000),
         updated_at = now()
   where id = p_lead_id
     -- A card that landed between the claim and this failure report wins.
     and alert_status <> 'sent'
  returning alert_attempts into v_attempts;

  return jsonb_build_object('attempts', coalesce(v_attempts, 0));
end;
$$;

-- Luke can stop retrying from the admin (e.g. a test submission).
create or replace function public.skip_website_lead_alert(
  p_lead_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inquiry_website_leads
     set alert_status = 'skipped',
         alert_error = left(coalesce(p_reason, 'Skipped from admin'), 2000),
         updated_at = now()
   where id = p_lead_id
     and alert_status <> 'sent';
end;
$$;
