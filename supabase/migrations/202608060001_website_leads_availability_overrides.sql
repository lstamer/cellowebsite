-- Phase 4: website-lead availability flow, the inbound availability gate, and
-- confirmed bare-message overrides.
--
-- 1. Website form submissions are persisted so the Telegram lead alert can
--    carry Available / Unavailable buttons whose taps trigger an AI-drafted
--    first outbound message. Cold Zernio sends are impossible (Meta requires
--    an approved template to open a conversation), so an approved website-lead
--    draft is delivered as a prefilled wa.me link Luke taps on his phone.
-- 2. Inbound WhatsApp bursts classified with the `availability` intent pause
--    before drafting: Luke is asked "Are you available on {date}?" and his
--    answer is injected into the draft as a human-confirmed fact.
-- 3. A bare Telegram message (no reply-to) is staged against the newest
--    pending review card and only sent after Luke taps a confirm button.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.inquiry_website_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('lead_form', 'contact_form')),
  first_name text not null check (btrim(first_name) <> ''),
  last_name text,
  email text not null,
  phone text,
  whatsapp text,
  -- Digits-only number used to build wa.me links; null means the lead cannot
  -- be reached on WhatsApp and the alert renders without availability buttons.
  whatsapp_digits text,
  contact_preference text,
  event_type text,
  event_date_text text,
  event_date_iso date,
  date_flexible boolean,
  location text,
  guest_count integer,
  performance_minutes integer,
  booker_role text,
  message text,
  notes text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'new' check (
    status in ('new', 'drafting', 'draft_ready', 'approved', 'dismissed', 'expired')
  ),
  availability text check (availability in ('available', 'unavailable')),
  draft_reply text,
  -- Luke's typed override; wins over draft_reply when present.
  final_reply text,
  model text,
  -- The lead-alert card that carries the Available / Unavailable buttons.
  telegram_chat_id bigint,
  telegram_message_id bigint,
  -- The draft-review card (Approve / Dismiss + typed override target).
  review_telegram_chat_id bigint,
  review_telegram_message_id bigint,
  review_notification_status text not null default 'pending' check (
    review_notification_status in ('pending', 'sending', 'sent', 'failed', 'uncertain')
  ),
  review_notification_started_at timestamptz,
  review_notification_error text,
  drafting_started_at timestamptz,
  decided_by text,
  decided_at timestamptz,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lets the override RPCs find the lead a Telegram reply is pointing at.
create index if not exists inquiry_website_leads_review_card_idx
  on public.inquiry_website_leads(review_telegram_chat_id, review_telegram_message_id)
  where review_telegram_message_id is not null;

-- The reconcile cron scans open leads every few minutes; keep that scan off
-- the ever-growing decided rows.
create index if not exists inquiry_website_leads_open_idx
  on public.inquiry_website_leads(expires_at)
  where status in ('new', 'drafting', 'draft_ready');

-- Bare-message override staging probes for pending review cards on the
-- webhook hot path; without this it scans every approval ever created (the
-- chat id is a single constant in practice).
create index if not exists inquiry_approval_requests_pending_card_idx
  on public.inquiry_approval_requests(telegram_chat_id, telegram_message_id)
  where status = 'pending';

create table if not exists public.inquiry_availability_checks (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inquiry_conversations(id) on delete cascade,
  batch_key text not null,
  message_ids uuid[] not null check (cardinality(message_ids) > 0),
  event_date_text text,
  event_date_iso date,
  event_context text,
  extraction jsonb not null check (jsonb_typeof(extraction) = 'object'),
  model text not null,
  status text not null default 'pending' check (
    status in ('pending', 'answered', 'superseded', 'expired')
  ),
  availability text check (availability in ('available', 'unavailable')),
  telegram_chat_id bigint,
  telegram_message_id bigint,
  question_status text not null default 'pending' check (
    question_status in ('pending', 'sending', 'sent', 'failed', 'uncertain')
  ),
  question_started_at timestamptz,
  question_error text,
  answered_by text,
  answered_at timestamptz,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, batch_key)
);

create index if not exists inquiry_availability_checks_pending_idx
  on public.inquiry_availability_checks(conversation_id)
  where status = 'pending';

create table if not exists public.inquiry_override_confirmations (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('approval', 'website_lead')),
  approval_id uuid references public.inquiry_approval_requests(id) on delete cascade,
  website_lead_id uuid references public.inquiry_website_leads(id) on delete cascade,
  override_text text not null check (btrim(override_text) <> ''),
  staged_by text not null,
  status text not null default 'staged' check (
    status in ('staged', 'confirmed', 'cancelled', 'expired')
  ),
  telegram_chat_id bigint not null,
  source_message_id bigint not null,
  prompt_message_id bigint,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((target_kind = 'approval') = (approval_id is not null)),
  check ((target_kind = 'website_lead') = (website_lead_id is not null))
);

create index if not exists inquiry_override_confirmations_staged_idx
  on public.inquiry_override_confirmations(telegram_chat_id)
  where status = 'staged';

alter table public.inquiry_website_leads enable row level security;
alter table public.inquiry_availability_checks enable row level security;
alter table public.inquiry_override_confirmations enable row level security;

-- ---------------------------------------------------------------------------
-- Outbox event types gain the three new flow drivers.
-- ---------------------------------------------------------------------------

alter table public.inquiry_outbox_events
  drop constraint if exists inquiry_outbox_events_event_type_check;

alter table public.inquiry_outbox_events
  add constraint inquiry_outbox_events_event_type_check check (
    event_type in (
      'inquiry.message_received',
      'inquiry.review_requested',
      'inquiry.response_approved',
      'inquiry.availability_requested',
      'inquiry.availability_answered',
      'website_lead.availability_decided'
    )
  );

