-- Phase 6d: finish the redraft's context read.
--
-- 202608070003 gave the redraft the customer back — their words, their
-- profile, and the answered availability fact that keeps a confirmed "yes"
-- from being rewritten into "he'll check". Two fields the run row already
-- holds were left behind, and each one degrades a redraft in its own way.
--
--   1. LUKE'S LEARNED CORRECTIONS NEVER REACH A REVISION. The first draft
--      retrieves them with `getMatchingReplyExamples(extraction.intents)`;
--      the redraft has no intents to retrieve against, so it passes an empty
--      list and `getMatchingReplyExamples` early-returns. Every override Luke
--      has ever typed teaches the first draft and nothing else. The fix is not
--      to guess a set: that read (src/lib/inquiries/supabase.ts) selects with
--      PostgREST's `.overlaps`, i.e. ANY tag in common, so an example tagged
--      ['greeting','pricing'] comes back for a request of ['greeting'] and no
--      non-empty guess provably excludes a priced correction from a cosmetic
--      edit. The only correct input is the intents the FIRST draft used, which
--      is `inquiry_response_runs.analysis -> 'intents'` — a row this function
--      already joins and reads. Absent intents (an old run drafted before the
--      field was stored) stay an empty array: degraded but safe is the right
--      default when the alternative is inventing a price.
--
--   2. THE REDRAFT CARD OMITS ATTACHMENTS THAT STILL SEND.
--      `complete_suggest_change_request` rewrites `proposed_reply` and leaves
--      `proposed_media_slugs` untouched, so whatever the first draft chose is
--      still attached when Approve is tapped on the revision card. The card
--      could not say so, because the caller had no slugs to resolve. Same
--      expression `claim_inquiry_approval_send` uses (202607140001), so the
--      card names exactly the assets the send path will attach.
--
-- Neither field exists on the website-lead branch and neither is added there:
-- a lead draft is a single text message (`websiteLeadDraftSchema`) with no
-- media, and `redraftWebsiteLeadReply` retrieves no examples.
--
-- SUPERSEDES the 202608070003 definition of
-- `get_suggest_change_target_context` wholesale rather than editing a shipped
-- migration. Identical signature — `(p_request_id uuid) returns jsonb` — so
-- `create or replace` replaces the body in place and PostgREST is left with
-- exactly one function to resolve, no overload to choose between.
--
-- Everything 202608070003 said about this function still holds: it takes NO
-- lock, holds NO lease and writes NOTHING (`stable`), because the redraft's
-- claim is the request row being in 'drafting' and the target itself is
-- legitimately pending for whoever taps Approve next. No indexes are added;
-- both new fields are extra keys off a row already joined by primary key.

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
-- Permissions
--
-- Repeated verbatim from 202608070003. `create or replace` preserves the
-- existing grants, so these are a no-op on a database that already ran 070003
-- and the correct grants on one restored from a dump that did not.
-- ---------------------------------------------------------------------------

revoke all on function public.get_suggest_change_target_context
  from public, anon, authenticated;

grant execute on function public.get_suggest_change_target_context to service_role;
