create extension if not exists pgcrypto;

create table if not exists public.inquiry_contacts (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'zernio',
  provider_account_id text not null,
  provider_identity text not null,
  phone_e164 text,
  whatsapp_username text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_account_id, provider_identity)
);

create table if not exists public.inquiry_conversations (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'zernio',
  channel text not null default 'whatsapp' check (channel = 'whatsapp'),
  provider_conversation_id text not null,
  provider_account_id text not null,
  contact_id uuid references public.inquiry_contacts(id) on delete set null,
  state text not null default 'new',
  last_inbound_at timestamptz,
  last_processed_at timestamptz,
  service_window_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_account_id, provider_conversation_id)
);

create table if not exists public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inquiry_conversations(id) on delete cascade,
  provider text not null default 'zernio',
  provider_event_id text not null unique,
  provider_message_id text not null,
  direction text not null check (direction in ('incoming', 'outgoing')),
  body text,
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  sender_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(sender_snapshot) = 'object'),
  raw_payload jsonb not null check (jsonb_typeof(raw_payload) = 'object'),
  occurred_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists inquiry_messages_provider_message_idx
  on public.inquiry_messages(conversation_id, provider, provider_message_id);

create index if not exists inquiry_messages_unprocessed_idx
  on public.inquiry_messages(conversation_id, occurred_at)
  where processed_at is null and direction = 'incoming';

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.inquiry_conversations(id) on delete cascade,
  status text not null default 'new',
  source text not null default 'unknown',
  primary_intent text,
  intents text[] not null default '{}',
  completeness numeric(4, 3) check (completeness between 0 and 1),
  latest_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, conversation_id)
);

create table if not exists public.inquiry_response_runs (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null,
  conversation_id uuid not null references public.inquiry_conversations(id) on delete cascade,
  batch_key text not null,
  message_ids uuid[] not null check (cardinality(message_ids) > 0),
  model text not null,
  analysis jsonb not null check (jsonb_typeof(analysis) = 'object'),
  proposed_reply text not null check (btrim(proposed_reply) <> ''),
  policy_decision text not null check (policy_decision in ('human_review', 'auto_send', 'hold')),
  policy_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (conversation_id, batch_key),
  unique (id, conversation_id),
  foreign key (inquiry_id, conversation_id)
    references public.inquiries(id, conversation_id) on delete cascade
);

create table if not exists public.inquiry_approval_requests (
  id uuid primary key default gen_random_uuid(),
  response_run_id uuid not null unique,
  conversation_id uuid not null references public.inquiry_conversations(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'sending', 'sent', 'failed', 'send_uncertain', 'expired')
  ),
  final_reply text,
  telegram_chat_id bigint,
  telegram_message_id bigint,
  telegram_notification_status text not null default 'pending' check (
    telegram_notification_status in ('pending', 'sending', 'sent', 'failed', 'uncertain')
  ),
  telegram_notification_started_at timestamptz,
  telegram_notification_error text,
  decided_by text,
  decided_at timestamptz,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  send_attempts integer not null default 0,
  send_started_at timestamptz,
  provider_message_id text,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (response_run_id, conversation_id)
    references public.inquiry_response_runs(id, conversation_id) on delete cascade
);

create table if not exists public.inquiry_outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in ('inquiry.message_received', 'inquiry.review_requested', 'inquiry.response_approved')
  ),
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'dispatched', 'failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  claim_token uuid,
  claimed_at timestamptz,
  dispatched_at timestamptz,
  last_error text,
  unique_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_outbox_pending_idx
  on public.inquiry_outbox_events(available_at, created_at)
  where status = 'pending';

create table if not exists public.inquiry_telegram_updates (
  update_id bigint primary key,
  received_at timestamptz not null default now()
);

alter table public.inquiry_contacts enable row level security;
alter table public.inquiry_conversations enable row level security;
alter table public.inquiry_messages enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_response_runs enable row level security;
alter table public.inquiry_approval_requests enable row level security;
alter table public.inquiry_outbox_events enable row level security;
alter table public.inquiry_telegram_updates enable row level security;

