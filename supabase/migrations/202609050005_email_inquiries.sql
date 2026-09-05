-- Phase 5 of plans/007: email enquiries from Luke's Google Workspace inbox.
--
-- A scheduled task polls Gmail, stores each new thread and message here,
-- classifies inbound mail as an enquiry or not, links the sender to a person
-- by email, and alerts Telegram for enquiries. Nothing is ever sent from here.

create table if not exists public.inquiry_email_threads (
  id uuid primary key default gen_random_uuid(),
  gmail_thread_id text not null unique,
  subject text,
  from_email text,
  from_name text,
  person_id uuid references public.inquiry_people(id) on delete set null,
  classification text not null default 'unknown' check (
    classification in ('inquiry', 'not_inquiry', 'unknown')
  ),
  summary text,
  event_type text,
  event_date_text text,
  location text,
  status text not null default 'new' check (
    status in ('new', 'alerted', 'replied', 'dismissed')
  ),
  telegram_chat_id bigint,
  telegram_message_id bigint,
  alert_error text,
  first_message_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiry_email_threads_recent_idx
  on public.inquiry_email_threads (last_message_at desc);

create index if not exists inquiry_email_threads_person_idx
  on public.inquiry_email_threads (person_id)
  where person_id is not null;

create table if not exists public.inquiry_email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.inquiry_email_threads(id) on delete cascade,
  gmail_message_id text not null unique,
  direction text not null check (direction in ('incoming', 'outgoing')),
  from_email text,
  from_name text,
  to_email text,
  subject text,
  body_text text,
  snippet text,
  received_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_email_messages_thread_idx
  on public.inquiry_email_messages (thread_id, received_at);

-- One row: where the poller got to.
create table if not exists public.email_sync_state (
  id integer primary key default 1 check (id = 1),
  last_synced_at timestamptz,
  last_history_id text,
  last_error text,
  updated_at timestamptz not null default now()
);

insert into public.email_sync_state (id) values (1) on conflict (id) do nothing;

alter table public.inquiry_email_threads enable row level security;
alter table public.inquiry_email_messages enable row level security;
alter table public.email_sync_state enable row level security;

revoke all on table public.inquiry_email_threads from anon, authenticated;
revoke all on table public.inquiry_email_messages from anon, authenticated;
revoke all on table public.email_sync_state from anon, authenticated;
grant all on table public.inquiry_email_threads to service_role;
grant all on table public.inquiry_email_messages to service_role;
grant all on table public.email_sync_state to service_role;

-- Email enquiries join the unified list.
-- A view with the same name but different columns cannot be replaced in place.
drop view if exists public.admin_inquiries_v;
create or replace view public.admin_inquiries_v as
  select
    'website'::text as channel,
    l.id,
    l.created_at,
    l.updated_at as last_activity_at,
    l.source as origin,
    nullif(btrim(concat_ws(' ', l.first_name, coalesce(l.last_name, ''))), '') as contact_name,
    l.email,
    coalesce(l.whatsapp, l.phone) as phone,
    l.event_type,
    l.event_date_iso,
    l.event_date_text,
    l.location,
    l.guest_count,
    l.status,
    l.availability,
    l.alert_status,
    l.person_id,
    null::uuid as conversation_id,
    null::text as primary_intent,
    null::text as summary,
    coalesce(l.message, '') as preview
  from public.inquiry_website_leads l
  union all
  select
    'whatsapp'::text as channel,
    i.id,
    i.created_at,
    coalesce(c.last_inbound_at, i.updated_at) as last_activity_at,
    i.source as origin,
    coalesce(
      i.latest_analysis -> 'event' ->> 'contact_name',
      ct.display_name,
      p.display_name
    ) as contact_name,
    p.email,
    coalesce(ct.phone_e164, p.phone_e164) as phone,
    i.latest_analysis -> 'event' ->> 'event_type' as event_type,
    case
      when (i.latest_analysis -> 'event' ->> 'event_date_iso') ~ '^\d{4}-\d{2}-\d{2}$'
        then (i.latest_analysis -> 'event' ->> 'event_date_iso')::date
      else null
    end as event_date_iso,
    i.latest_analysis -> 'event' ->> 'event_date_text' as event_date_text,
    coalesce(
      i.latest_analysis -> 'event' ->> 'venue',
      i.latest_analysis -> 'event' ->> 'location'
    ) as location,
    (i.latest_analysis -> 'event' ->> 'guest_count')::integer as guest_count,
    i.status,
    null::text as availability,
    null::text as alert_status,
    ct.person_id,
    i.conversation_id,
    i.primary_intent,
    i.latest_analysis ->> 'summary' as summary,
    coalesce(
      (
        select m.body
        from public.inquiry_messages m
        where m.conversation_id = i.conversation_id and m.direction = 'incoming'
        order by m.occurred_at desc
        limit 1
      ),
      ''
    ) as preview
  from public.inquiries i
  join public.inquiry_conversations c on c.id = i.conversation_id
  left join public.inquiry_contacts ct on ct.id = c.contact_id
  left join public.inquiry_people p on p.id = ct.person_id
  union all
  select
    'email'::text as channel,
    e.id,
    e.created_at,
    coalesce(e.last_message_at, e.updated_at) as last_activity_at,
    'gmail'::text as origin,
    coalesce(e.from_name, p.display_name, e.from_email) as contact_name,
    e.from_email as email,
    p.phone_e164 as phone,
    e.event_type,
    null::date as event_date_iso,
    e.event_date_text,
    e.location,
    null::integer as guest_count,
    e.status,
    null::text as availability,
    case when e.telegram_message_id is not null then 'sent' when e.alert_error is not null then 'failed' else null end as alert_status,
    e.person_id,
    null::uuid as conversation_id,
    null::text as primary_intent,
    e.summary,
    coalesce(e.subject, '') as preview
  from public.inquiry_email_threads e
  left join public.inquiry_people p on p.id = e.person_id
  where e.classification = 'inquiry';

revoke all on public.admin_inquiries_v from anon, authenticated;
grant select on public.admin_inquiries_v to service_role;
