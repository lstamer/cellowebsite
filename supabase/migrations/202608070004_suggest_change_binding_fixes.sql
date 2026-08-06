-- Phase 6c: bind a voicenote to the request it was recorded for.
--
-- 202608070002 built the redraft loop with one deliberate simplification:
-- instructions arrive as a bare Telegram message, so a request was identified
-- by CHAT and "newest wins". Four things follow from that, and this migration
-- closes all four.
--
--   1. WRONG-CUSTOMER BINDING. Luke taps ✏️ on customer A, records a
--      voicenote, then taps ✏️ on customer B while transcription is still
--      running. `open_suggest_change_request` cancels A and opens B; the task
--      then binds A's transcript to B and rewrites B's draft with a price that
--      was never theirs. `bind_suggest_change_instructions` takes the request
--      id the webhook captured at record time and binds THAT row or nothing:
--      a superseded request reports `request_superseded` and the caller stops.
--
--   2. THE "ONE OPEN REQUEST PER CHAT" INVARIANT WAS ONLY INTENDED. The
--      supersede sweep in `open_suggest_change_request` is a plain UPDATE, and
--      under READ COMMITTED two overlapping ✏️ taps cannot see each other's
--      uncommitted INSERT, so both commit and the chat is left with two open
--      requests. A partial unique index makes the invariant enforceable; the
--      supersede path keeps working because the insert is retried once the
--      loser can see the winner's committed row.
--
--   3. THE CARD ID ARRIVED WITH THE DRAFT. `complete_suggest_change_request`
--      took `p_card_message_id`, which forced the caller to post the Telegram
--      card BEFORE the draft was written. If that write then failed, a card
--      showing the new text sat in the chat with a live Approve button over a
--      target row that still held the old text. The card id is now stitched on
--      afterwards by `attach_suggest_change_card`, exactly as
--      `attach_suggest_change_prompt` does for the prompt, so the draft can be
--      written first and no button can ever offer text the target does not
--      contain. `complete_suggest_change_request` keeps its signature (callers
--      pass null) so nothing else has to change.
--
--   4. THE TARGET'S CARD POINTER WENT STALE. A redraft posts a new review
--      card, but `inquiry_approval_requests.telegram_message_id` (and
--      `inquiry_website_leads.review_telegram_message_id`) still pointed at the
--      card it replaced, so a typed correction swipe-replied to the NEWEST card
--      matched nothing in `record_inquiry_override` and was dropped in silence.
--      `attach_suggest_change_card` repoints the target at the card it just
--      posted, so reply-to-card keeps working on the card Luke is looking at.
--
-- Also here: `reopen_suggest_change_request`, so a redraft task that exhausts
-- its retries can roll its request back out of 'drafting' instead of leaving it
-- stuck there for the full 24 hours while every later voicenote is answered
-- with "I'm still redrafting from your last note".

-- ---------------------------------------------------------------------------
-- At most one open request per chat
-- ---------------------------------------------------------------------------

-- Any chat that already carries more than one open request (the race this
-- index exists to prevent) keeps its newest and cancels the rest, so the index
-- can be built. Newest wins because that is the row every reader already
-- treats as authoritative. Idempotent: after the index exists there is never
-- more than one row per chat for this to find.
with ranked as (
  select
    request.id,
    row_number() over (
      partition by request.telegram_chat_id
      order by request.created_at desc, request.id desc
    ) as position
    from public.inquiry_suggest_change_requests request
    where request.status in ('awaiting_instructions', 'drafting')
)
update public.inquiry_suggest_change_requests request
  set status = 'cancelled', updated_at = now()
  from ranked
  where ranked.id = request.id
    and ranked.position > 1;

-- The invariant the whole design rests on, now enforced by Postgres rather
-- than by a best-effort sweep. Partial so completed/cancelled/expired history
-- is unconstrained: a chat accumulates thousands of those and only ever has
-- one live request.
create unique index if not exists inquiry_suggest_change_requests_one_open_chat_idx
  on public.inquiry_suggest_change_requests(telegram_chat_id)
  where status in ('awaiting_instructions', 'drafting');

