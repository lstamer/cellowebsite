-- Phase 2/3: business knowledge layer, reply examples (voice + corrections),
-- curated media library, and the Telegram reject-override feedback loop.

-- 1. Business knowledge ("brain") documents. Every active doc is injected into
--    the drafting prompt, so keep the corpus small and factual. Rows are edited
--    directly in Supabase Studio; seeds below never overwrite edits.
create table if not exists public.inquiry_brain_docs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (btrim(title) <> ''),
  category text not null check (
    category in ('identity', 'services', 'pricing', 'logistics', 'repertoire', 'faq', 'general')
  ),
  content text not null check (btrim(content) <> ''),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Reply examples: imported past chats plus corrections captured whenever
--    Luke rejects a draft and replies with what should have been sent. The
--    drafting stage retrieves examples whose intents overlap the current
--    enquiry, so a correction only influences similar messages.
create table if not exists public.inquiry_reply_examples (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('past_chat', 'override', 'manual')),
  intents text[] not null default '{}',
  customer_message text not null check (btrim(customer_message) <> ''),
  situation_summary text,
  rejected_draft text,
  reply text not null check (btrim(reply) <> ''),
  source text not null default 'manual',
  conversation_id uuid references public.inquiry_conversations(id) on delete set null,
  approval_id uuid references public.inquiry_approval_requests(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_reply_examples_intents_idx
  on public.inquiry_reply_examples using gin (intents);

create index if not exists inquiry_reply_examples_active_idx
  on public.inquiry_reply_examples(created_at desc)
  where active;

-- 3. Curated media assets the AI may propose to attach (never send on its own).
--    url must be publicly reachable at send time (e.g. a Supabase Storage
--    public-bucket URL). description tells the model when the asset is
--    appropriate.
create table if not exists public.inquiry_media_assets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (btrim(title) <> ''),
  description text not null check (btrim(description) <> ''),
  media_type text not null check (media_type in ('image', 'video', 'document', 'audio')),
  url text not null check (btrim(url) <> ''),
  mime_type text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.inquiry_brain_docs enable row level security;
alter table public.inquiry_reply_examples enable row level security;
alter table public.inquiry_media_assets enable row level security;

-- Lets the override RPC find the approval a Telegram reply is pointing at.
create index if not exists inquiry_approval_telegram_message_idx
  on public.inquiry_approval_requests(telegram_chat_id, telegram_message_id)
  where telegram_message_id is not null;

-- 4. Reject-override: Luke replies to a review card with the text that SHOULD
--    be sent. The override is stored as final_reply, the approval moves to
--    'approved' so the existing single-claim send machinery (with its
--    latest-run / unprocessed-message / service-window guards) delivers it,
--    and the (rejected draft -> Luke's text) pair is captured as a teaching
--    example tagged with the enquiry's intents.
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
  v_approval public.inquiry_approval_requests%rowtype;
  v_run public.inquiry_response_runs%rowtype;
  v_status text;
  v_outbox_id uuid;
  v_customer_message text;
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

  select approval.* into v_approval
    from public.inquiry_approval_requests approval
    where approval.telegram_chat_id = p_telegram_chat_id
      and approval.telegram_message_id = p_reply_to_message_id
    order by approval.created_at desc
    limit 1;

  if v_approval.id is null then
    return jsonb_build_object(
      'duplicate', false, 'applied', false, 'status', 'not_found',
      'approvalId', null, 'outboxId', null
    );
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
      'duplicate', false, 'applied', false,
      'status', (
        select status from public.inquiry_approval_requests
        where id = v_approval.id
      ),
      'approvalId', v_approval.id, 'outboxId', null
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
    'duplicate', false,
    'applied', true,
    'status', 'approved',
    'approvalId', v_approval.id,
    'outboxId', v_outbox_id
  );
end;
$$;

-- 5. The send claim now also surfaces which curated media the draft proposed,
--    read from the response run's stored analysis. Overrides send text only.
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
    'proposedMediaSlugs', case
      when claimed.final_reply is not null
        and claimed.final_reply <> response_run.proposed_reply
      then '[]'::jsonb
      else coalesce(response_run.analysis -> 'proposed_media_slugs', '[]'::jsonb)
    end,
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

-- 6. Starter brain docs. Factual, safety-first content only — Luke edits and
--    extends these rows in Supabase Studio. on conflict do nothing keeps his
--    edits authoritative over re-runs.
insert into public.inquiry_brain_docs (slug, title, category, content, sort_order)
values
  (
    'identity',
    'Who Luke is',
    'identity',
    'Luke Stamer is a professional solo cellist based in Cape Town, performing live at weddings, private events (birthdays, anniversaries, intimate dinners), and corporate functions across Cape Town and the Western Cape. Positioning: effortless live music, handled — Luke covers repertoire, gear, timing, and logistics so the host never has to think about the music. He is classically trained but happily unconventional, and his replies should feel confident, refined, and warm — never clinical or corporate.',
    10
  ),
  (
    'services',
    'Services and how bookings work',
    'services',
    'Three audiences carry equal weight: couples planning weddings (and their planners), hosts of private events, and corporate or brand event bookers. Luke performs solo cello with his own equipment and handles setup, sound, and timing himself. Typical flow: the enquirer shares the event date, type, and location; Luke confirms fit and availability personally, then agrees the details in the same WhatsApp conversation. The booking form on stamer.co.za is a fallback — WhatsApp is the preferred channel.',
    20
  ),
  (
    'pricing-policy',
    'Pricing policy (read carefully)',
    'pricing',
    'No package prices are stored here yet. NEVER state, estimate, or imply a price, quote, discount, or rate in a draft — not even a range. If pricing is asked about, the draft must say Luke will confirm pricing personally once he knows the event details (date, type, location, duration). When Luke adds versioned package pricing to this knowledge base, this document will be replaced.',
    30
  ),
  (
    'availability-policy',
    'Availability policy (read carefully)',
    'logistics',
    'There is no calendar integration yet. NEVER say a date is available, likely available, or free — the draft must say Luke will check the date and come back to confirm. Asking for the exact event date (if missing) is the single most valuable qualifying question.',
    40
  ),
  (
    'travel',
    'Travel and coverage area',
    'logistics',
    'Luke is based in Cape Town and regularly performs across the Western Cape, including the Winelands (Stellenbosch, Franschhoek, Paarl). For events further afield, the draft may say travel is usually workable and Luke will confirm the specifics — never promise travel terms or costs.',
    50
  ),
  (
    'repertoire',
    'Repertoire',
    'repertoire',
    'Luke''s repertoire spans classical works and contemporary/popular songs arranged for solo cello, and he tailors the set to the event and the couple''s or host''s taste. Specific song requests are welcome; the draft may say Luke will confirm whether a particular piece is in his book or can be arranged. Do not promise a specific song sight unseen.',
    60
  )
on conflict (slug) do nothing;
