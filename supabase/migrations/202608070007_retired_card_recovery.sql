-- Phase 7: putting back an Approve button the redraft took away.
--
-- THE HAZARD THIS CLOSES.
--
-- `process-suggest-change` retires the source card's Approve button BEFORE it
-- writes the revision, and that ordering is correct: Approve sends whatever the
-- target row holds when it is TAPPED, so the instant the revision lands the old
-- button starts offering text Luke has never read. Stripping it first is what
-- closes that window, and writing before posting the new card is what stops a
-- card quoting text the target does not contain. Both halves stay exactly as
-- they are.
--
-- The gap is the failure path BETWEEN them. If anything throws after the retire
-- and before or during the write, nothing is written (correct) but the source
-- card has permanently lost its Approve button. Nothing in the system put it
-- back:
--   * the cardless sweep added by 202608070006 only matches
--     `request.status = 'completed'`, which this row never reaches,
--   * `reopen_suggest_change_request` (202608070004) returns the request to
--     'awaiting_instructions' and never touches the card,
--   * and the task's `onFailure` then told Luke to check "the newest card"
--     before approving it, a card he could no longer approve.
--
-- The result was a live customer enquiry, a card with no way to say yes, and no
-- route forward except noticing that a manual swipe-reply override still works.
--
-- WHAT THIS ADDS.
--   1. `retired_card_chat_id` / `retired_card_message_id` on the request, written
--      at the moment the button is stripped, so recovery knows exactly which
--      message to repair rather than guessing from the target's current pointer.
--   2. `record_retired_suggest_change_card` to write them and
--      `clear_retired_suggest_change_card` to drop them once the card is either
--      restored or deliberately superseded by a completed redraft.
--   3. A `retiredApproveCards` branch on `reconcile_stale_inquiry_work`, so the
--      repair happens on the cron even when `onFailure` itself never runs.
--
-- WHEN RESTORING IS CORRECT. Only when the redraft did NOT write. A completed
-- request means the target now holds a revision Luke has not read, and putting
-- Approve back on the old card would reintroduce the exact hazard the retire
-- exists to prevent. Every path here is gated on the request not being
-- 'completed'; a completed redraft posts its own new card and the old one stays
-- retired for good.

-- ---------------------------------------------------------------------------
-- Where the retired card is remembered
-- ---------------------------------------------------------------------------

-- Deliberately NOT derived from the target's own `telegram_message_id` at
-- recovery time. `attach_suggest_change_card` repoints that pointer at the
-- newest card, so by the time anything looks the pointer may name a different
-- message; and a redraft that failed before writing never repointed anything,
-- which makes the two indistinguishable from the outside. The coordinates are
-- recorded at the moment of the strip because that is the only moment they are
-- unambiguous.
alter table public.inquiry_suggest_change_requests
  add column if not exists retired_card_chat_id bigint;

alter table public.inquiry_suggest_change_requests
  add column if not exists retired_card_message_id bigint;

comment on column public.inquiry_suggest_change_requests.retired_card_message_id is
  'The review card whose Approve button this redraft stripped before writing. Non-null means a card in the chat is missing its Approve; it is cleared once the button is restored, or once a completed redraft supersedes that card for good.';

-- The recovery sweep: rows carrying a retired card that never got it back. The
-- partial predicate keeps it off every request ever made, and `updated_at` is
-- the ordering the age floor filters on.
create index if not exists inquiry_suggest_change_requests_retired_card_idx
  on public.inquiry_suggest_change_requests(updated_at)
  where retired_card_message_id is not null and status <> 'completed';

-- ---------------------------------------------------------------------------
-- Record: the strip is about to happen
-- ---------------------------------------------------------------------------

