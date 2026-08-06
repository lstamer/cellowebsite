-- Phase 6: the redraft loop.
--
-- Until now a Telegram review card offered two terminal answers: Approve sends
-- the draft as written, Dismiss sends nothing. The only way to change a word
-- was to retype the whole reply. This migration adds the third answer: tap
-- "✏️ Suggest changes", talk into a voicenote, get a new draft back on a new
-- card carrying the same three buttons — and repeat, indefinitely.
--
-- `inquiry_suggest_change_requests` is the state between the tap and the new
-- card. One row per revision, holding:
--   * which draft is being revised (`source_draft`, captured at open time, so a
--     later approval of a stale card can still be explained),
--   * what Luke asked for on THIS revision (`instructions`),
--   * what he asked for on every earlier one (`instruction_history`) — without
--     which revision 3 would silently undo the correction made at revision 1.
--
-- Both draft paths are supported, and they live in different tables:
--   * inbound WhatsApp  -> public.inquiry_approval_requests (status 'pending'),
--     draft text on public.inquiry_response_runs.proposed_reply
--   * website form lead -> public.inquiry_website_leads (status 'draft_ready'),
--     draft text on inquiry_website_leads.draft_reply
--
-- THE STALE-CARD INVARIANT: a completed redraft writes the new text back into
-- the TARGET table, never into the request row alone. Both approve paths read
-- the draft from the target at decision time (`decide_inquiry_approval` hands
-- the send worker `coalesce(final_reply, proposed_reply)`;
-- `decide_website_lead_draft` returns `coalesce(final_reply, draft_reply)`), so
-- tapping Approve on revision 1's card that is still sitting in the chat sends
-- the newest draft, not the one printed on that card. Card identity never
-- determines what gets sent.

-- ---------------------------------------------------------------------------
-- The request
-- ---------------------------------------------------------------------------

create table if not exists public.inquiry_suggest_change_requests (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in ('approval', 'website_lead')),
  approval_id uuid references public.inquiry_approval_requests(id) on delete cascade,
  website_lead_id uuid references public.inquiry_website_leads(id) on delete cascade,
  status text not null default 'awaiting_instructions' check (
    status in ('awaiting_instructions', 'drafting', 'completed', 'cancelled', 'expired')
  ),
  -- 1 for the first redraft of a target, 2 for a redraft of that redraft, and
  -- so on. Only a completed request advances the count: a cancelled one
  -- produced no draft, so it did not consume a revision.
  revision integer not null default 1 check (revision >= 1),
  -- The transcript (or typed text) for THIS revision.
  instructions text check (instructions is null or btrim(instructions) <> ''),
  -- Every instruction from the earlier revisions of the same target, oldest
  -- first: [{"revision": 1, "instructions": "...", "recordedAt": "..."}].
  -- The drafting model reads this so a later redraft cannot quietly undo an
  -- earlier correction.
  instruction_history jsonb not null default '[]'::jsonb
    check (jsonb_typeof(instruction_history) = 'array'),
  -- The draft as it stood when the button was tapped. Kept for the teaching
  -- record and so the prompt card can quote what is actually being revised.
  source_draft text,
  requested_by text not null,
  telegram_chat_id bigint not null,
  -- The "send me a voicenote" prompt, so it can be repainted when the request
  -- is superseded, cancelled or expired.
  prompt_message_id bigint,
  -- The new review card this request produced, once it completes.
  card_message_id bigint,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The same paired XOR the override confirmations use: the kind and the
  -- populated foreign key can never disagree, in either direction.
  check ((target_kind = 'approval') = (approval_id is not null)),
  check ((target_kind = 'website_lead') = (website_lead_id is not null))
);

-- The webhook hot path: every bare Telegram message (voicenote or typed) asks
-- "is there an open request in this chat?" before anything else, and the
-- supersede sweep in `open_suggest_change_request` asks the same question.
-- Without this the probe scans every request ever made; the partial predicate
-- keeps the index to the handful of unresolved rows, and created_at desc is the
-- newest-wins order both callers use.
create index if not exists inquiry_suggest_change_requests_open_chat_idx
  on public.inquiry_suggest_change_requests(telegram_chat_id, created_at desc)
  where status in ('awaiting_instructions', 'drafting');