create or replace function public.ingest_zernio_message(
  p_provider_event_id text,
  p_provider_message_id text,
  p_provider_conversation_id text,
  p_provider_account_id text,
  p_provider_identity text,
  p_phone_e164 text,
  p_whatsapp_username text,
  p_display_name text,
  p_body text,
  p_attachments jsonb,
  p_sender_snapshot jsonb,
  p_occurred_at timestamptz,
  p_raw_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_conversation_id uuid;
  v_existing_conversation_id uuid;
  v_message_id uuid;
  v_outbox_id uuid;
begin
  insert into public.inquiry_contacts (
    provider,
    provider_account_id,
    provider_identity,
    phone_e164,
    whatsapp_username,
    display_name
  ) values (
    'zernio',
    p_provider_account_id,
    p_provider_identity,
    p_phone_e164,
    p_whatsapp_username,
    p_display_name
  )
  on conflict (provider, provider_account_id, provider_identity) do update set
    phone_e164 = coalesce(excluded.phone_e164, inquiry_contacts.phone_e164),
    whatsapp_username = coalesce(excluded.whatsapp_username, inquiry_contacts.whatsapp_username),
    display_name = coalesce(excluded.display_name, inquiry_contacts.display_name),
    updated_at = now()
  returning id into v_contact_id;

  insert into public.inquiry_conversations (
    provider,
    channel,
    provider_conversation_id,
    provider_account_id,
    contact_id,
    last_inbound_at,
    service_window_expires_at
  ) values (
    'zernio',
    'whatsapp',
    p_provider_conversation_id,
    p_provider_account_id,
    v_contact_id,
    p_occurred_at,
    p_occurred_at + interval '24 hours'
  )
  on conflict (provider, provider_account_id, provider_conversation_id) do update set
    provider_account_id = excluded.provider_account_id,
    contact_id = coalesce(excluded.contact_id, inquiry_conversations.contact_id),
    last_inbound_at = greatest(inquiry_conversations.last_inbound_at, excluded.last_inbound_at),
    service_window_expires_at = greatest(
      inquiry_conversations.service_window_expires_at,
      excluded.service_window_expires_at
    ),
    updated_at = now()
  returning id into v_conversation_id;

  -- Use the conversation row as the serialization point shared with the final
  -- approval claim. This prevents an inbound insert from being evaluated on a
  -- stale snapshot while an approved response is being claimed.
  perform 1
    from public.inquiry_conversations conversation
    where conversation.id = v_conversation_id
    for update;

  insert into public.inquiry_messages (
    conversation_id,
    provider,
    provider_event_id,
    provider_message_id,
    direction,
    body,
    attachments,
    sender_snapshot,
    raw_payload,
    occurred_at
  ) values (
    v_conversation_id,
    'zernio',
    p_provider_event_id,
    p_provider_message_id,
    'incoming',
    p_body,
    coalesce(p_attachments, '[]'::jsonb),
    coalesce(p_sender_snapshot, '{}'::jsonb),
    p_raw_payload,
    p_occurred_at
  )
  on conflict do nothing
  returning id into v_message_id;

  if v_message_id is null then
    select id, conversation_id
      into v_message_id, v_existing_conversation_id
      from public.inquiry_messages
      where provider_event_id = p_provider_event_id
         or (
           conversation_id = v_conversation_id
           and provider = 'zernio'
           and provider_message_id = p_provider_message_id
         )
      order by created_at asc
      limit 1;

    if v_existing_conversation_id is distinct from v_conversation_id then
      raise exception 'Duplicate provider identity belongs to another conversation';
    end if;

    return jsonb_build_object(
      'conversationId', v_conversation_id,
      'messageId', v_message_id,
      'outboxId', null,
      'duplicate', true
    );
  end if;

  insert into public.inquiry_outbox_events (
    event_type,
    aggregate_id,
    payload,
    unique_key
  ) values (
    'inquiry.message_received',
    v_conversation_id,
    jsonb_build_object('conversationId', v_conversation_id, 'messageId', v_message_id),
    'zernio-message:' || p_provider_event_id
  )
  returning id into v_outbox_id;

  update public.inquiry_approval_requests
    set
      status = 'expired',
      last_error = 'Superseded by a newer inbound WhatsApp message.',
      updated_at = now()
    where conversation_id = v_conversation_id
      and status in ('pending', 'approved');

  update public.inquiries
    set status = 'new', updated_at = now()
    where conversation_id = v_conversation_id;

  return jsonb_build_object(
    'conversationId', v_conversation_id,
    'messageId', v_message_id,
    'outboxId', v_outbox_id,
    'duplicate', false
  );
end;
$$;

create or replace function public.record_inquiry_analysis(
  p_conversation_id uuid,
  p_batch_key text,
  p_message_ids uuid[],
  p_model text,
  p_analysis jsonb,
  p_proposed_reply text,
  p_policy_decision text,
  p_policy_reasons text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry_id uuid;
  v_response_run_id uuid;
  v_approval_id uuid;
  v_review_outbox_id uuid;
  v_existing_telegram_message_id bigint;
  v_message_count integer;
begin
  if cardinality(p_message_ids) = 0 then
    raise exception 'At least one message ID is required';
  end if;

  if btrim(p_proposed_reply) = '' then
    raise exception 'Proposed reply cannot be blank';
  end if;

  perform 1
    from public.inquiry_conversations
    where id = p_conversation_id
    for update;

  if not found then
    raise exception 'Conversation not found';
  end if;

  select response_run.id, response_run.inquiry_id
    into v_response_run_id, v_inquiry_id
    from public.inquiry_response_runs response_run
    where response_run.conversation_id = p_conversation_id
      and response_run.batch_key = p_batch_key;

  if v_response_run_id is not null then
    select approval.id, approval.telegram_message_id
      into v_approval_id, v_existing_telegram_message_id
      from public.inquiry_approval_requests approval
      where approval.response_run_id = v_response_run_id;

    select outbox.id into v_review_outbox_id
      from public.inquiry_outbox_events outbox
      where outbox.unique_key = 'review:' || v_approval_id::text;

    return jsonb_build_object(
      'inquiryId', v_inquiry_id,
      'responseRunId', v_response_run_id,
      'approvalId', v_approval_id,
      'reviewOutboxId', v_review_outbox_id,
      'duplicate', true,
      'telegramMessageId', case
        when v_existing_telegram_message_id is null then null
        else v_existing_telegram_message_id::text
      end
    );
  end if;

  select count(distinct message.id) into v_message_count
    from public.inquiry_messages message
    where message.id = any(p_message_ids)
      and message.conversation_id = p_conversation_id
      and message.direction = 'incoming'
      and message.processed_at is null;

  if v_message_count <> cardinality(p_message_ids) then
    raise exception 'Message batch is invalid, already processed, or belongs to another conversation';
  end if;

  insert into public.inquiries (
    conversation_id,
    status,
    source,
    primary_intent,
    intents,
    completeness,
    latest_analysis
  ) values (
    p_conversation_id,
    'awaiting_human',
    coalesce(p_analysis ->> 'source', 'unknown'),
    p_analysis ->> 'primary_intent',
    array(select jsonb_array_elements_text(coalesce(p_analysis -> 'intents', '[]'::jsonb))),
    nullif(p_analysis ->> 'completeness', '')::numeric,
    p_analysis
  )
  on conflict (conversation_id) do update set
    status = 'awaiting_human',
    source = excluded.source,
    primary_intent = excluded.primary_intent,
    intents = excluded.intents,
    completeness = excluded.completeness,
    latest_analysis = excluded.latest_analysis,
    updated_at = now()
  returning id into v_inquiry_id;

  update public.inquiry_approval_requests
    set
      status = 'expired',
      last_error = 'Superseded by a newer response proposal.',
      updated_at = now()
    where conversation_id = p_conversation_id
      and status in ('pending', 'approved');

  insert into public.inquiry_response_runs (
    inquiry_id,
    conversation_id,
    batch_key,
    message_ids,
    model,
    analysis,
    proposed_reply,
    policy_decision,
    policy_reasons
  ) values (
    v_inquiry_id,
    p_conversation_id,
    p_batch_key,
    p_message_ids,
    p_model,
    p_analysis,
    p_proposed_reply,
    p_policy_decision,
    p_policy_reasons
  )
  returning id into v_response_run_id;

  insert into public.inquiry_approval_requests (
    response_run_id,
    conversation_id,
    final_reply,
    expires_at
  ) select
    v_response_run_id,
    p_conversation_id,
    p_proposed_reply,
    least(now() + interval '48 hours', conversation.service_window_expires_at)
  from public.inquiry_conversations conversation
  where conversation.id = p_conversation_id
  returning id into v_approval_id;

  insert into public.inquiry_outbox_events (
    event_type,
    aggregate_id,
    payload,
    unique_key
  ) values (
    'inquiry.review_requested',
    v_approval_id,
    jsonb_build_object('approvalId', v_approval_id),
    'review:' || v_approval_id::text
  )
  returning id into v_review_outbox_id;

  update public.inquiry_messages
    set processed_at = now()
    where id = any(p_message_ids) and conversation_id = p_conversation_id;

  update public.inquiry_conversations
    set last_processed_at = now(), updated_at = now()
    where id = p_conversation_id;

  return jsonb_build_object(
    'inquiryId', v_inquiry_id,
    'responseRunId', v_response_run_id,
    'approvalId', v_approval_id,
    'reviewOutboxId', v_review_outbox_id,
    'duplicate', false,
    'telegramMessageId', null
  );
end;
$$;

create or replace function public.decide_inquiry_approval(
  p_approval_id uuid,
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
  v_status text;
  v_outbox_id uuid;
begin
  if p_decision not in ('approve', 'reject') then
    raise exception 'Invalid approval decision';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    select status into v_status
      from public.inquiry_approval_requests
      where id = p_approval_id;

    return jsonb_build_object('duplicate', true, 'applied', false, 'status', v_status, 'outboxId', null);
  end if;

  update public.inquiry_approval_requests
    set
      status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
      decided_by = p_approver_id,
      decided_at = now(),
      updated_at = now()
    where id = p_approval_id
      and status = 'pending'
      and expires_at > now()
    returning status into v_status;

  if v_status is null then
    update public.inquiry_approval_requests
      set status = 'expired', updated_at = now()
      where id = p_approval_id and status = 'pending' and expires_at <= now();

    select status into v_status
      from public.inquiry_approval_requests
      where id = p_approval_id;

    return jsonb_build_object('duplicate', true, 'applied', false, 'status', v_status, 'outboxId', null);
  end if;

  if v_status = 'rejected' then
    update public.inquiries inquiry
      set status = 'human_rejected', updated_at = now()
      from public.inquiry_approval_requests approval
      where approval.id = p_approval_id
        and inquiry.conversation_id = approval.conversation_id;

    update public.inquiry_conversations conversation
      set state = 'human_rejected', updated_at = now()
      from public.inquiry_approval_requests approval
      where approval.id = p_approval_id
        and conversation.id = approval.conversation_id;
  end if;

  if v_status = 'approved' then
    insert into public.inquiry_outbox_events (
      event_type,
      aggregate_id,
      payload,
      unique_key
    ) values (
      'inquiry.response_approved',
      p_approval_id,
      jsonb_build_object('approvalId', p_approval_id),
      'approval:' || p_approval_id::text
    )
    on conflict (unique_key) do update set unique_key = excluded.unique_key
    returning id into v_outbox_id;
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'applied', true,
    'status', v_status,
    'outboxId', v_outbox_id
  );
end;
$$;

create or replace function public.claim_inquiry_approval_send(p_approval_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_status text;
  v_conversation_id uuid;
  v_telegram_chat_id bigint;
  v_telegram_message_id bigint;
begin
  select approval.conversation_id
    into v_conversation_id
    from public.inquiry_approval_requests approval
    join public.inquiry_conversations conversation
      on conversation.id = approval.conversation_id
    where approval.id = p_approval_id
    for update of conversation;

  if v_conversation_id is null then
    return jsonb_build_object('claimed', false, 'status', null);
  end if;

  with claimed as (
    update public.inquiry_approval_requests approval
      set
        status = 'sending',
        send_attempts = send_attempts + 1,
        send_started_at = now(),
        updated_at = now()
      where approval.id = p_approval_id
        and approval.status = 'approved'
        and approval.response_run_id = (
          select latest_run.id
          from public.inquiry_response_runs latest_run
          where latest_run.conversation_id = approval.conversation_id
          order by latest_run.created_at desc, latest_run.id desc
          limit 1
        )
        and not exists (
          select 1
          from public.inquiry_messages pending_message
          where pending_message.conversation_id = approval.conversation_id
            and pending_message.direction = 'incoming'
            and pending_message.processed_at is null
        )
        and exists (
          select 1
          from public.inquiry_conversations send_window
          where send_window.id = approval.conversation_id
            and send_window.service_window_expires_at > now()
        )
      returning approval.*
  )
  select jsonb_build_object(
    'claimed', true,
    'approvalId', claimed.id,
    'reply', coalesce(claimed.final_reply, response_run.proposed_reply),
    'providerConversationId', conversation.provider_conversation_id,
    'providerAccountId', conversation.provider_account_id,
    'telegramChatId', case
      when claimed.telegram_chat_id is null then null
      else claimed.telegram_chat_id::text
    end,
    'telegramMessageId', claimed.telegram_message_id
  ) into v_result
  from claimed
  join public.inquiry_response_runs response_run on response_run.id = claimed.response_run_id
  join public.inquiry_conversations conversation on conversation.id = claimed.conversation_id;

  if v_result is not null then
    return v_result;
  end if;

  update public.inquiry_approval_requests approval
    set
      status = 'failed',
      last_error = 'WhatsApp 24-hour customer service window expired; an approved template is required.',
      updated_at = now()
    from public.inquiry_conversations conversation
    where approval.id = p_approval_id
      and approval.status = 'approved'
      and conversation.id = approval.conversation_id
      and conversation.service_window_expires_at <= now()
    returning 'window_expired', approval.telegram_chat_id, approval.telegram_message_id
      into v_status, v_telegram_chat_id, v_telegram_message_id;

  if v_status = 'window_expired' then
    update public.inquiries inquiry
      set status = 'needs_template', updated_at = now()
      from public.inquiry_approval_requests approval
      where approval.id = p_approval_id
        and inquiry.conversation_id = approval.conversation_id;

    return jsonb_build_object(
      'claimed', false,
      'status', v_status,
      'telegramChatId', case
        when v_telegram_chat_id is null then null
        else v_telegram_chat_id::text
      end,
      'telegramMessageId', v_telegram_message_id
    );
  end if;

  update public.inquiry_approval_requests approval
    set
      status = 'expired',
      last_error = 'Superseded by newer inbound messages or a newer response proposal.',
      updated_at = now()
    where approval.id = p_approval_id
      and approval.status = 'approved'
      and (
        approval.response_run_id <> (
          select latest_run.id
          from public.inquiry_response_runs latest_run
          where latest_run.conversation_id = approval.conversation_id
          order by latest_run.created_at desc, latest_run.id desc
          limit 1
        )
        or exists (
          select 1
          from public.inquiry_messages pending_message
          where pending_message.conversation_id = approval.conversation_id
            and pending_message.direction = 'incoming'
            and pending_message.processed_at is null
        )
      )
    returning 'superseded', approval.telegram_chat_id, approval.telegram_message_id
      into v_status, v_telegram_chat_id, v_telegram_message_id;

  if v_status = 'superseded' then
    return jsonb_build_object(
      'claimed', false,
      'status', v_status,
      'telegramChatId', case
        when v_telegram_chat_id is null then null
        else v_telegram_chat_id::text
      end,
      'telegramMessageId', v_telegram_message_id
    );
  end if;

  return jsonb_build_object(
    'claimed', false,
    'status', (select status from public.inquiry_approval_requests where id = p_approval_id)
  );
end;
$$;

create or replace function public.complete_inquiry_approval_send(
  p_approval_id uuid,
  p_provider_message_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  with completed as (
    update public.inquiry_approval_requests
      set
        status = 'sent',
        provider_message_id = p_provider_message_id,
        sent_at = now(),
        last_error = null,
        updated_at = now()
      where id = p_approval_id
        and status = 'sending'
        and btrim(p_provider_message_id) <> ''
      returning conversation_id
  )
  update public.inquiries inquiry
    set status = 'responded', updated_at = now()
    where inquiry.conversation_id in (select conversation_id from completed);
$$;

create or replace function public.fail_inquiry_approval_send(
  p_approval_id uuid,
  p_error text,
  p_uncertain boolean default false
)
returns void
language sql
security definer
set search_path = public
as $$
  with failed as (
    update public.inquiry_approval_requests
    set
      status = case when p_uncertain then 'send_uncertain' else 'failed' end,
      last_error = left(p_error, 2000),
      updated_at = now()
    where id = p_approval_id and status = 'sending'
    returning conversation_id, status
  )
  update public.inquiries inquiry
    set
      status = case
        when failed.status = 'send_uncertain' then 'send_uncertain'
        else 'send_failed'
      end,
      updated_at = now()
    from failed
    where inquiry.conversation_id = failed.conversation_id;
$$;

create or replace function public.claim_inquiry_review_notification(p_approval_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with claimed as (
    update public.inquiry_approval_requests approval
      set
        telegram_notification_status = 'sending',
        telegram_notification_started_at = now(),
        telegram_notification_error = null,
        updated_at = now()
      where approval.id = p_approval_id
        and approval.status = 'pending'
        and approval.telegram_notification_status in ('pending', 'failed')
      returning approval.*
  )
  select jsonb_build_object(
    'claimed', true,
    'approvalId', claimed.id,
    'analysis', response_run.analysis,
    'messageIds', to_jsonb(response_run.message_ids),
    'proposedReply', response_run.proposed_reply
  ) into v_result
  from claimed
  join public.inquiry_response_runs response_run on response_run.id = claimed.response_run_id;

  if v_result is not null then
    return v_result;
  end if;

  return jsonb_build_object(
    'claimed', false,
    'status', (
      select telegram_notification_status
      from public.inquiry_approval_requests
      where id = p_approval_id
    )
  );
end;
$$;

create or replace function public.complete_inquiry_review_notification(
  p_approval_id uuid,
  p_telegram_chat_id bigint,
  p_telegram_message_id bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_approval_requests
    set
      telegram_chat_id = p_telegram_chat_id,
      telegram_message_id = p_telegram_message_id,
      telegram_notification_status = 'sent',
      telegram_notification_error = null,
      updated_at = now()
    where id = p_approval_id
      and status = 'pending'
      and telegram_notification_status = 'sending';
$$;

create or replace function public.fail_inquiry_review_notification(
  p_approval_id uuid,
  p_error text,
  p_uncertain boolean default false
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_approval_requests
    set
      telegram_notification_status = case when p_uncertain then 'uncertain' else 'failed' end,
      telegram_notification_error = left(p_error, 2000),
      updated_at = now()
    where id = p_approval_id
      and status = 'pending'
      and telegram_notification_status = 'sending';
$$;

create or replace function public.claim_inquiry_outbox_event(p_outbox_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  update public.inquiry_outbox_events outbox
    set
      status = 'processing',
      attempts = attempts + 1,
      claim_token = gen_random_uuid(),
      claimed_at = now(),
      last_error = null
    where outbox.id = p_outbox_id
      and outbox.status = 'pending'
      and outbox.available_at <= now()
    returning jsonb_build_object(
      'id', outbox.id,
      'eventType', outbox.event_type,
      'aggregateId', outbox.aggregate_id,
      'payload', outbox.payload,
      'claimToken', outbox.claim_token
    ) into v_result;

  return v_result;
end;
$$;

create or replace function public.claim_pending_inquiry_outbox_events(p_limit integer default 100)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select id
    from public.inquiry_outbox_events
    where status = 'pending' and available_at <= now()
    order by created_at asc
    for update skip locked
    limit least(greatest(p_limit, 1), 100)
  ), claimed as (
    update public.inquiry_outbox_events outbox
      set
        status = 'processing',
        attempts = attempts + 1,
        claim_token = gen_random_uuid(),
        claimed_at = now(),
        last_error = null
      from candidates
      where outbox.id = candidates.id
      returning outbox.id, outbox.event_type, outbox.aggregate_id, outbox.payload, outbox.claim_token
  )
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', claimed.id,
      'eventType', claimed.event_type,
      'aggregateId', claimed.aggregate_id,
      'payload', claimed.payload,
      'claimToken', claimed.claim_token
    )),
    '[]'::jsonb
  )
  from claimed;
$$;

create or replace function public.complete_inquiry_outbox_event(
  p_outbox_id uuid,
  p_claim_token uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_outbox_events
    set
      status = 'dispatched',
      dispatched_at = now(),
      claim_token = null,
      claimed_at = null,
      last_error = null
    where id = p_outbox_id
      and status = 'processing'
      and claim_token = p_claim_token;
$$;

create or replace function public.release_inquiry_outbox_event(
  p_outbox_id uuid,
  p_claim_token uuid,
  p_error text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_outbox_events
    set
      status = case when attempts >= 10 then 'failed' else 'pending' end,
      available_at = now() + interval '1 minute',
      claim_token = null,
      claimed_at = null,
      last_error = left(p_error, 2000)
    where id = p_outbox_id
      and status = 'processing'
      and claim_token = p_claim_token;
$$;

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

  return jsonb_build_object(
    'staleSends', v_stale_sends,
    'staleReviews', v_stale_reviews,
    'staleOutbox', v_stale_outbox
  );
end;
$$;

revoke all on table public.inquiry_contacts from anon, authenticated;
revoke all on table public.inquiry_conversations from anon, authenticated;
revoke all on table public.inquiry_messages from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;
revoke all on table public.inquiry_response_runs from anon, authenticated;
revoke all on table public.inquiry_approval_requests from anon, authenticated;
revoke all on table public.inquiry_outbox_events from anon, authenticated;
revoke all on table public.inquiry_telegram_updates from anon, authenticated;

grant all on table public.inquiry_contacts to service_role;
grant all on table public.inquiry_conversations to service_role;
grant all on table public.inquiry_messages to service_role;
grant all on table public.inquiries to service_role;
grant all on table public.inquiry_response_runs to service_role;
grant all on table public.inquiry_approval_requests to service_role;
grant all on table public.inquiry_outbox_events to service_role;
grant all on table public.inquiry_telegram_updates to service_role;

revoke all on function public.ingest_zernio_message from public, anon, authenticated;
revoke all on function public.record_inquiry_analysis from public, anon, authenticated;
revoke all on function public.decide_inquiry_approval from public, anon, authenticated;
revoke all on function public.claim_inquiry_approval_send from public, anon, authenticated;
revoke all on function public.complete_inquiry_approval_send from public, anon, authenticated;
revoke all on function public.fail_inquiry_approval_send from public, anon, authenticated;
revoke all on function public.claim_inquiry_review_notification from public, anon, authenticated;
revoke all on function public.complete_inquiry_review_notification from public, anon, authenticated;
revoke all on function public.fail_inquiry_review_notification from public, anon, authenticated;
revoke all on function public.claim_inquiry_outbox_event from public, anon, authenticated;
revoke all on function public.claim_pending_inquiry_outbox_events from public, anon, authenticated;
revoke all on function public.complete_inquiry_outbox_event from public, anon, authenticated;
revoke all on function public.release_inquiry_outbox_event from public, anon, authenticated;
revoke all on function public.reconcile_stale_inquiry_work from public, anon, authenticated;

grant execute on function public.ingest_zernio_message to service_role;
grant execute on function public.record_inquiry_analysis to service_role;
grant execute on function public.decide_inquiry_approval to service_role;
grant execute on function public.claim_inquiry_approval_send to service_role;
grant execute on function public.complete_inquiry_approval_send to service_role;
grant execute on function public.fail_inquiry_approval_send to service_role;
grant execute on function public.claim_inquiry_review_notification to service_role;
grant execute on function public.complete_inquiry_review_notification to service_role;
grant execute on function public.fail_inquiry_review_notification to service_role;
grant execute on function public.claim_inquiry_outbox_event to service_role;
grant execute on function public.claim_pending_inquiry_outbox_events to service_role;
grant execute on function public.complete_inquiry_outbox_event to service_role;
grant execute on function public.release_inquiry_outbox_event to service_role;
grant execute on function public.reconcile_stale_inquiry_work to service_role;