-- ---------------------------------------------------------------------------
-- Open: the ✏️ button tap, now safe under the unique index
--
-- SUPERSEDES 202608070002:143-265. Body reproduced with one change: the
-- supersede-then-insert pair is retried when the insert trips the new unique
-- index. That happens exactly when a concurrent tap committed its own open
-- request after this transaction's sweep took its snapshot — the race the
-- index exists to catch. Retrying re-runs the sweep against a snapshot that
-- can now see the winner, cancels it, and inserts. Without the retry the
-- second tap would fail outright and Luke would get an error instead of a
-- prompt.
-- ---------------------------------------------------------------------------

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
  v_attempt integer := 0;
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

  -- Cancel first, insert second. The order matters under the unique index: the
  -- outgoing request has to leave the index before the new one enters it.
  loop
    v_attempt := v_attempt + 1;

    begin
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

      exit;
    exception when unique_violation then
      -- A concurrent tap won the race and has now committed. Three attempts is
      -- generous: each retry only loses to a tap that committed inside this
      -- statement's window, and Luke cannot produce three of those.
      if v_attempt >= 3 then
        raise;
      end if;
    end;
  end loop;

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

-- ---------------------------------------------------------------------------
-- Record: the voicenote (or typed notes) arrive, bound to ONE request
-- ---------------------------------------------------------------------------

