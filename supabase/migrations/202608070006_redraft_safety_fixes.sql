-- Phase 6e: two ways a redraft can still hurt Luke, closed.
--
--   1. AN UNREVIEWED REDRAFT BEHIND A LIVE APPROVE BUTTON. 202608070004 moved
--      the card id out of `complete_suggest_change_request` so the new draft
--      could be written BEFORE its card was posted. That closed one direction
--      of the invariant (no button may offer text the target does not contain)
--      and opened the other: when the card send fails, the target holds a
--      revision Luke has never read while the ORIGINAL card sits in the chat
--      printing the old text with a live Approve button. `claim_inquiry_
--      approval_send` sends `coalesce(final_reply, proposed_reply)` — the
--      revision — so one tap delivers model output no human ever checked, on a
--      request that is 'completed' with `card_message_id` null and that no
--      sweep ever looked for.
--
--      Two halves, and both are needed. The caller now retires the SOURCE
--      card's Approve button before it writes (trigger/inquiries.ts), so no
--      stale-text button is live during the window at all; and
--      `reconcile_stale_inquiry_work` grows a branch that finds a completed
--      request with no card and hands the cron everything it needs to post one.
--      The compensating path is what matters here: the old fallback was a
--      Telegram sendMessage issued microseconds after a Telegram sendMessage
--      had just failed, over the same token to the same chat, which is not a
--      fallback at all. The sweep runs on the existing `*/3` cron, so a
--      transient flood-control or 5xx self-heals minutes later without Luke
--      doing anything.
--
--   2. A CONFIRMED AVAILABILITY LOST BECAUSE IT CAME FROM AN EARLIER BURST.
--      202608070005 resolved `availabilityFact` by the response run's OWN batch
--      key. `ensure_inquiry_availability_check` hands out `mode = 'fact'` from
--      an answered check belonging to a DIFFERENT batch key (matched on the
--      event date) and inserts no row for the current one, so exactly the facts
--      that arrived through that cross-burst branch are the ones the redraft
--      cannot see. The redraft then falls back to the standing ban — "say Luke
--      will check and let them know" — and silently reverses an availability he
--      answered himself, on the date the customer asked about. This migration
--      widens the lookup to the same rule the gate uses; see the comment on the
--      lookup for exactly what it matches and what it deliberately cannot.
--
-- SUPERSEDES the 202608070005 definition of `get_suggest_change_target_context`
-- and the 202608070002 definition of `reconcile_stale_inquiry_work`. Both are
-- re-declared here wholesale rather than editing a shipped migration; identical
-- signatures, so `create or replace` replaces each body in place and PostgREST
-- is left with exactly one function to resolve, no overload to choose between.
-- Return keys stay additive in both.

-- ---------------------------------------------------------------------------
-- The redraft's context read
--
-- Everything 202608070003/070005 said still holds: no lock, no lease, writes
-- nothing (`stable`). Two additions, both read off rows already joined by
-- primary key, so no indexes are needed.
-- ---------------------------------------------------------------------------

