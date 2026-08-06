-- Phase 6b: give the redraft the customer back.
--
-- 202608070002 built the loop but left the drafting model blind. A redraft is
-- driven entirely from `inquiry_suggest_change_requests`, and that row carries
-- the draft plus Luke's instruction and nothing else — no messages, no
-- profile, no name, no answered availability. Two things break as a result:
--
--   1. "Answer their question about parking" asks the model to answer a
--      question it has never seen, so it invents one or ignores the request.
--   2. A CONFIRMED AVAILABILITY FACT IS SILENTLY LOST. When Luke answers
--      "Are you available on {date}?", `buildDraftingRules` relaxes the
--      standing no-availability-claims ban for that one date and the draft
--      states the answer as fact. A redraft that does not carry the fact
--      forward falls back to the standing ban and rewrites the reply as
--      "Luke will check and let you know" — silently undoing Luke's own
--      confirmation. That is the regression this migration exists to close.
--
-- `get_suggest_change_target_context` is the read that closes it: one call,
-- keyed by the request, returning everything the two redraft prompts already
-- know how to render.
--
-- WHY A NEW FUNCTION RATHER THAN AN EXISTING READER: every reader that
-- returns this data today takes a claim. `claim_website_lead_draft` moves the
-- drafting lease, `claim_inquiry_review_notification` flips the notification
-- status. A redraft has already been claimed — by
-- `record_suggest_change_instructions`, which put the request into 'drafting'
-- — so re-claiming the TARGET here would either fail (the lease is not the
-- redraft's to take) or corrupt the state of an approval that is legitimately
-- pending. This function therefore takes NO lock, holds NO lease, and writes
-- NOTHING: it is `stable`, and a concurrent claim on the same target must
-- still succeed while it runs.

-- ---------------------------------------------------------------------------
-- Indexes
--
-- None are added. Every lookup this function performs is already served:
--   * the request by primary key,
--   * the approval by primary key, its response run by primary key
--     (`response_run_id` is `unique`), the conversation by primary key and the
--     contact by primary key,
--   * the lead by primary key,
--   * and the answered availability fact by `inquiry_availability_checks`'
--     `unique (conversation_id, batch_key)` from 202607110001, which is the
--     exact key this reads on and guarantees at most one row per burst.
-- Adding a fourth index over `inquiry_availability_checks` would duplicate
-- that unique index and slow every availability write for nothing.
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
begin
  select request.* into v_request
    from public.inquiry_suggest_change_requests request
    where request.id = p_request_id;

  if v_request.id is null then
    return jsonb_build_object('found', false, 'reason', 'request_not_found');
  end if;

  v_target_id := coalesce(v_request.approval_id, v_request.website_lead_id);

  if v_request.target_kind = 'approval' then
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
      -- THE REGRESSION GUARD. Same lookup as `getAnsweredAvailabilityFact`
      -- (src/lib/inquiries/supabase.ts): conversation + batch key + answered.
      -- The batch key is a pure function of the message set, so an answered
      -- check for it IS this run's question; `unique (conversation_id,
      -- batch_key)` means the order/limit can only ever see one row.
      'availabilityFact', (
        select jsonb_build_object(
          'availability', availability_check.availability,
          'dateText', availability_check.event_date_text
        )
        from public.inquiry_availability_checks availability_check
        where availability_check.conversation_id = approval.conversation_id
          and availability_check.batch_key = response_run.batch_key
          and availability_check.status = 'answered'
          and availability_check.availability is not null
        order by availability_check.answered_at desc
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
      -- Key-for-key the object `claim_website_lead_draft` returns, minus the
      -- claim, so the caller parses it with the same `websiteLeadDetails`
      -- schema. `availability` is the load-bearing field: without it the
      -- redraft prompt loses Luke's answered date and falls back to the
      -- standing no-claims rule.
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
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on function public.get_suggest_change_target_context
  from public, anon, authenticated;

grant execute on function public.get_suggest_change_target_context to service_role;