-- The chat-scoped bind from 202608070002 with the request id added.
--
-- `p_request_id` null keeps the original behaviour exactly: bind the newest
-- waiting request in the chat, and report `no_open_request` when there is none
-- so the webhook falls through to the bare-message override path.
--
-- `p_request_id` supplied binds THAT row or nothing. The caller captured it
-- when the ✏️ prompt was answered, and by the time the transcript exists the
-- chat's newest request may be a different customer's. Falling back to it is
-- how customer A's instruction ends up rewriting customer B's draft, so the
-- fallback does not exist: a request that is no longer waiting reports
-- `request_superseded` and the caller stops instead of redrafting.
create or replace function public.bind_suggest_change_instructions(
  p_telegram_chat_id bigint,
  p_instructions text,
  p_requested_by text,
  p_telegram_update_id bigint,
  p_request_id uuid
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

  if p_request_id is null then
    -- `for update` serialises two voicenotes racing into the same chat: the
    -- loser blocks, re-checks the qual after the winner commits, finds the row
    -- is no longer awaiting, and falls through as `no_open_request` instead of
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
  else
    select request.* into v_request
      from public.inquiry_suggest_change_requests request
      where request.id = p_request_id
      for update;

    if v_request.id is null then
      return jsonb_build_object(
        'duplicate', false,
        'bound', false,
        'reason', 'request_not_found',
        'status', null
      );
    end if;

    -- Superseded by a later ✏️ tap, cancelled, already drafting, aged out, or
    -- (defensively) belonging to another chat. Every one of these means the
    -- instructions were recorded against a draft Luke has moved on from, and
    -- applying them to whatever is open now would revise the wrong customer.
    if v_request.telegram_chat_id <> p_telegram_chat_id
      or v_request.status <> 'awaiting_instructions'
      or v_request.expires_at <= now() then
      return jsonb_build_object(
        'duplicate', false,
        'bound', false,
        'reason', 'request_superseded',
        'status', v_request.status
      );
    end if;
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

-- SUPERSEDES 202608070002:295-405. Same name, same four arguments, same return
-- shape — it is now the request-less form of the function above, kept for the
-- typed-notes path that genuinely has no request id to assert (a bare message
-- carries nothing tying it to a request).
create or replace function public.record_suggest_change_instructions(
  p_telegram_chat_id bigint,
  p_instructions text,
  p_requested_by text,
  p_telegram_update_id bigint
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.bind_suggest_change_instructions(
    p_telegram_chat_id,
    p_instructions,
    p_requested_by,
    p_telegram_update_id,
    null
  );
$$;

-- ---------------------------------------------------------------------------
-- Attach: the new card's id, once Telegram has given us one
-- ---------------------------------------------------------------------------

-- Same role as `attach_suggest_change_prompt`, and the reason the draft can be
-- written before the card is posted: the id that used to be an argument to
-- `complete_suggest_change_request` is stitched on here instead.
--
-- It also repoints the TARGET at the card it just posted. Every reply-to-card
-- gesture is resolved through `inquiry_approval_requests.telegram_message_id`
-- / `inquiry_website_leads.review_telegram_message_id`, so a pointer left on
-- the card the redraft replaced means a typed correction swipe-replied to the
-- newest card matches nothing and is dropped without a word. The pointer
-- follows the newest card, which is the one Luke is looking at.
create or replace function public.attach_suggest_change_card(
  p_request_id uuid,
  p_card_message_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.inquiry_suggest_change_requests%rowtype;
  v_repointed boolean := false;
begin
  update public.inquiry_suggest_change_requests request
    set card_message_id = p_card_message_id, updated_at = now()
    where request.id = p_request_id
      and request.status = 'completed'
      and request.card_message_id is null
    returning request.* into v_request;

  if v_request.id is null then
    return jsonb_build_object('attached', false, 'repointed', false);
  end if;

  if p_card_message_id is null then
    return jsonb_build_object('attached', true, 'repointed', false);
  end if;

  if v_request.target_kind = 'approval' then
    -- Only while the approval can still be acted on. Once it is approved or
    -- dismissed the pointer belongs to whichever card carried that decision.
    update public.inquiry_approval_requests approval
      set telegram_message_id = p_card_message_id, updated_at = now()
      where approval.id = v_request.approval_id
        and approval.status = 'pending'
        and approval.telegram_chat_id = v_request.telegram_chat_id;
  else
    update public.inquiry_website_leads lead
      set
        review_telegram_chat_id = v_request.telegram_chat_id,
        review_telegram_message_id = p_card_message_id,
        updated_at = now()
      where lead.id = v_request.website_lead_id
        and lead.status = 'draft_ready';
  end if;

  v_repointed := found;

  return jsonb_build_object('attached', true, 'repointed', v_repointed);
end;
$$;

-- ---------------------------------------------------------------------------
-- Reopen: a redraft that never finished
-- ---------------------------------------------------------------------------

-- `bind_suggest_change_instructions` burns the Telegram update id, so a task
-- that dies after binding cannot re-bind on a retry. If it also exhausts its
-- retries the request is left in 'drafting' until it expires 24 hours later,
-- and every voicenote Luke sends in the meantime is answered "I'm still
-- redrafting from your last note" — which is false.
--
-- Rolling it back to 'awaiting_instructions' makes the next voicenote bind
-- normally. Safe under the one-open-per-chat index: a 'drafting' row is
-- already that chat's single open row, so it stays in its own index slot.
-- `previousStatus` lets the caller tell Luke which failure he is looking at:
-- 'drafting' means the transcript landed and the redraft died, anything else
-- means the voicenote never got that far.
create or replace function public.reopen_suggest_change_request(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous text;
begin
  select status into v_previous
    from public.inquiry_suggest_change_requests
    where id = p_request_id;

  if v_previous is null then
    return jsonb_build_object('reopened', false, 'previousStatus', null);
  end if;

  update public.inquiry_suggest_change_requests
    set status = 'awaiting_instructions', updated_at = now()
    where id = p_request_id
      and status = 'drafting';

  return jsonb_build_object('reopened', found, 'previousStatus', v_previous);
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on function public.open_suggest_change_request from public, anon, authenticated;
revoke all on function public.bind_suggest_change_instructions from public, anon, authenticated;
revoke all on function public.record_suggest_change_instructions from public, anon, authenticated;
revoke all on function public.attach_suggest_change_card from public, anon, authenticated;
revoke all on function public.reopen_suggest_change_request from public, anon, authenticated;

grant execute on function public.open_suggest_change_request to service_role;
grant execute on function public.bind_suggest_change_instructions to service_role;
grant execute on function public.record_suggest_change_instructions to service_role;
grant execute on function public.attach_suggest_change_card to service_role;
grant execute on function public.reopen_suggest_change_request to service_role;