create or replace function public.get_suggest_change_target_context(
  p_request_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_request public.inquiry_suggest_change_requests%rowtype;
  v_target_id uuid;
  v_status text;
  v_result jsonb;
  -- The date THIS draft is about, exactly as the run's stored extraction saw
  -- it. Read once here so the availability lookup below stays legible.
  v_draft_date_iso text;
  v_draft_date_text text;
begin
  select request.* into v_request
    from public.inquiry_suggest_change_requests request
    where request.id = p_request_id;

  if v_request.id is null then
    return jsonb_build_object('found', false, 'reason', 'request_not_found');
  end if;

  v_target_id := coalesce(v_request.approval_id, v_request.website_lead_id);

  if v_request.target_kind = 'approval' then
    -- `analysis` is the extraction the first draft ran on, stored verbatim by
    -- `record_inquiry_analysis` (analysis = extraction + draft). Its
    -- `event.event_date_iso` is the SAME value the availability gate passed to
    -- `ensure_inquiry_availability_check` as `p_event_date_iso`, which is what
    -- makes the lookup below agree with the pipeline rather than invent a
    -- second rule. Kept as text and never cast: the model writes this field, so
    -- a malformed value has to read as "no date", not raise inside a read the
    -- redraft depends on.
    select
      nullif(btrim(coalesce(response_run.analysis -> 'event' ->> 'event_date_iso', '')), ''),
      nullif(btrim(coalesce(response_run.analysis -> 'event' ->> 'event_date_text', '')), '')
      into v_draft_date_iso, v_draft_date_text
      from public.inquiry_approval_requests approval
      join public.inquiry_response_runs response_run
        on response_run.id = approval.response_run_id
      where approval.id = v_request.approval_id;

    select jsonb_build_object(
      'found', true,
      'targetKind', 'approval',
      'targetId', approval.id,
      -- The name the redraft card prints. `open_suggest_change_request` falls
      -- back to the same literal, so a contact with no display name reads
      -- identically on both cards.
      'targetName', coalesce(contact.display_name, 'the customer'),
      'conversationId', approval.conversation_id,
      -- The burst this draft answers. The caller loads the messages
      -- themselves, so the redraft sees the customer's actual words.
      'batchKey', response_run.batch_key,
      'messageIds', to_jsonb(response_run.message_ids),
      -- THE CARD THIS REDRAFT IS ABOUT TO INVALIDATE. Its Approve button sends
      -- `coalesce(final_reply, proposed_reply)`, i.e. whatever the target holds
      -- when it is tapped — so the moment the revision is written, that button
      -- offers text the card does not print and Luke has not read. The caller
      -- retires it BEFORE writing. The pointer is kept current by
      -- `attach_suggest_change_card`, so this is the newest card for the
      -- target, which is the one Luke is looking at. Null when the target has
      -- no card at all: there is then no live button to retire.
      'cardChatId', case
        when approval.telegram_chat_id is null then null
        else approval.telegram_chat_id::text
      end,
      'cardMessageId', approval.telegram_message_id,
      -- WHAT THE FIRST DRAFT RETRIEVED ITS LEARNED CORRECTIONS AGAINST. The
      -- same extraction `record_inquiry_analysis` stored on this run and that
      -- `record_inquiry_override` reads back when it turns a correction into a
      -- reply example, so a revision is grounded in the SAME examples as the
      -- draft it revises. `[]` when the run predates stored intents:
      -- retrieving none is the safe direction, because ANY-overlap matching
      -- means a widened guess pulls in priced corrections the first draft
      -- never saw.
      'intents', coalesce(response_run.analysis -> 'intents', '[]'::jsonb),
      -- THE ATTACHMENTS THAT STILL SEND ON APPROVE. Identical expression to
      -- `claim_inquiry_approval_send`'s non-override branch (202607140001): a
      -- redraft rewrites `proposed_reply` only, so the slugs the first draft
      -- chose survive the revision and go out with it.
      'proposedMediaSlugs', coalesce(
        response_run.analysis -> 'proposed_media_slugs',
        '[]'::jsonb
      ),
      -- THE REGRESSION GUARD, now matching the rule that granted the fact.
      --
      -- 202608070005 scoped this to the run's own `batch_key`. That finds a
      -- fact Luke answered for THIS burst and nothing else, while
      -- `ensure_inquiry_availability_check` (202608060001:780-809) also hands
      -- out `mode = 'fact'` from an answered check belonging to an EARLIER
      -- burst whose date is the same — and inserts no row for the current
      -- batch when it does. So every cross-burst fact was invisible here, and
      -- the redraft reverted a confirmed "yes, I'm free on the 14th" to "Luke
      -- will check and let you know" on the exact date the customer asked
      -- about.
      --
      -- WHAT THIS MATCHES, in preference order:
      --   1. Same burst. The batch key is a pure function of the message set,
      --      so an answered check for it IS this run's question, whatever the
      --      re-extracted date looks like. `unique (conversation_id, batch_key)`
      --      means there is at most one.
      --   2. An earlier burst in the SAME conversation whose answer is still
      --      live (`expires_at > now()`, the 48h window) and whose date is the
      --      date this draft is about — ISO to ISO when the run's extraction
      --      produced one, otherwise text to text with both ISOs absent. That
      --      is character-for-character the branch the gate used to grant the
      --      fact in the first place, so this returns the fact the first draft
      --      was licensed to state and nothing else.
      --
      -- WHAT IT CANNOT DO, deliberately:
      --   * It cannot recognise that "next Saturday" in one burst and "the
      --     14th" in another are the same day. With no ISO date on both sides,
      --     different wording reads as a different date and returns nothing.
      --   * It cannot use a fact whose date it cannot establish. A run whose
      --     stored extraction has neither an ISO date nor a date text matches
      --     nothing outside its own batch, and a malformed ISO string (the
      --     model writes this field) simply fails to equal any real date.
      --   * It cannot cover a run recorded before `analysis` carried `event`.
      -- In every one of those cases the answer is null, `buildDraftingRules`
      -- restores the standing ban, and the reply says Luke will check. That is
      -- the direction to fail in: stating availability on a date Luke never
      -- confirmed is the worst output this system can produce, and returning a
      -- stale fact for a DIFFERENT date would do exactly that.
      'availabilityFact', (
        select jsonb_build_object(
          'availability', availability_check.availability,
          'dateText', availability_check.event_date_text
        )
        from public.inquiry_availability_checks availability_check
        where availability_check.conversation_id = approval.conversation_id
          and availability_check.status = 'answered'
          and availability_check.availability is not null
          and (
            availability_check.batch_key = response_run.batch_key
            or (
              availability_check.expires_at > now()
              and (
                (
                  v_draft_date_iso is not null
                  and availability_check.event_date_iso is not null
                  -- to_char rather than a cast in either direction: the run's
                  -- side is free text and `date::text` would depend on
                  -- DateStyle. This is a plain YYYY-MM-DD string compare.
                  and to_char(availability_check.event_date_iso, 'YYYY-MM-DD')
                    = v_draft_date_iso
                )
                or (
                  v_draft_date_iso is null
                  and availability_check.event_date_iso is null
                  and v_draft_date_text is not null
                  and lower(btrim(coalesce(availability_check.event_date_text, '')))
                    = lower(v_draft_date_text)
                )
              )
            )
          )
        -- This burst's own answer wins over an inherited one; after that, the
        -- most recent answer wins, which is the same tie-break the gate uses.
        order by (availability_check.batch_key = response_run.batch_key) desc,
          availability_check.answered_at desc
        limit 1
      )
    )
    into v_result
    from public.inquiry_approval_requests approval
    join public.inquiry_response_runs response_run
      on response_run.id = approval.response_run_id
    join public.inquiry_conversations conversation
      on conversation.id = approval.conversation_id
    left join public.inquiry_contacts contact
      on contact.id = conversation.contact_id
    where approval.id = v_request.approval_id
      -- Same gate as `open_suggest_change_request`: a target that can no
      -- longer receive the redraft has no context worth carrying, and
      -- `complete_suggest_change_request` would refuse the write anyway.
      and approval.status = 'pending'
      and approval.expires_at > now();
  else
    select jsonb_build_object(
      'found', true,
      'targetKind', 'website_lead',
      'targetId', lead.id,
      -- `open_suggest_change_request` labels the lead card with the first
      -- name; the redraft card matches it.
      'targetName', lead.first_name,
      -- Same role as on the approval branch: the lead's review card carries an
      -- Approve button that sends `coalesce(final_reply, draft_reply)`, so it
      -- has to be retired before the revision is written.
      'cardChatId', case
        when lead.review_telegram_chat_id is null then null
        else lead.review_telegram_chat_id::text
      end,
      'cardMessageId', lead.review_telegram_message_id,
      -- Key-for-key the object `claim_website_lead_draft` returns, minus the
      -- claim, so the caller parses it with the same `websiteLeadDetails`
      -- schema. `availability` is the load-bearing field: without it the
      -- redraft prompt loses Luke's answered date and falls back to the
      -- standing no-claims rule.
      --
      -- No `intents` and no `proposedMediaSlugs` here, and that is not an
      -- omission: a website lead has no response run to extract intents from,
      -- and its draft is a single text message with no media to attach.
      'lead', jsonb_build_object(
        'leadId', lead.id,
        'source', lead.source,
        'firstName', lead.first_name,
        'lastName', lead.last_name,
        'eventType', lead.event_type,
        'eventDateText', lead.event_date_text,
        'dateFlexible', lead.date_flexible,
        'location', lead.location,
        'guestCount', lead.guest_count,
        'performanceMinutes', lead.performance_minutes,
        'bookerRole', lead.booker_role,
        'message', lead.message,
        'notes', lead.notes,
        'availability', lead.availability,
        'whatsappDigits', lead.whatsapp_digits
      )
    )
    into v_result
    from public.inquiry_website_leads lead
    where lead.id = v_request.website_lead_id
      and lead.status = 'draft_ready'
      and lead.expires_at > now();
  end if;

  if v_result is not null then
    return v_result;
  end if;

  -- Nothing came back. Say which of the two it was, so the caller can log a
  -- vanished target differently from one that was approved or aged out while
  -- Luke was recording his voicenote.
  if v_request.target_kind = 'approval' then
    select approval.status into v_status
      from public.inquiry_approval_requests approval
      where approval.id = v_target_id;
  else
    select lead.status into v_status
      from public.inquiry_website_leads lead
      where lead.id = v_target_id;
  end if;

  return jsonb_build_object(
    'found', false,
    'reason', case
      when v_status is null then 'target_not_found'
      else 'target_not_actionable'
    end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Recovery
--
-- SUPERSEDES the definition in 202608070002:584-824 (which itself superseded
-- 202608060001:1725-1944). That file cannot be edited, so the body is
-- reproduced verbatim with one branch added: a redraft whose text is committed
-- but whose review card never reached Telegram is reported, so the cron can
-- post the card that failed. Return keys stay additive.
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

  return jsonb_build_object(
    'staleSends', v_stale_sends,
    'staleReviews', v_stale_reviews,
    'staleOutbox', v_stale_outbox,
    'staleLeadWork', v_stale_lead_work,
    'expiredAvailabilityCards', v_expired_availability_cards,
    'expiredLeadCards', v_expired_lead_cards,
    'expiredOverridePrompts', v_expired_override_prompts,
    'expiredSuggestChangePrompts', v_expired_suggest_change_prompts,
    'cardlessRedrafts', v_cardless_redrafts
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
--
-- Repeated from the migrations these definitions supersede. `create or replace`
-- preserves the existing grants, so these are a no-op on a database that
-- already ran them and the correct grants on one restored from a dump that did
-- not.
-- ---------------------------------------------------------------------------

revoke all on function public.get_suggest_change_target_context
  from public, anon, authenticated;
revoke all on function public.reconcile_stale_inquiry_work
  from public, anon, authenticated;

grant execute on function public.get_suggest_change_target_context to service_role;
grant execute on function public.reconcile_stale_inquiry_work to service_role;