-- Called BEFORE the Telegram edit, not after.
--
-- Recording first means the two failure directions are not symmetric, and the
-- asymmetry is the point. Record-then-strip can leave coordinates for a button
-- that is still there: recovery re-sets a keyboard that already matches,
-- Telegram answers "message is not modified", and the caller treats that as
-- success. Strip-then-record can leave a stripped button nobody recorded, which
-- is the unrecoverable state this whole migration exists to remove.
--
-- Only while the request is 'drafting', which is the only status under which a
-- retire is legitimate. A caller that gets `recorded` false must NOT strip the
-- button: the request left drafting, so the write is going to be refused
-- anyway, and stripping would take Approve off a card that keeps its draft.
create or replace function public.record_retired_suggest_change_card(
  p_request_id uuid,
  p_chat_id bigint,
  p_message_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_chat_id is null or p_message_id is null then
    return jsonb_build_object('recorded', false, 'reason', 'no_card');
  end if;

  update public.inquiry_suggest_change_requests request
    set
      retired_card_chat_id = p_chat_id,
      retired_card_message_id = p_message_id,
      updated_at = now()
    where request.id = p_request_id
      and request.status = 'drafting'
    returning request.id into v_id;

  if v_id is null then
    return jsonb_build_object(
      'recorded', false,
      'reason', coalesce(
        (select status from public.inquiry_suggest_change_requests where id = p_request_id),
        'not_found'
      )
    );
  end if;

  return jsonb_build_object('recorded', true, 'reason', null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Clear: the card no longer needs repairing
-- ---------------------------------------------------------------------------

-- Two callers, one meaning: stop offering this card to the recovery sweep.
--
--   * after a SUCCESSFUL redraft, because a completed redraft posts a new card
--     and the old one is supposed to stay retired forever. The sweep already
--     skips 'completed' rows; clearing is what keeps that true if the row is
--     ever rolled back out of 'completed' by a later repair.
--   * after a SUCCESSFUL restore, so the next cron tick does not keep editing a
--     keyboard that is already correct.
--
-- Never gated on status: the caller has already decided, and a clear that
-- refused to run would leave the sweep repeating forever.
create or replace function public.clear_retired_suggest_change_card(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.inquiry_suggest_change_requests request
    set
      retired_card_chat_id = null,
      retired_card_message_id = null,
      updated_at = now()
    where request.id = p_request_id
      and request.retired_card_message_id is not null
    returning request.id into v_id;

  return jsonb_build_object('cleared', v_id is not null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Reopen: now also hands back the card that needs its Approve button
--
-- SUPERSEDES the definition in 202608070004:502-528. The rollback out of
-- 'drafting' is unchanged, character for character; the return gains the
-- retired card's coordinates and the target it belongs to, so the caller can
-- repair the card in the same breath as it reopens the request instead of
-- waiting for the cron.
--
-- The coordinates come back ONLY when the row is not 'completed'. A completed
-- request wrote its revision, so its old Approve button must stay retired; the
-- caller is handed nothing to restore rather than being trusted to check.
-- ---------------------------------------------------------------------------

create or replace function public.reopen_suggest_change_request(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.inquiry_suggest_change_requests%rowtype;
  v_previous text;
  v_reopened boolean;
begin
  select request.* into v_request
    from public.inquiry_suggest_change_requests request
    where request.id = p_request_id;

  if v_request.id is null then
    return jsonb_build_object('reopened', false, 'previousStatus', null);
  end if;

  v_previous := v_request.status;

  update public.inquiry_suggest_change_requests
    set status = 'awaiting_instructions', updated_at = now()
    where id = p_request_id
      and status = 'drafting';

  v_reopened := found;

  return jsonb_build_object(
    'reopened', v_reopened,
    'previousStatus', v_previous,
    'targetKind', v_request.target_kind,
    'targetId', coalesce(v_request.approval_id, v_request.website_lead_id),
    'retiredCardChatId', case
      when v_previous = 'completed' or v_request.retired_card_chat_id is null then null
      else v_request.retired_card_chat_id::text
    end,
    'retiredCardMessageId', case
      when v_previous = 'completed' then null
      else v_request.retired_card_message_id
    end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Recovery
--
-- SUPERSEDES the definition in 202608070006:324-659 (which superseded
-- 202608070002:584-824, which superseded 202608060001:1725-1944). Those files
-- cannot be edited, so that body is reproduced verbatim with one branch added:
-- a card whose Approve button was stripped for a redraft that never wrote is
-- reported, so the cron can put the keyboard back. Return keys stay additive.
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
  v_cardless_redrafts jsonb;
  v_retired_approve_cards jsonb;
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

  -- Added by 202608070006: THE REDRAFT THAT LANDED WITHOUT A CARD.
  --
  -- `complete_suggest_change_request` commits the revision into the target
  -- table; the card is posted afterwards and its id stitched on by
  -- `attach_suggest_change_card`. When the send fails (flood control, a 5xx, a
  -- dead network) the request is left 'completed' with `card_message_id` null:
  -- the target holds a revision, and until this sweep existed nothing in the
  -- system looked for that state or ever put the revision in front of Luke.
  -- Reporting it lets the cron post the card that failed, minutes later and
  -- over a connection that is no longer the one that just broke.
  --
  -- READ-ONLY on purpose. Nothing is marked, claimed or leased: the repair is
  -- posting a card, and `attach_suggest_change_card` only ever attaches to a
  -- request whose `card_message_id` is still null, so the row leaves this set
  -- exactly when the card lands. A row that keeps failing is simply reported
  -- again on the next tick until its target expires.
  --
  -- The two-minute floor keeps the sweep off the task's own back: a run that
  -- has just written its draft is still trying to post, and its retries are
  -- exhausted inside 30 seconds.
  --
  -- Only ACTIONABLE targets. If the approval was already sent, dismissed or
  -- aged out there is no button left to mislabel and no card worth posting, so
  -- those rows are ignored rather than repaired — and never touched, so nothing
  -- rewrites the history of a decision Luke already made.
  with cardless as (
    select
      request.id as request_id,
      request.telegram_chat_id as telegram_chat_id,
      request.target_kind as target_kind,
      coalesce(request.approval_id, request.website_lead_id) as target_id,
      request.revision as revision,
      coalesce(request.instructions, '') as instructions,
      coalesce(contact.display_name, 'the customer') as target_name,
      coalesce(approval.final_reply, response_run.proposed_reply) as draft,
      coalesce(response_run.analysis -> 'proposed_media_slugs', '[]'::jsonb) as media_slugs
      from public.inquiry_suggest_change_requests request
      join public.inquiry_approval_requests approval
        on approval.id = request.approval_id
      join public.inquiry_response_runs response_run
        on response_run.id = approval.response_run_id
      join public.inquiry_conversations conversation
        on conversation.id = approval.conversation_id
      left join public.inquiry_contacts contact
        on contact.id = conversation.contact_id
      where request.target_kind = 'approval'
        and request.status = 'completed'
        and request.card_message_id is null
        and request.updated_at < now() - interval '2 minutes'
        and approval.status = 'pending'
        and approval.expires_at > now()
    union all
    select
      request.id,
      request.telegram_chat_id,
      request.target_kind,
      coalesce(request.approval_id, request.website_lead_id),
      request.revision,
      coalesce(request.instructions, ''),
      lead.first_name,
      coalesce(lead.final_reply, lead.draft_reply),
      '[]'::jsonb
      from public.inquiry_suggest_change_requests request
      join public.inquiry_website_leads lead
        on lead.id = request.website_lead_id
      where request.target_kind = 'website_lead'
        and request.status = 'completed'
        and request.card_message_id is null
        and request.updated_at < now() - interval '2 minutes'
        and lead.status = 'draft_ready'
        and lead.expires_at > now()
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'requestId', cardless.request_id,
    'telegramChatId', cardless.telegram_chat_id::text,
    'targetKind', cardless.target_kind,
    'targetId', cardless.target_id,
    'revision', cardless.revision,
    'targetName', cardless.target_name,
    'instructions', cardless.instructions,
    'draft', cardless.draft,
    'mediaSlugs', cardless.media_slugs
  )), '[]'::jsonb)
  into v_cardless_redrafts
  from cardless
  -- A blank draft cannot be a card. `complete_suggest_change_request` rejects
  -- one, so this only ever excludes a target whose text vanished by some other
  -- route; posting an empty revision would be worse than posting nothing.
  -- Blank INSTRUCTIONS are not filtered: the CHECK constraint makes them
  -- unreachable on a completed request, and a card with an odd empty quote
  -- still beats a revision Luke never sees.
  where btrim(coalesce(cardless.draft, '')) <> '';

  -- Added by 202608070007: THE CARD THAT LOST ITS APPROVE BUTTON.
  --
  -- The mirror image of the sweep above. There the write landed and the card
  -- did not; here the card was stripped and the write never landed, so the
  -- target still holds exactly the text its card prints and the only thing
  -- missing is the button to say yes to it.
  --
  -- `status <> 'completed'` IS the safety gate, not a filter. A completed
  -- request means the target holds a revision Luke has not read; restoring
  -- Approve there would hand him a one-tap send of unseen model output, which
  -- is the precise hazard the retire was invented to prevent. Cancelled,
  -- expired, drafting and reopened rows all share the one property that makes
  -- restoring safe: no revision was ever written.
  --
  -- The two-minute floor on `updated_at` keeps the sweep off a live run. The
  -- strip and the write are consecutive statements, and recording the strip
  -- bumps `updated_at`, so an in-flight redraft cannot appear here; a retry
  -- that re-records pushes the floor out again.
  --
  -- Only ACTIONABLE targets, for the same reason as above: a decided or
  -- expired target has nothing left to approve, so restoring the button would
  -- be noise on a card that no longer matters. Those rows keep their recorded
  -- coordinates and simply never surface, rather than being reported forever.
  --
  -- READ-ONLY, again on purpose. The row leaves this set when the caller calls
  -- `clear_retired_suggest_change_card` after a successful restore; a restore
  -- that keeps failing is reported again next tick, and a restore that lands
  -- twice is a no-op Telegram answers with "message is not modified".
  with retired as (
    select
      request.id as request_id,
      request.retired_card_chat_id as chat_id,
      request.retired_card_message_id as message_id,
      request.target_kind as target_kind,
      coalesce(request.approval_id, request.website_lead_id) as target_id
      from public.inquiry_suggest_change_requests request
      join public.inquiry_approval_requests approval
        on approval.id = request.approval_id
      where request.target_kind = 'approval'
        and request.status <> 'completed'
        and request.retired_card_message_id is not null
        and request.updated_at < now() - interval '2 minutes'
        and approval.status = 'pending'
        and approval.expires_at > now()
    union all
    select
      request.id,
      request.retired_card_chat_id,
      request.retired_card_message_id,
      request.target_kind,
      coalesce(request.approval_id, request.website_lead_id)
      from public.inquiry_suggest_change_requests request
      join public.inquiry_website_leads lead
        on lead.id = request.website_lead_id
      where request.target_kind = 'website_lead'
        and request.status <> 'completed'
        and request.retired_card_message_id is not null
        and request.updated_at < now() - interval '2 minutes'
        and lead.status = 'draft_ready'
        and lead.expires_at > now()
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'requestId', retired.request_id,
    'telegramChatId', retired.chat_id::text,
    'messageId', retired.message_id,
    'targetKind', retired.target_kind,
    'targetId', retired.target_id
  )), '[]'::jsonb)
  into v_retired_approve_cards
  from retired
  -- A recorded message id with no chat id cannot be edited. Unreachable through
  -- `record_retired_suggest_change_card`, which refuses a null of either, but a
  -- row that somehow held one would otherwise be reported every three minutes
  -- for a repair that cannot be attempted.
  where retired.chat_id is not null;

  return jsonb_build_object(
    'staleSends', v_stale_sends,
    'staleReviews', v_stale_reviews,
    'staleOutbox', v_stale_outbox,
    'staleLeadWork', v_stale_lead_work,
    'expiredAvailabilityCards', v_expired_availability_cards,
    'expiredLeadCards', v_expired_lead_cards,
    'expiredOverridePrompts', v_expired_override_prompts,
    'expiredSuggestChangePrompts', v_expired_suggest_change_prompts,
    'cardlessRedrafts', v_cardless_redrafts,
    'retiredApproveCards', v_retired_approve_cards
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
--
-- Repeated from the migrations these definitions supersede, plus the two new
-- functions. `create or replace` preserves existing grants, so the repeats are
-- a no-op on a database that already ran them and the correct grants on one
-- restored from a dump that did not.
-- ---------------------------------------------------------------------------

revoke all on function public.record_retired_suggest_change_card
  from public, anon, authenticated;
revoke all on function public.clear_retired_suggest_change_card
  from public, anon, authenticated;
revoke all on function public.reopen_suggest_change_request
  from public, anon, authenticated;
revoke all on function public.reconcile_stale_inquiry_work
  from public, anon, authenticated;

grant execute on function public.record_retired_suggest_change_card to service_role;
grant execute on function public.clear_retired_suggest_change_card to service_role;
grant execute on function public.reopen_suggest_change_request to service_role;
grant execute on function public.reconcile_stale_inquiry_work to service_role;