-- ---------------------------------------------------------------------------
-- Website lead lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.create_website_lead(
  p_source text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_whatsapp text,
  p_whatsapp_digits text,
  p_contact_preference text,
  p_event_type text,
  p_event_date_text text,
  p_event_date_iso date,
  p_date_flexible boolean,
  p_location text,
  p_guest_count integer,
  p_performance_minutes integer,
  p_booker_role text,
  p_message text,
  p_notes text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
begin
  insert into public.inquiry_website_leads (
    source,
    first_name,
    last_name,
    email,
    phone,
    whatsapp,
    whatsapp_digits,
    contact_preference,
    event_type,
    event_date_text,
    event_date_iso,
    date_flexible,
    location,
    guest_count,
    performance_minutes,
    booker_role,
    message,
    notes,
    payload
  ) values (
    p_source,
    btrim(p_first_name),
    nullif(btrim(coalesce(p_last_name, '')), ''),
    btrim(p_email),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_whatsapp, '')), ''),
    nullif(btrim(coalesce(p_whatsapp_digits, '')), ''),
    nullif(btrim(coalesce(p_contact_preference, '')), ''),
    nullif(btrim(coalesce(p_event_type, '')), ''),
    nullif(btrim(coalesce(p_event_date_text, '')), ''),
    p_event_date_iso,
    p_date_flexible,
    nullif(btrim(coalesce(p_location, '')), ''),
    p_guest_count,
    p_performance_minutes,
    nullif(btrim(coalesce(p_booker_role, '')), ''),
    nullif(btrim(coalesce(p_message, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_lead_id;

  return jsonb_build_object('leadId', v_lead_id);
end;
$$;

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
      updated_at = now()
    where id = p_lead_id
      and telegram_message_id is null;
$$;

create or replace function public.decide_website_lead_availability(
  p_lead_id uuid,
  p_availability text,
  p_approver_id text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_outbox_id uuid;
  v_first_name text;
  v_whatsapp_digits text;
  v_chat_id bigint;
  v_message_id bigint;
begin
  if p_availability not in ('available', 'unavailable') then
    raise exception 'Invalid availability decision';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    select status into v_status
      from public.inquiry_website_leads
      where id = p_lead_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_status, 'outboxId', null
    );
  end if;

  update public.inquiry_website_leads
    set
      status = 'drafting',
      availability = p_availability,
      decided_by = p_approver_id,
      decided_at = now(),
      updated_at = now()
    where id = p_lead_id
      and status = 'new'
      and expires_at > now()
    returning status, first_name, whatsapp_digits, telegram_chat_id, telegram_message_id
      into v_status, v_first_name, v_whatsapp_digits, v_chat_id, v_message_id;

  if v_status is null then
    update public.inquiry_website_leads
      set status = 'expired', updated_at = now()
      where id = p_lead_id and status = 'new' and expires_at <= now();

    select status into v_status
      from public.inquiry_website_leads
      where id = p_lead_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_status, 'outboxId', null
    );
  end if;

  insert into public.inquiry_outbox_events (
    event_type,
    aggregate_id,
    payload,
    unique_key
  ) values (
    'website_lead.availability_decided',
    p_lead_id,
    jsonb_build_object('leadId', p_lead_id),
    'wl-avail:' || p_lead_id::text
  )
  on conflict (unique_key) do update set unique_key = excluded.unique_key
  returning id into v_outbox_id;

  return jsonb_build_object(
    'duplicate', false,
    'applied', true,
    'status', 'drafting',
    'outboxId', v_outbox_id,
    'availability', p_availability,
    'firstName', v_first_name,
    'whatsappDigits', v_whatsapp_digits,
    'telegramChatId', case when v_chat_id is null then null else v_chat_id::text end,
    'telegramMessageId', v_message_id
  );
end;
$$;

create or replace function public.claim_website_lead_draft(p_lead_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with claimed as (
    update public.inquiry_website_leads lead
      set
        drafting_started_at = now(),
        updated_at = now()
      where lead.id = p_lead_id
        and lead.status = 'drafting'
        and (
          lead.drafting_started_at is null
          or lead.drafting_started_at < now() - interval '5 minutes'
        )
      returning lead.*
  )
  select jsonb_build_object(
    'claimed', true,
    'leadId', claimed.id,
    'source', claimed.source,
    'firstName', claimed.first_name,
    'lastName', claimed.last_name,
    'email', claimed.email,
    'contactPreference', claimed.contact_preference,
    'eventType', claimed.event_type,
    'eventDateText', claimed.event_date_text,
    'eventDateIso', case
      when claimed.event_date_iso is null then null
      else to_char(claimed.event_date_iso, 'YYYY-MM-DD')
    end,
    'dateFlexible', claimed.date_flexible,
    'location', claimed.location,
    'guestCount', claimed.guest_count,
    'performanceMinutes', claimed.performance_minutes,
    'bookerRole', claimed.booker_role,
    'message', claimed.message,
    'notes', claimed.notes,
    'availability', claimed.availability,
    'whatsappDigits', claimed.whatsapp_digits
  ) into v_result
  from claimed;

  if v_result is not null then
    return v_result;
  end if;

  return jsonb_build_object(
    'claimed', false,
    'status', (select status from public.inquiry_website_leads where id = p_lead_id)
  );
end;
$$;

-- Drop the drafting lease after a failed AI call so the task's own quick
-- retries can re-claim instead of waiting out the 5-minute lease.
create or replace function public.release_website_lead_draft(p_lead_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_website_leads
    set drafting_started_at = null, updated_at = now()
    where id = p_lead_id
      and status = 'drafting';
$$;

create or replace function public.record_website_lead_draft(
  p_lead_id uuid,
  p_model text,
  p_draft text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if btrim(coalesce(p_draft, '')) = '' then
    raise exception 'Website lead draft cannot be blank';
  end if;

  update public.inquiry_website_leads
    set
      draft_reply = btrim(p_draft),
      model = p_model,
      status = 'draft_ready',
      review_notification_status = 'pending',
      last_error = null,
      updated_at = now()
    where id = p_lead_id
      and status = 'drafting'
    returning status into v_status;

  if v_status is null then
    return jsonb_build_object(
      'recorded', false,
      'status', (select status from public.inquiry_website_leads where id = p_lead_id)
    );
  end if;

  return jsonb_build_object('recorded', true, 'status', v_status);
end;
$$;

create or replace function public.claim_website_lead_review_notification(p_lead_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with claimed as (
    update public.inquiry_website_leads lead
      set
        review_notification_status = 'sending',
        review_notification_started_at = now(),
        review_notification_error = null,
        updated_at = now()
      where lead.id = p_lead_id
        and lead.status = 'draft_ready'
        and lead.review_notification_status in ('pending', 'failed')
      returning lead.*
  )
  select jsonb_build_object(
    'claimed', true,
    'leadId', claimed.id,
    'source', claimed.source,
    'firstName', claimed.first_name,
    'lastName', claimed.last_name,
    'eventType', claimed.event_type,
    'eventDateText', claimed.event_date_text,
    'dateFlexible', claimed.date_flexible,
    'location', claimed.location,
    'guestCount', claimed.guest_count,
    'performanceMinutes', claimed.performance_minutes,
    'bookerRole', claimed.booker_role,
    'message', claimed.message,
    'notes', claimed.notes,
    'availability', claimed.availability,
    'draftReply', claimed.draft_reply,
    'whatsappDigits', claimed.whatsapp_digits
  ) into v_result
  from claimed;

  if v_result is not null then
    return v_result;
  end if;

  return jsonb_build_object(
    'claimed', false,
    'status', (
      select review_notification_status
      from public.inquiry_website_leads
      where id = p_lead_id
    )
  );
end;
$$;

create or replace function public.complete_website_lead_review_notification(
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
      review_telegram_chat_id = p_telegram_chat_id,
      review_telegram_message_id = p_telegram_message_id,
      review_notification_status = 'sent',
      review_notification_error = null,
      updated_at = now()
    where id = p_lead_id
      and status = 'draft_ready'
      and review_notification_status = 'sending';
$$;

create or replace function public.fail_website_lead_review_notification(
  p_lead_id uuid,
  p_error text,
  p_uncertain boolean default false
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_website_leads
    set
      review_notification_status = case when p_uncertain then 'uncertain' else 'failed' end,
      review_notification_error = left(p_error, 2000),
      updated_at = now()
    where id = p_lead_id
      and status = 'draft_ready'
      and review_notification_status = 'sending';
$$;

create or replace function public.decide_website_lead_draft(
  p_lead_id uuid,
  p_decision text,
  p_approver_id text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.inquiry_website_leads%rowtype;
begin
  if p_decision not in ('approve', 'dismiss') then
    raise exception 'Invalid website lead decision';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    -- Return the current row so a re-tap on an already-approved draft can
    -- repaint the tap-to-send button instead of dead-ending.
    select * into v_lead
      from public.inquiry_website_leads
      where id = p_lead_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_lead.status,
      'reply', coalesce(v_lead.final_reply, v_lead.draft_reply),
      'whatsappDigits', v_lead.whatsapp_digits,
      'firstName', v_lead.first_name
    );
  end if;

  update public.inquiry_website_leads
    set
      status = case when p_decision = 'approve' then 'approved' else 'dismissed' end,
      decided_by = p_approver_id,
      decided_at = now(),
      updated_at = now()
    where id = p_lead_id
      and status = 'draft_ready'
      and expires_at > now()
    returning * into v_lead;

  if v_lead.id is null then
    update public.inquiry_website_leads
      set status = 'expired', updated_at = now()
      where id = p_lead_id and status = 'draft_ready' and expires_at <= now();

    select * into v_lead
      from public.inquiry_website_leads
      where id = p_lead_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_lead.status,
      'reply', coalesce(v_lead.final_reply, v_lead.draft_reply),
      'whatsappDigits', v_lead.whatsapp_digits,
      'firstName', v_lead.first_name
    );
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'applied', true,
    'status', v_lead.status,
    'reply', coalesce(v_lead.final_reply, v_lead.draft_reply),
    'whatsappDigits', v_lead.whatsapp_digits,
    'firstName', v_lead.first_name,
    'reviewTelegramChatId', case
      when v_lead.review_telegram_chat_id is null then null
      else v_lead.review_telegram_chat_id::text
    end,
    'reviewTelegramMessageId', v_lead.review_telegram_message_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Inbound availability gate
-- ---------------------------------------------------------------------------

create or replace function public.ensure_inquiry_availability_check(
  p_conversation_id uuid,
  p_batch_key text,
  p_message_ids uuid[],
  p_extraction jsonb,
  p_model text,
  p_event_date_text text,
  p_event_date_iso date,
  p_event_context text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_same_batch public.inquiry_availability_checks%rowtype;
  v_answered public.inquiry_availability_checks%rowtype;
  v_check_id uuid;
  v_outbox_id uuid;
  v_superseded jsonb;
begin
  if cardinality(p_message_ids) = 0 then
    raise exception 'At least one message ID is required';
  end if;

  perform 1
    from public.inquiry_conversations
    where id = p_conversation_id
    for update;

  if not found then
    raise exception 'Conversation not found';
  end if;

  -- The batch key is deterministic per message set, so any existing row for
  -- it IS this burst's question, whatever the (nondeterministic) re-extracted
  -- date looks like this run. Handling every status here also means the
  -- unique (conversation_id, batch_key) constraint can never be hit below.
  select * into v_same_batch
    from public.inquiry_availability_checks availability_check
    where availability_check.conversation_id = p_conversation_id
      and availability_check.batch_key = p_batch_key
    limit 1;

  if v_same_batch.id is not null then
    if v_same_batch.status = 'answered' then
      -- Luke answered this exact burst; his answer applies regardless of how
      -- the resumed extraction re-worded the date.
      return jsonb_build_object(
        'mode', 'fact',
        'checkId', v_same_batch.id,
        'availability', v_same_batch.availability,
        'eventDateText', v_same_batch.event_date_text
      );
    end if;

    if v_same_batch.status = 'pending' then
      -- Re-run of the same burst: reuse the pending question, don't ask twice.
      select id into v_outbox_id
        from public.inquiry_outbox_events
        where unique_key = 'avail:' || v_same_batch.id::text;

      return jsonb_build_object(
        'mode', 'pending',
        'duplicate', true,
        'checkId', v_same_batch.id,
        'outboxId', v_outbox_id,
        'supersededCards', '[]'::jsonb
      );
    end if;

    -- superseded / expired: the burst is live again, so resurrect the row
    -- (reinserting would violate the batch-key unique constraint) and requeue
    -- its question outbox event for a fresh card.
    update public.inquiry_availability_checks
      set
        status = 'pending',
        availability = null,
        answered_by = null,
        answered_at = null,
        question_status = 'pending',
        question_started_at = null,
        question_error = null,
        telegram_chat_id = null,
        telegram_message_id = null,
        event_date_text = nullif(btrim(coalesce(p_event_date_text, '')), ''),
        event_date_iso = p_event_date_iso,
        event_context = nullif(btrim(coalesce(p_event_context, '')), ''),
        extraction = p_extraction,
        model = p_model,
        expires_at = now() + interval '48 hours',
        updated_at = now()
      where id = v_same_batch.id;

    insert into public.inquiry_outbox_events (
      event_type,
      aggregate_id,
      payload,
      unique_key
    ) values (
      'inquiry.availability_requested',
      v_same_batch.id,
      jsonb_build_object('checkId', v_same_batch.id),
      'avail:' || v_same_batch.id::text
    )
    on conflict (unique_key) do update set
      status = 'pending',
      available_at = now(),
      claim_token = null,
      claimed_at = null,
      dispatched_at = null,
      last_error = 'Requeued for a resurrected availability check.'
    returning id into v_outbox_id;

    return jsonb_build_object(
      'mode', 'pending',
      'duplicate', false,
      'checkId', v_same_batch.id,
      'outboxId', v_outbox_id,
      'supersededCards', '[]'::jsonb
    );
  end if;

  -- A fresh answer Luke already gave for the same date (from an earlier
  -- burst) keeps working; the conversation continues without asking again.
  select * into v_answered
    from public.inquiry_availability_checks availability_check
    where availability_check.conversation_id = p_conversation_id
      and availability_check.status = 'answered'
      and availability_check.expires_at > now()
      and (
        (
          p_event_date_iso is not null
          and availability_check.event_date_iso = p_event_date_iso
        )
        or (
          p_event_date_iso is null
          and availability_check.event_date_iso is null
          and coalesce(nullif(btrim(coalesce(availability_check.event_date_text, '')), ''), '?')
            = coalesce(nullif(btrim(coalesce(p_event_date_text, '')), ''), '?')
        )
      )
    order by availability_check.answered_at desc
    limit 1;

  if v_answered.id is not null then
    return jsonb_build_object(
      'mode', 'fact',
      'checkId', v_answered.id,
      'availability', v_answered.availability,
      'eventDateText', v_answered.event_date_text
    );
  end if;

  -- The conversation moved on to a new burst: retire older unanswered
  -- questions so only one card is actionable at a time.
  with superseded as (
    update public.inquiry_availability_checks availability_check
      set status = 'superseded', updated_at = now()
      where availability_check.conversation_id = p_conversation_id
        and availability_check.status = 'pending'
      returning availability_check.id,
        availability_check.telegram_chat_id,
        availability_check.telegram_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'checkId', superseded.id,
    'telegramChatId', case
      when superseded.telegram_chat_id is null then null
      else superseded.telegram_chat_id::text
    end,
    'telegramMessageId', superseded.telegram_message_id
  )), '[]'::jsonb)
  into v_superseded
  from superseded;

  insert into public.inquiry_availability_checks (
    conversation_id,
    batch_key,
    message_ids,
    event_date_text,
    event_date_iso,
    event_context,
    extraction,
    model
  ) values (
    p_conversation_id,
    p_batch_key,
    p_message_ids,
    nullif(btrim(coalesce(p_event_date_text, '')), ''),
    p_event_date_iso,
    nullif(btrim(coalesce(p_event_context, '')), ''),
    p_extraction,
    p_model
  )
  returning id into v_check_id;

  insert into public.inquiry_outbox_events (
    event_type,
    aggregate_id,
    payload,
    unique_key
  ) values (
    'inquiry.availability_requested',
    v_check_id,
    jsonb_build_object('checkId', v_check_id),
    'avail:' || v_check_id::text
  )
  returning id into v_outbox_id;

  return jsonb_build_object(
    'mode', 'pending',
    'duplicate', false,
    'checkId', v_check_id,
    'outboxId', v_outbox_id,
    'supersededCards', v_superseded
  );
end;
$$;

create or replace function public.claim_inquiry_availability_question(p_check_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with claimed as (
    update public.inquiry_availability_checks availability_check
      set
        question_status = 'sending',
        question_started_at = now(),
        question_error = null,
        updated_at = now()
      where availability_check.id = p_check_id
        and availability_check.status = 'pending'
        and availability_check.question_status in ('pending', 'failed')
      returning availability_check.*
  )
  select jsonb_build_object(
    'claimed', true,
    'checkId', claimed.id,
    'conversationId', claimed.conversation_id,
    'eventDateText', claimed.event_date_text,
    'eventContext', claimed.event_context,
    'extraction', claimed.extraction,
    'contactName', contact.display_name,
    'serviceWindowExpiresAt', to_char(
      conversation.service_window_expires_at at time zone 'utc',
      'YYYY-MM-DD"T"HH24:MI:SS"Z"'
    )
  ) into v_result
  from claimed
  join public.inquiry_conversations conversation
    on conversation.id = claimed.conversation_id
  left join public.inquiry_contacts contact
    on contact.id = conversation.contact_id;

  if v_result is not null then
    return v_result;
  end if;

  return jsonb_build_object(
    'claimed', false,
    'status', (
      select question_status
      from public.inquiry_availability_checks
      where id = p_check_id
    )
  );
end;
$$;

create or replace function public.complete_inquiry_availability_question(
  p_check_id uuid,
  p_telegram_chat_id bigint,
  p_telegram_message_id bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_availability_checks
    set
      telegram_chat_id = p_telegram_chat_id,
      telegram_message_id = p_telegram_message_id,
      question_status = 'sent',
      question_error = null,
      updated_at = now()
    where id = p_check_id
      and status = 'pending'
      and question_status = 'sending';
$$;

create or replace function public.fail_inquiry_availability_question(
  p_check_id uuid,
  p_error text,
  p_uncertain boolean default false
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_availability_checks
    set
      question_status = case when p_uncertain then 'uncertain' else 'failed' end,
      question_error = left(p_error, 2000),
      updated_at = now()
    where id = p_check_id
      and status = 'pending'
      and question_status = 'sending';
$$;

create or replace function public.answer_inquiry_availability(
  p_check_id uuid,
  p_availability text,
  p_approver_id text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check public.inquiry_availability_checks%rowtype;
  v_status text;
  v_outbox_id uuid;
begin
  if p_availability not in ('available', 'unavailable') then
    raise exception 'Invalid availability answer';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    select status into v_status
      from public.inquiry_availability_checks
      where id = p_check_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_status, 'outboxId', null
    );
  end if;

  update public.inquiry_availability_checks
    set
      status = 'answered',
      availability = p_availability,
      answered_by = p_approver_id,
      answered_at = now(),
      updated_at = now()
    where id = p_check_id
      and status = 'pending'
      and expires_at > now()
    returning * into v_check;

  if v_check.id is null then
    update public.inquiry_availability_checks
      set status = 'expired', updated_at = now()
      where id = p_check_id and status = 'pending' and expires_at <= now();

    select status into v_status
      from public.inquiry_availability_checks
      where id = p_check_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_status, 'outboxId', null
    );
  end if;

  insert into public.inquiry_outbox_events (
    event_type,
    aggregate_id,
    payload,
    unique_key
  ) values (
    'inquiry.availability_answered',
    v_check.id,
    jsonb_build_object('checkId', v_check.id, 'conversationId', v_check.conversation_id),
    'avail-answer:' || v_check.id::text
  )
  on conflict (unique_key) do update set unique_key = excluded.unique_key
  returning id into v_outbox_id;

  return jsonb_build_object(
    'duplicate', false,
    'applied', true,
    'status', 'answered',
    'outboxId', v_outbox_id,
    'availability', v_check.availability,
    'conversationId', v_check.conversation_id,
    'eventDateText', v_check.event_date_text,
    'telegramChatId', case
      when v_check.telegram_chat_id is null then null
      else v_check.telegram_chat_id::text
    end,
    'telegramMessageId', v_check.telegram_message_id
  );
end;
$$;

create or replace function public.supersede_pending_availability_checks(
  p_conversation_id uuid,
  p_except_check_id uuid default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with superseded as (
    update public.inquiry_availability_checks availability_check
      set status = 'superseded', updated_at = now()
      where availability_check.conversation_id = p_conversation_id
        and availability_check.status = 'pending'
        and (p_except_check_id is null or availability_check.id <> p_except_check_id)
      returning availability_check.id,
        availability_check.telegram_chat_id,
        availability_check.telegram_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'checkId', superseded.id,
    'telegramChatId', case
      when superseded.telegram_chat_id is null then null
      else superseded.telegram_chat_id::text
    end,
    'telegramMessageId', superseded.telegram_message_id
  )), '[]'::jsonb)
  from superseded;
$$;

-- ---------------------------------------------------------------------------
-- Shared override body: approve an approval with Luke's text, teach from it,
-- and enqueue the guarded send. Called by both the reply-to override and the
-- confirmed bare-message override so the two paths cannot drift.
-- ---------------------------------------------------------------------------

create or replace function public.apply_inquiry_override_to_approval(
  p_approval_id uuid,
  p_override_text text,
  p_approver_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approval public.inquiry_approval_requests%rowtype;
  v_run public.inquiry_response_runs%rowtype;
  v_status text;
  v_outbox_id uuid;
  v_customer_message text;
begin
  select approval.* into v_approval
    from public.inquiry_approval_requests approval
    where approval.id = p_approval_id;

  if v_approval.id is null then
    return jsonb_build_object('applied', false, 'status', 'not_found', 'outboxId', null);
  end if;

  perform 1
    from public.inquiry_conversations
    where id = v_approval.conversation_id
    for update;

  update public.inquiry_approval_requests approval
    set
      status = 'approved',
      final_reply = btrim(p_override_text),
      decided_by = p_approver_id,
      decided_at = now(),
      last_error = null,
      updated_at = now()
    where approval.id = v_approval.id
      and approval.status in ('pending', 'rejected')
      and approval.expires_at > now()
    returning approval.status into v_status;

  if v_status is null then
    return jsonb_build_object(
      'applied', false,
      'status', (
        select status from public.inquiry_approval_requests
        where id = v_approval.id
      ),
      'outboxId', null
    );
  end if;

  update public.inquiries inquiry
    set status = 'awaiting_human', updated_at = now()
    where inquiry.conversation_id = v_approval.conversation_id
      and inquiry.status = 'human_rejected';

  update public.inquiry_conversations conversation
    set state = 'active', updated_at = now()
    where conversation.id = v_approval.conversation_id
      and conversation.state = 'human_rejected';

  select run.* into v_run
    from public.inquiry_response_runs run
    where run.id = v_approval.response_run_id;

  select string_agg(
      coalesce(nullif(btrim(message.body), ''), '[attachment]'),
      E'\n' order by message.occurred_at
    )
    into v_customer_message
    from public.inquiry_messages message
    where message.id = any(v_run.message_ids);

  insert into public.inquiry_reply_examples (
    kind,
    intents,
    customer_message,
    situation_summary,
    rejected_draft,
    reply,
    source,
    conversation_id,
    approval_id
  ) values (
    'override',
    array(select jsonb_array_elements_text(coalesce(v_run.analysis -> 'intents', '[]'::jsonb))),
    coalesce(v_customer_message, '[no message bodies]'),
    v_run.analysis ->> 'summary',
    v_run.proposed_reply,
    btrim(p_override_text),
    'telegram_override',
    v_approval.conversation_id,
    v_approval.id
  );

  insert into public.inquiry_outbox_events (
    event_type,
    aggregate_id,
    payload,
    unique_key
  ) values (
    'inquiry.response_approved',
    v_approval.id,
    jsonb_build_object('approvalId', v_approval.id),
    'approval:' || v_approval.id::text
  )
  on conflict (unique_key) do update set unique_key = excluded.unique_key
  returning id into v_outbox_id;

  return jsonb_build_object(
    'applied', true,
    'status', 'approved',
    'outboxId', v_outbox_id,
    'telegramChatId', case
      when v_approval.telegram_chat_id is null then null
      else v_approval.telegram_chat_id::text
    end,
    'telegramMessageId', v_approval.telegram_message_id
  );
end;
$$;

-- Renders a website lead's form data as the "customer message" a teaching
-- example stores, so learned corrections read like a real enquiry.
create or replace function public.render_website_lead_enquiry(
  p_lead public.inquiry_website_leads
)
returns text
language sql
immutable
as $$
  select concat_ws(
    E'\n',
    'Website form enquiry (' || p_lead.source || ')',
    'Name: ' || concat_ws(' ', p_lead.first_name, p_lead.last_name),
    case when p_lead.event_type is null then null else 'Event: ' || p_lead.event_type end,
    case
      when p_lead.event_date_text is null then null
      else 'Date: ' || p_lead.event_date_text
    end,
    case when p_lead.location is null then null else 'Location: ' || p_lead.location end,
    case
      when p_lead.guest_count is null then null
      else 'Guests: ' || p_lead.guest_count::text
    end,
    case
      when p_lead.performance_minutes is null then null
      else 'Performance: ' || p_lead.performance_minutes::text || ' minutes'
    end,
    case when p_lead.booker_role is null then null else 'Role: ' || p_lead.booker_role end,
    case when p_lead.message is null then null else 'Message: ' || p_lead.message end,
    case when p_lead.notes is null then null else 'Notes: ' || p_lead.notes end
  );
$$;

-- Approves a website-lead draft with Luke's own words and stores the teaching
-- example. Shared by the reply-to override and the confirmed bare override.
create or replace function public.apply_override_to_website_lead(
  p_lead_id uuid,
  p_override_text text,
  p_approver_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.inquiry_website_leads%rowtype;
begin
  update public.inquiry_website_leads
    set
      status = 'approved',
      final_reply = btrim(p_override_text),
      decided_by = p_approver_id,
      decided_at = now(),
      updated_at = now()
    where id = p_lead_id
      and status = 'draft_ready'
      and expires_at > now()
    returning * into v_lead;

  if v_lead.id is null then
    return jsonb_build_object(
      'applied', false,
      'status', (select status from public.inquiry_website_leads where id = p_lead_id)
    );
  end if;

  insert into public.inquiry_reply_examples (
    kind,
    intents,
    customer_message,
    situation_summary,
    rejected_draft,
    reply,
    source,
    conversation_id,
    approval_id
  ) values (
    'override',
    array['availability', 'event_details'],
    public.render_website_lead_enquiry(v_lead),
    'Website lead marked ' || coalesce(v_lead.availability, 'undecided')
      || ' — first outbound WhatsApp message.',
    v_lead.draft_reply,
    btrim(p_override_text),
    'website_lead_override',
    null,
    null
  );

  return jsonb_build_object(
    'applied', true,
    'status', 'approved',
    'leadId', v_lead.id,
    'reply', btrim(p_override_text),
    'whatsappDigits', v_lead.whatsapp_digits,
    'firstName', v_lead.first_name,
    'reviewTelegramChatId', case
      when v_lead.review_telegram_chat_id is null then null
      else v_lead.review_telegram_chat_id::text
    end,
    'reviewTelegramMessageId', v_lead.review_telegram_message_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Reply-to override now also matches website-lead review cards. Return keys
-- are additive: existing callers keep working, targetKind defaults to
-- 'approval' in the TypeScript parser.
-- ---------------------------------------------------------------------------

create or replace function public.record_inquiry_override(
  p_telegram_chat_id bigint,
  p_reply_to_message_id bigint,
  p_override_text text,
  p_approver_id text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approval_id uuid;
  v_lead_id uuid;
  v_apply jsonb;
begin
  if btrim(coalesce(p_override_text, '')) = '' then
    raise exception 'Override text cannot be blank';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', null,
      'approvalId', null, 'outboxId', null
    );
  end if;

  select approval.id into v_approval_id
    from public.inquiry_approval_requests approval
    where approval.telegram_chat_id = p_telegram_chat_id
      and approval.telegram_message_id = p_reply_to_message_id
    order by approval.created_at desc
    limit 1;

  if v_approval_id is not null then
    v_apply := public.apply_inquiry_override_to_approval(
      v_approval_id, p_override_text, p_approver_id
    );

    return jsonb_build_object(
      'duplicate', false,
      'applied', (v_apply ->> 'applied')::boolean,
      'status', v_apply ->> 'status',
      'approvalId', v_approval_id,
      'outboxId', nullif(v_apply ->> 'outboxId', '')::uuid,
      'targetKind', 'approval'
    );
  end if;

  select lead.id into v_lead_id
    from public.inquiry_website_leads lead
    where lead.review_telegram_chat_id = p_telegram_chat_id
      and lead.review_telegram_message_id = p_reply_to_message_id
    order by lead.created_at desc
    limit 1;

  if v_lead_id is not null then
    v_apply := public.apply_override_to_website_lead(
      v_lead_id, p_override_text, p_approver_id
    );

    return jsonb_build_object(
      'duplicate', false,
      'applied', (v_apply ->> 'applied')::boolean,
      'status', v_apply ->> 'status',
      'approvalId', null,
      'outboxId', null,
      'targetKind', 'website_lead',
      'leadId', v_lead_id,
      'reply', v_apply ->> 'reply',
      'whatsappDigits', v_apply ->> 'whatsappDigits',
      'firstName', v_apply ->> 'firstName'
    );
  end if;

  return jsonb_build_object(
    'duplicate', false, 'applied', false, 'status', 'not_found',
    'approvalId', null, 'outboxId', null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Bare-message override staging + confirm
-- ---------------------------------------------------------------------------

create or replace function public.stage_inquiry_override(
  p_telegram_chat_id bigint,
  p_override_text text,
  p_approver_id text,
  p_telegram_update_id bigint,
  p_source_message_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target record;
  v_confirm_id uuid;
  v_superseded jsonb;
begin
  if btrim(coalesce(p_override_text, '')) = '' then
    raise exception 'Override text cannot be blank';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    return jsonb_build_object('duplicate', true, 'staged', false, 'status', null);
  end if;

  -- Newest actionable review card in this chat wins. Telegram message ids are
  -- monotonically increasing per chat, so the greatest id is the newest card.
  select * into v_target
    from (
      select
        'approval'::text as kind,
        approval.id as target_id,
        approval.telegram_message_id as card_message_id,
        coalesce(contact.display_name, 'the customer') as target_name
      from public.inquiry_approval_requests approval
      join public.inquiry_conversations conversation
        on conversation.id = approval.conversation_id
      left join public.inquiry_contacts contact
        on contact.id = conversation.contact_id
      where approval.status = 'pending'
        and approval.telegram_chat_id = p_telegram_chat_id
        and approval.telegram_message_id is not null
        and approval.expires_at > now()
      union all
      select
        'website_lead'::text as kind,
        lead.id as target_id,
        lead.review_telegram_message_id as card_message_id,
        lead.first_name as target_name
      from public.inquiry_website_leads lead
      where lead.status = 'draft_ready'
        and lead.review_telegram_chat_id = p_telegram_chat_id
        and lead.review_telegram_message_id is not null
        and lead.expires_at > now()
    ) candidates
    order by candidates.card_message_id desc
    limit 1;

  if not found then
    return jsonb_build_object('duplicate', false, 'staged', false, 'status', 'no_pending');
  end if;

  -- Only one staged confirmation per chat: a newer typed message supersedes
  -- any prompt still waiting for a tap.
  with expired as (
    update public.inquiry_override_confirmations confirmation
      set status = 'expired', updated_at = now()
      where confirmation.telegram_chat_id = p_telegram_chat_id
        and confirmation.status = 'staged'
      returning confirmation.id, confirmation.prompt_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'confirmId', expired.id,
    'promptMessageId', expired.prompt_message_id
  )), '[]'::jsonb)
  into v_superseded
  from expired;

  insert into public.inquiry_override_confirmations (
    target_kind,
    approval_id,
    website_lead_id,
    override_text,
    staged_by,
    telegram_chat_id,
    source_message_id
  ) values (
    v_target.kind,
    case when v_target.kind = 'approval' then v_target.target_id else null end,
    case when v_target.kind = 'website_lead' then v_target.target_id else null end,
    btrim(p_override_text),
    p_approver_id,
    p_telegram_chat_id,
    p_source_message_id
  )
  returning id into v_confirm_id;

  return jsonb_build_object(
    'duplicate', false,
    'staged', true,
    'confirmId', v_confirm_id,
    'targetKind', v_target.kind,
    'targetName', v_target.target_name,
    'targetCardMessageId', v_target.card_message_id,
    'supersededPrompts', v_superseded
  );
end;
$$;

create or replace function public.attach_override_confirmation_prompt(
  p_confirm_id uuid,
  p_prompt_message_id bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_override_confirmations
    set prompt_message_id = p_prompt_message_id, updated_at = now()
    where id = p_confirm_id
      and status = 'staged'
      and prompt_message_id is null;
$$;

create or replace function public.confirm_inquiry_override(
  p_confirm_id uuid,
  p_approver_id text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmation public.inquiry_override_confirmations%rowtype;
  v_status text;
  v_apply jsonb;
begin
  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    select status into v_status
      from public.inquiry_override_confirmations
      where id = p_confirm_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_status
    );
  end if;

  update public.inquiry_override_confirmations
    set status = 'confirmed', updated_at = now()
    where id = p_confirm_id
      and status = 'staged'
      and expires_at > now()
    returning * into v_confirmation;

  if v_confirmation.id is null then
    update public.inquiry_override_confirmations
      set status = 'expired', updated_at = now()
      where id = p_confirm_id and status = 'staged' and expires_at <= now();

    select status into v_status
      from public.inquiry_override_confirmations
      where id = p_confirm_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', coalesce(v_status, 'not_found')
    );
  end if;

  if v_confirmation.target_kind = 'approval' then
    v_apply := public.apply_inquiry_override_to_approval(
      v_confirmation.approval_id, v_confirmation.override_text, p_approver_id
    );

    if not (v_apply ->> 'applied')::boolean then
      update public.inquiry_override_confirmations
        set status = 'expired', updated_at = now()
        where id = p_confirm_id;

      return jsonb_build_object(
        'duplicate', false,
        'applied', false,
        'status', v_apply ->> 'status',
        'targetKind', 'approval'
      );
    end if;

    return jsonb_build_object(
      'duplicate', false,
      'applied', true,
      'status', 'approved',
      'targetKind', 'approval',
      'approvalId', v_confirmation.approval_id,
      'outboxId', nullif(v_apply ->> 'outboxId', '')::uuid,
      'overrideText', v_confirmation.override_text,
      'targetCardChatId', v_apply ->> 'telegramChatId',
      'targetCardMessageId', (v_apply ->> 'telegramMessageId')::bigint
    );
  end if;

  v_apply := public.apply_override_to_website_lead(
    v_confirmation.website_lead_id, v_confirmation.override_text, p_approver_id
  );

  if not (v_apply ->> 'applied')::boolean then
    update public.inquiry_override_confirmations
      set status = 'expired', updated_at = now()
      where id = p_confirm_id;

    return jsonb_build_object(
      'duplicate', false,
      'applied', false,
      'status', v_apply ->> 'status',
      'targetKind', 'website_lead'
    );
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'applied', true,
    'status', 'approved',
    'targetKind', 'website_lead',
    'leadId', v_confirmation.website_lead_id,
    'overrideText', v_confirmation.override_text,
    'reply', v_apply ->> 'reply',
    'whatsappDigits', v_apply ->> 'whatsappDigits',
    'firstName', v_apply ->> 'firstName',
    'targetCardChatId', v_apply ->> 'reviewTelegramChatId',
    'targetCardMessageId', (v_apply ->> 'reviewTelegramMessageId')::bigint
  );
end;
$$;

create or replace function public.cancel_inquiry_override(
  p_confirm_id uuid,
  p_approver_id text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    select status into v_status
      from public.inquiry_override_confirmations
      where id = p_confirm_id;

    return jsonb_build_object(
      'duplicate', true, 'applied', false, 'status', v_status
    );
  end if;

  update public.inquiry_override_confirmations
    set status = 'cancelled', updated_at = now()
    where id = p_confirm_id
      and status = 'staged'
    returning status into v_status;

  if v_status is null then
    return jsonb_build_object(
      'duplicate', true,
      'applied', false,
      'status', (
        select status from public.inquiry_override_confirmations
        where id = p_confirm_id
      )
    );
  end if;

  return jsonb_build_object('duplicate', false, 'applied', true, 'status', v_status);
end;
$$;

-- ---------------------------------------------------------------------------
-- Recovery: fold the new work into the cron reconciler. Return keys are
-- additive so the existing parser keeps working.
-- ---------------------------------------------------------------------------

create or replace function public.reconcile_stale_inquiry_work()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stale_sends jsonb;
  v_stale_reviews integer;
  v_stale_outbox integer;
  v_stale_lead_work integer := 0;
  v_count integer;
  v_expired_availability_cards jsonb;
  v_expired_lead_cards jsonb;
  v_expired_override_prompts jsonb;
begin
  with stale as (
    update public.inquiry_approval_requests
      set
        status = 'send_uncertain',
        last_error = 'Worker stopped after the send was claimed. Check Zernio before sending manually.',
        updated_at = now()
      where status = 'sending'
        and send_started_at < now() - interval '5 minutes'
      returning id, conversation_id, telegram_chat_id, telegram_message_id
  ), updated_inquiries as (
    update public.inquiries inquiry
      set status = 'send_uncertain', updated_at = now()
      where inquiry.conversation_id in (
        select stale.conversation_id from stale
      )
      returning inquiry.id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'approvalId', stale.id,
    'telegramChatId', case when stale.telegram_chat_id is null then null else stale.telegram_chat_id::text end,
    'telegramMessageId', stale.telegram_message_id
  )), '[]'::jsonb)
  into v_stale_sends
  from stale;

  with stale_reviews as (
    update public.inquiry_approval_requests approval
      set
        telegram_notification_status = 'failed',
        telegram_notification_error = 'Recovered a stopped Telegram notification worker; delivery will be retried.',
        updated_at = now()
      where approval.telegram_notification_status = 'sending'
        and approval.telegram_notification_started_at < now() - interval '5 minutes'
        and approval.status = 'pending'
      returning approval.id
  ), requeued_reviews as (
    update public.inquiry_outbox_events outbox
      set
        status = 'pending',
        available_at = now(),
        claim_token = null,
        claimed_at = null,
        dispatched_at = null,
        last_error = 'Recovered a stale Telegram review notification for retry.'
      where outbox.event_type = 'inquiry.review_requested'
        and outbox.aggregate_id in (select stale_reviews.id from stale_reviews)
      returning outbox.id
  )
  select count(*)::integer
    into v_stale_reviews
    from stale_reviews;

  -- Website-lead drafting or review notification stalled: requeue the driving
  -- outbox event so the cron re-dispatches the draft task, which re-claims
  -- whichever step is unfinished.
  with stale_leads as (
    update public.inquiry_website_leads lead
      set
        review_notification_status = case
          when lead.status = 'draft_ready' and lead.review_notification_status = 'sending'
          then 'failed'
          else lead.review_notification_status
        end,
        review_notification_error = case
          when lead.status = 'draft_ready' and lead.review_notification_status = 'sending'
          then 'Recovered a stopped website-lead notification worker; delivery will be retried.'
          else lead.review_notification_error
        end,
        drafting_started_at = case
          when lead.status = 'drafting' then null
          else lead.drafting_started_at
        end,
        updated_at = now()
      where (
          lead.status = 'drafting'
          and lead.drafting_started_at < now() - interval '10 minutes'
        )
        or (
          lead.status = 'draft_ready'
          and lead.review_notification_status = 'sending'
          and lead.review_notification_started_at < now() - interval '5 minutes'
        )
      returning lead.id
  ), requeued_leads as (
    update public.inquiry_outbox_events outbox
      set
        status = 'pending',
        available_at = now(),
        claim_token = null,
        claimed_at = null,
        dispatched_at = null,
        last_error = 'Recovered stale website-lead work for retry.'
      where outbox.event_type = 'website_lead.availability_decided'
        and outbox.aggregate_id in (select stale_leads.id from stale_leads)
      returning outbox.id
  )
  select count(*)::integer into v_count from stale_leads;
  v_stale_lead_work := v_stale_lead_work + coalesce(v_count, 0);

  with stale_questions as (
    update public.inquiry_availability_checks availability_check
      set
        question_status = 'failed',
        question_error = 'Recovered a stopped availability question worker; delivery will be retried.',
        updated_at = now()
      where availability_check.status = 'pending'
        and availability_check.question_status = 'sending'
        and availability_check.question_started_at < now() - interval '5 minutes'
      returning availability_check.id
  ), requeued_questions as (
    update public.inquiry_outbox_events outbox
      set
        status = 'pending',
        available_at = now(),
        claim_token = null,
        claimed_at = null,
        dispatched_at = null,
        last_error = 'Recovered a stale availability question for retry.'
      where outbox.event_type = 'inquiry.availability_requested'
        and outbox.aggregate_id in (select stale_questions.id from stale_questions)
      returning outbox.id
  )
  select count(*)::integer into v_count from stale_questions;
  v_stale_lead_work := v_stale_lead_work + coalesce(v_count, 0);

  update public.inquiry_outbox_events
    set
      status = case when attempts >= 10 then 'failed' else 'pending' end,
      available_at = now(),
      claim_token = null,
      claimed_at = null,
      last_error = 'Recovered stale outbox lease.'
    where status = 'processing'
      and claimed_at < now() - interval '5 minutes';
  get diagnostics v_stale_outbox = row_count;

  with expired_checks as (
    update public.inquiry_availability_checks availability_check
      set status = 'expired', updated_at = now()
      where availability_check.status = 'pending'
        and availability_check.expires_at <= now()
      returning availability_check.id,
        availability_check.telegram_chat_id,
        availability_check.telegram_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'checkId', expired_checks.id,
    'telegramChatId', case
      when expired_checks.telegram_chat_id is null then null
      else expired_checks.telegram_chat_id::text
    end,
    'telegramMessageId', expired_checks.telegram_message_id
  )), '[]'::jsonb)
  into v_expired_availability_cards
  from expired_checks;

  with expired_leads as (
    update public.inquiry_website_leads lead
      set status = 'expired', updated_at = now()
      where lead.status in ('new', 'drafting', 'draft_ready')
        and lead.expires_at <= now()
      returning lead.id,
        coalesce(lead.review_telegram_chat_id, lead.telegram_chat_id) as chat_id,
        coalesce(lead.review_telegram_message_id, lead.telegram_message_id) as message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'leadId', expired_leads.id,
    'telegramChatId', case
      when expired_leads.chat_id is null then null
      else expired_leads.chat_id::text
    end,
    'telegramMessageId', expired_leads.message_id
  )), '[]'::jsonb)
  into v_expired_lead_cards
  from expired_leads;

  with expired_confirmations as (
    update public.inquiry_override_confirmations confirmation
      set status = 'expired', updated_at = now()
      where confirmation.status = 'staged'
        and confirmation.expires_at <= now()
      returning confirmation.id,
        confirmation.telegram_chat_id,
        confirmation.prompt_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'confirmId', expired_confirmations.id,
    'telegramChatId', expired_confirmations.telegram_chat_id::text,
    'promptMessageId', expired_confirmations.prompt_message_id
  )), '[]'::jsonb)
  into v_expired_override_prompts
  from expired_confirmations;

  return jsonb_build_object(
    'staleSends', v_stale_sends,
    'staleReviews', v_stale_reviews,
    'staleOutbox', v_stale_outbox,
    'staleLeadWork', v_stale_lead_work,
    'expiredAvailabilityCards', v_expired_availability_cards,
    'expiredLeadCards', v_expired_lead_cards,
    'expiredOverridePrompts', v_expired_override_prompts
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on table public.inquiry_website_leads from anon, authenticated;
revoke all on table public.inquiry_availability_checks from anon, authenticated;
revoke all on table public.inquiry_override_confirmations from anon, authenticated;

grant all on table public.inquiry_website_leads to service_role;
grant all on table public.inquiry_availability_checks to service_role;
grant all on table public.inquiry_override_confirmations to service_role;

revoke all on function public.create_website_lead from public, anon, authenticated;
revoke all on function public.complete_website_lead_alert from public, anon, authenticated;
revoke all on function public.decide_website_lead_availability from public, anon, authenticated;
revoke all on function public.claim_website_lead_draft from public, anon, authenticated;
revoke all on function public.release_website_lead_draft from public, anon, authenticated;
revoke all on function public.record_website_lead_draft from public, anon, authenticated;
revoke all on function public.claim_website_lead_review_notification from public, anon, authenticated;
revoke all on function public.complete_website_lead_review_notification from public, anon, authenticated;
revoke all on function public.fail_website_lead_review_notification from public, anon, authenticated;
revoke all on function public.decide_website_lead_draft from public, anon, authenticated;
revoke all on function public.ensure_inquiry_availability_check from public, anon, authenticated;
revoke all on function public.claim_inquiry_availability_question from public, anon, authenticated;
revoke all on function public.complete_inquiry_availability_question from public, anon, authenticated;
revoke all on function public.fail_inquiry_availability_question from public, anon, authenticated;
revoke all on function public.answer_inquiry_availability from public, anon, authenticated;
revoke all on function public.supersede_pending_availability_checks from public, anon, authenticated;
revoke all on function public.apply_inquiry_override_to_approval from public, anon, authenticated;
revoke all on function public.render_website_lead_enquiry from public, anon, authenticated;
revoke all on function public.apply_override_to_website_lead from public, anon, authenticated;
revoke all on function public.record_inquiry_override from public, anon, authenticated;
revoke all on function public.stage_inquiry_override from public, anon, authenticated;
revoke all on function public.attach_override_confirmation_prompt from public, anon, authenticated;
revoke all on function public.confirm_inquiry_override from public, anon, authenticated;
revoke all on function public.cancel_inquiry_override from public, anon, authenticated;
revoke all on function public.reconcile_stale_inquiry_work from public, anon, authenticated;

grant execute on function public.create_website_lead to service_role;
grant execute on function public.complete_website_lead_alert to service_role;
grant execute on function public.decide_website_lead_availability to service_role;
grant execute on function public.claim_website_lead_draft to service_role;
grant execute on function public.release_website_lead_draft to service_role;
grant execute on function public.record_website_lead_draft to service_role;
grant execute on function public.claim_website_lead_review_notification to service_role;
grant execute on function public.complete_website_lead_review_notification to service_role;
grant execute on function public.fail_website_lead_review_notification to service_role;
grant execute on function public.decide_website_lead_draft to service_role;
grant execute on function public.ensure_inquiry_availability_check to service_role;
grant execute on function public.claim_inquiry_availability_question to service_role;
grant execute on function public.complete_inquiry_availability_question to service_role;
grant execute on function public.fail_inquiry_availability_question to service_role;
grant execute on function public.answer_inquiry_availability to service_role;
grant execute on function public.supersede_pending_availability_checks to service_role;
grant execute on function public.record_inquiry_override to service_role;
grant execute on function public.stage_inquiry_override to service_role;
grant execute on function public.attach_override_confirmation_prompt to service_role;
grant execute on function public.confirm_inquiry_override to service_role;
grant execute on function public.cancel_inquiry_override to service_role;
grant execute on function public.reconcile_stale_inquiry_work to service_role;