-- Per-target history lookups: opening a request computes the next revision from
-- this target's completed requests, and recording instructions pulls the
-- previous revision's accumulated history from the same set. Both are keyed by
-- the target id and ordered by revision.
create index if not exists inquiry_suggest_change_requests_approval_idx
  on public.inquiry_suggest_change_requests(approval_id, revision desc)
  where approval_id is not null;

create index if not exists inquiry_suggest_change_requests_lead_idx
  on public.inquiry_suggest_change_requests(website_lead_id, revision desc)
  where website_lead_id is not null;

-- The reconcile cron sweeps unresolved requests by deadline every few minutes,
-- across all chats. Mirrors inquiry_website_leads_open_idx: the partial
-- predicate keeps the sweep off the ever-growing completed rows.
create index if not exists inquiry_suggest_change_requests_expiry_idx
  on public.inquiry_suggest_change_requests(expires_at)
  where status in ('awaiting_instructions', 'drafting');

alter table public.inquiry_suggest_change_requests enable row level security;

-- ---------------------------------------------------------------------------
-- Outbox event types gain the redraft driver.
--
-- CHECK constraints cannot be extended in place, so the constraint added by
-- 202608060001:153-166 is dropped and re-added with the full list. The new
-- string matches `OutboxRow["eventType"]` in src/lib/inquiries/schema.ts
-- character for character.
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
      'inquiry.redraft_requested',
      'website_lead.availability_decided'
    )
  );

-- ---------------------------------------------------------------------------
-- Open: the ✏️ button tap
-- ---------------------------------------------------------------------------

-- Validates that the draft is still worth revising, snapshots it, and clears
-- any other open request in the chat out of the way.
--
-- The supersede is what makes the next voicenote unambiguous: instructions
-- arrive as a bare message with nothing tying them to a request, so exactly one
-- request per chat may be waiting for them. The cancelled requests' prompt
-- message ids come back so the caller can repaint those prompts, mirroring
-- `stage_inquiry_override`'s `supersededPrompts`.
create or replace function public.open_suggest_change_request(
  p_target_kind text,
  p_target_id uuid,
  p_telegram_chat_id bigint,
  p_requested_by text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_name text;
  v_draft text;
  v_revision integer;
  v_superseded jsonb;
  v_request_id uuid;
begin
  if p_target_kind not in ('approval', 'website_lead') then
    raise exception 'Invalid suggest-change target kind: %', p_target_kind;
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    return jsonb_build_object('duplicate', true, 'opened', false, 'reason', 'duplicate');
  end if;

  if p_target_kind = 'approval' then
    -- final_reply is null while an approval is pending (it is only written by
    -- an override, which approves in the same statement), but coalescing keeps
    -- this honest about which text the send worker would actually use.
    select
      coalesce(contact.display_name, 'the customer'),
      coalesce(approval.final_reply, response_run.proposed_reply)
      into v_target_name, v_draft
      from public.inquiry_approval_requests approval
      join public.inquiry_response_runs response_run
        on response_run.id = approval.response_run_id
      join public.inquiry_conversations conversation
        on conversation.id = approval.conversation_id
      left join public.inquiry_contacts contact
        on contact.id = conversation.contact_id
      where approval.id = p_target_id
        and approval.status = 'pending'
        and approval.expires_at > now();
  else
    select lead.first_name, coalesce(lead.final_reply, lead.draft_reply)
      into v_target_name, v_draft
      from public.inquiry_website_leads lead
      where lead.id = p_target_id
        and lead.status = 'draft_ready'
        and lead.expires_at > now();
  end if;

  if not found then
    return jsonb_build_object(
      'duplicate', false, 'opened', false, 'reason', 'target_not_actionable'
    );
  end if;

  if btrim(coalesce(v_draft, '')) = '' then
    return jsonb_build_object('duplicate', false, 'opened', false, 'reason', 'no_draft');
  end if;

  select coalesce(max(prior.revision), 0) + 1
    into v_revision
    from public.inquiry_suggest_change_requests prior
    where prior.status = 'completed'
      and (
        (p_target_kind = 'approval' and prior.approval_id = p_target_id)
        or (p_target_kind = 'website_lead' and prior.website_lead_id = p_target_id)
      );

  with superseded as (
    update public.inquiry_suggest_change_requests request
      set status = 'cancelled', updated_at = now()
      where request.telegram_chat_id = p_telegram_chat_id
        and request.status in ('awaiting_instructions', 'drafting')
      returning request.id, request.prompt_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'requestId', superseded.id,
    'promptMessageId', superseded.prompt_message_id
  )), '[]'::jsonb)
  into v_superseded
  from superseded;

  insert into public.inquiry_suggest_change_requests (
    target_kind,
    approval_id,
    website_lead_id,
    revision,
    source_draft,
    requested_by,
    telegram_chat_id
  ) values (
    p_target_kind,
    case when p_target_kind = 'approval' then p_target_id else null end,
    case when p_target_kind = 'website_lead' then p_target_id else null end,
    v_revision,
    v_draft,
    p_requested_by,
    p_telegram_chat_id
  )
  returning id into v_request_id;

  return jsonb_build_object(
    'duplicate', false,
    'opened', true,
    'requestId', v_request_id,
    'targetKind', p_target_kind,
    'targetName', v_target_name,
    'currentDraft', v_draft,
    'revision', v_revision,
    'supersededPrompts', v_superseded,
    'reason', null
  );
end;
$$;

-- Same role as `attach_override_confirmation_prompt`: the prompt has to be sent
-- before Telegram tells us its message id, so the id is stitched on afterwards.
create or replace function public.attach_suggest_change_prompt(
  p_request_id uuid,
  p_prompt_message_id bigint
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.inquiry_suggest_change_requests
    set prompt_message_id = p_prompt_message_id, updated_at = now()
    where id = p_request_id
      and status = 'awaiting_instructions'
      and prompt_message_id is null;
$$;

-- ---------------------------------------------------------------------------
-- Record: the voicenote (or typed notes) arrive
-- ---------------------------------------------------------------------------

-- Binds a bare inbound message to the newest waiting request in that chat.
--
-- Returning `no_open_request` rather than swallowing the message is the whole
-- contract with the caller: a bare message with nothing waiting for it is still
-- a bare-message override, and the webhook falls through to
-- `stage_inquiry_override` on that reason.
create or replace function public.record_suggest_change_instructions(
  p_telegram_chat_id bigint,
  p_instructions text,
  p_requested_by text,
  p_telegram_update_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.inquiry_suggest_change_requests%rowtype;
  v_history jsonb;
begin
  if btrim(coalesce(p_instructions, '')) = '' then
    raise exception 'Suggest-change instructions cannot be blank';
  end if;

  insert into public.inquiry_telegram_updates(update_id)
    values (p_telegram_update_id)
    on conflict (update_id) do nothing;

  if not found then
    -- A replay must not bind a second time, and must not report
    -- `no_open_request` either: that would send the caller down the
    -- bare-message override path with a message it already handled.
    return jsonb_build_object('duplicate', true, 'bound', false, 'reason', 'duplicate');
  end if;

  update public.inquiry_suggest_change_requests
    set status = 'expired', updated_at = now()
    where telegram_chat_id = p_telegram_chat_id
      and status = 'awaiting_instructions'
      and expires_at <= now();

  -- `for update` serialises two voicenotes racing into the same chat: the
  -- loser blocks, re-checks the qual after the winner commits, finds the row is
  -- no longer awaiting, and falls through as `no_open_request` instead of
  -- overwriting the first transcript.
  select request.* into v_request
    from public.inquiry_suggest_change_requests request
    where request.telegram_chat_id = p_telegram_chat_id
      and request.status = 'awaiting_instructions'
      and request.expires_at > now()
    order by request.created_at desc
    limit 1
    for update;

  if v_request.id is null then
    return jsonb_build_object(
      'duplicate', false, 'bound', false, 'reason', 'no_open_request'
    );
  end if;

  -- Append the previous revision's instruction to the history it had already
  -- accumulated. Only completed requests count: an instruction that never
  -- reached a draft is one Luke abandoned, and replaying it would resurrect a
  -- correction he walked away from.
  select coalesce(prior.instruction_history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'revision', prior.revision,
        'instructions', prior.instructions,
        'recordedAt', prior.updated_at
      )
    )
    into v_history
    from public.inquiry_suggest_change_requests prior
    where prior.status = 'completed'
      and prior.instructions is not null
      and prior.id <> v_request.id
      and (
        (v_request.target_kind = 'approval' and prior.approval_id = v_request.approval_id)
        or (
          v_request.target_kind = 'website_lead'
          and prior.website_lead_id = v_request.website_lead_id
        )
      )
    order by prior.revision desc, prior.created_at desc
    limit 1;

  update public.inquiry_suggest_change_requests request
    set
      status = 'drafting',
      instructions = btrim(p_instructions),
      instruction_history = coalesce(v_history, '[]'::jsonb),
      requested_by = p_requested_by,
      updated_at = now()
    where request.id = v_request.id
      and request.status = 'awaiting_instructions'
    returning request.* into v_request;

  if v_request.id is null then
    return jsonb_build_object(
      'duplicate', false, 'bound', false, 'reason', 'no_open_request'
    );
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'bound', true,
    'requestId', v_request.id,
    'targetKind', v_request.target_kind,
    'targetId', coalesce(v_request.approval_id, v_request.website_lead_id),
    'revision', v_request.revision,
    'sourceDraft', v_request.source_draft,
    'instructionHistory', v_request.instruction_history,
    'reason', null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Complete: the new draft replaces the old one
-- ---------------------------------------------------------------------------

-- Writes the redraft into the TARGET table, which is what makes every card
-- still sitting in the chat safe to tap: Approve reads the target, so the
-- newest text wins no matter which revision's card Luke pressed.
create or replace function public.complete_suggest_change_request(
  p_request_id uuid,
  p_new_draft text,
  p_card_message_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.inquiry_suggest_change_requests%rowtype;
  v_written integer;
begin
  if btrim(coalesce(p_new_draft, '')) = '' then
    raise exception 'Redrafted reply cannot be blank';
  end if;

  update public.inquiry_suggest_change_requests request
    set
      status = 'completed',
      card_message_id = p_card_message_id,
      updated_at = now()
    where request.id = p_request_id
      and request.status = 'drafting'
    returning request.* into v_request;

  if v_request.id is null then
    return jsonb_build_object(
      'completed', false,
      'reason', coalesce(
        (select status from public.inquiry_suggest_change_requests where id = p_request_id),
        'not_found'
      )
    );
  end if;

  if v_request.target_kind = 'approval' then
    update public.inquiry_response_runs response_run
      set proposed_reply = btrim(p_new_draft)
      from public.inquiry_approval_requests approval
      where approval.id = v_request.approval_id
        and response_run.id = approval.response_run_id
        -- Approve or Dismiss may have landed while the model was drafting; the
        -- decision that got there first stands.
        and approval.status = 'pending'
        and approval.expires_at > now();
  else
    update public.inquiry_website_leads lead
      set draft_reply = btrim(p_new_draft), updated_at = now()
      where lead.id = v_request.website_lead_id
        and lead.status = 'draft_ready'
        and lead.expires_at > now();
  end if;

  get diagnostics v_written = row_count;

  if v_written = 0 then
    -- Nothing to revise any more. Roll the request back out of 'completed' so
    -- the loop does not look like it produced a draft it never applied.
    update public.inquiry_suggest_change_requests
      set status = 'cancelled', updated_at = now()
      where id = p_request_id;

    return jsonb_build_object('completed', false, 'reason', 'target_not_actionable');
  end if;

  return jsonb_build_object(
    'completed', true,
    'reason', null,
    'requestId', v_request.id,
    'targetKind', v_request.target_kind,
    'targetId', coalesce(v_request.approval_id, v_request.website_lead_id),
    'revision', v_request.revision
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Cancel: the 🚫 button on the prompt
-- ---------------------------------------------------------------------------

create or replace function public.cancel_suggest_change_request(
  p_request_id uuid,
  p_requested_by text,
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
      from public.inquiry_suggest_change_requests
      where id = p_request_id;

    return jsonb_build_object('duplicate', true, 'cancelled', false, 'status', v_status);
  end if;

  update public.inquiry_suggest_change_requests
    set status = 'cancelled', requested_by = p_requested_by, updated_at = now()
    where id = p_request_id
      and status in ('awaiting_instructions', 'drafting')
    returning status into v_status;

  if v_status is null then
    return jsonb_build_object(
      'duplicate', true,
      'cancelled', false,
      'status', (
        select status from public.inquiry_suggest_change_requests where id = p_request_id
      )
    );
  end if;

  return jsonb_build_object('duplicate', false, 'cancelled', true, 'status', v_status);
end;
$$;

-- ---------------------------------------------------------------------------
-- Read: is this chat waiting on anything?
-- ---------------------------------------------------------------------------

create or replace function public.get_open_suggest_change_request(
  p_telegram_chat_id bigint
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'requestId', request.id,
    'targetKind', request.target_kind,
    'targetId', coalesce(request.approval_id, request.website_lead_id),
    'status', request.status,
    'revision', request.revision,
    'sourceDraft', request.source_draft,
    'instructions', request.instructions,
    'instructionHistory', request.instruction_history,
    'promptMessageId', request.prompt_message_id,
    'expiresAt', request.expires_at
  )
  from public.inquiry_suggest_change_requests request
  where request.telegram_chat_id = p_telegram_chat_id
    and request.status in ('awaiting_instructions', 'drafting')
    and request.expires_at > now()
  order by request.created_at desc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Recovery
--
-- SUPERSEDES the definition in 202608060001:1725-1944. That file cannot be
-- edited, so the body is reproduced verbatim with one branch added: an
-- unresolved redraft request past its deadline is expired and its prompt
-- reported, so the "send me a voicenote" message can be repainted instead of
-- hanging in the chat forever. Return keys stay additive.
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
  v_expired_suggest_change_prompts jsonb;
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

  -- Added by 202608070002: a redraft request nobody answered (no voicenote
  -- arrived) or that the drafting task never finished.
  with expired_requests as (
    update public.inquiry_suggest_change_requests request
      set status = 'expired', updated_at = now()
      where request.status in ('awaiting_instructions', 'drafting')
        and request.expires_at <= now()
      returning request.id,
        request.telegram_chat_id,
        request.prompt_message_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'requestId', expired_requests.id,
    'telegramChatId', expired_requests.telegram_chat_id::text,
    'promptMessageId', expired_requests.prompt_message_id
  )), '[]'::jsonb)
  into v_expired_suggest_change_prompts
  from expired_requests;

  return jsonb_build_object(
    'staleSends', v_stale_sends,
    'staleReviews', v_stale_reviews,
    'staleOutbox', v_stale_outbox,
    'staleLeadWork', v_stale_lead_work,
    'expiredAvailabilityCards', v_expired_availability_cards,
    'expiredLeadCards', v_expired_lead_cards,
    'expiredOverridePrompts', v_expired_override_prompts,
    'expiredSuggestChangePrompts', v_expired_suggest_change_prompts
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on table public.inquiry_suggest_change_requests from anon, authenticated;
grant all on table public.inquiry_suggest_change_requests to service_role;

revoke all on function public.open_suggest_change_request from public, anon, authenticated;
revoke all on function public.attach_suggest_change_prompt from public, anon, authenticated;
revoke all on function public.record_suggest_change_instructions from public, anon, authenticated;
revoke all on function public.complete_suggest_change_request from public, anon, authenticated;
revoke all on function public.cancel_suggest_change_request from public, anon, authenticated;
revoke all on function public.get_open_suggest_change_request from public, anon, authenticated;
revoke all on function public.reconcile_stale_inquiry_work from public, anon, authenticated;

grant execute on function public.open_suggest_change_request to service_role;
grant execute on function public.attach_suggest_change_prompt to service_role;
grant execute on function public.record_suggest_change_instructions to service_role;
grant execute on function public.complete_suggest_change_request to service_role;
grant execute on function public.cancel_suggest_change_request to service_role;
grant execute on function public.get_open_suggest_change_request to service_role;
grant execute on function public.reconcile_stale_inquiry_work to service_role;
