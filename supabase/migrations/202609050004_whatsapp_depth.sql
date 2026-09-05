-- Phase 4 of plans/007: outbound WhatsApp messages are stored too, and Luke
-- can reply from the admin through the same guarded send path Telegram uses.

-- ---------------------------------------------------------------------------
-- 1. Outbound message ingestion (Zernio message.sent)
--
-- Fires for API sends and, on Coexistence numbers, for replies typed in the
-- WhatsApp Business app. Storing them gives the CRM the full thread and marks
-- the conversation as handled by a human. It never creates outbox events and
-- never touches processed_at on incoming rows: an outgoing message is not
-- something the agent has to react to.
-- ---------------------------------------------------------------------------

create or replace function public.ingest_zernio_outbound_message(
  p_provider_account_id text,
  p_provider_conversation_id text,
  p_provider_event_id text,
  p_provider_message_id text,
  p_body text,
  p_attachments jsonb,
  p_raw_payload jsonb,
  p_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_message_id uuid;
begin
  select id into v_conversation_id
    from public.inquiry_conversations
    where provider = 'zernio'
      and provider_account_id = p_provider_account_id
      and provider_conversation_id = p_provider_conversation_id;

  -- A reply to a thread we never saw inbound (e.g. Luke opened it himself).
  -- Create the conversation so the thread is at least visible.
  if v_conversation_id is null then
    insert into public.inquiry_conversations (
      provider, channel, provider_conversation_id, provider_account_id, state
    ) values ('zernio', 'whatsapp', p_provider_conversation_id, p_provider_account_id, 'human_engaged')
    on conflict (provider, provider_account_id, provider_conversation_id) do update
      set updated_at = now()
    returning id into v_conversation_id;
  end if;

  insert into public.inquiry_messages (
    conversation_id, provider, provider_event_id, provider_message_id,
    direction, body, attachments, sender_snapshot, raw_payload, occurred_at
  ) values (
    v_conversation_id, 'zernio', p_provider_event_id, p_provider_message_id,
    'outgoing', p_body, coalesce(p_attachments, '[]'::jsonb), '{}'::jsonb,
    p_raw_payload, p_occurred_at
  )
  on conflict do nothing
  returning id into v_message_id;

  if v_message_id is null then
    return jsonb_build_object('duplicate', true, 'conversationId', v_conversation_id, 'messageId', null);
  end if;

  update public.inquiry_conversations
    set updated_at = now()
    where id = v_conversation_id;

  return jsonb_build_object('duplicate', false, 'conversationId', v_conversation_id, 'messageId', v_message_id);
end;
$$;

revoke all on function public.ingest_zernio_outbound_message from public, anon, authenticated;
grant execute on function public.ingest_zernio_outbound_message to service_role;

-- ---------------------------------------------------------------------------
-- 2. Reply from the admin
--
-- Creates a response run whose proposed reply is Luke's own text, an approval
-- that is already approved (he wrote it), and the same outbox event a
-- Telegram approval creates. Sending then goes through
-- claim_inquiry_approval_send, so the 24-hour window, the "newest run only"
-- rule and the unprocessed-message guard all still apply. The run needs a
-- message set: the latest incoming message anchors it.
-- ---------------------------------------------------------------------------

create or replace function public.create_admin_reply(
  p_conversation_id uuid,
  p_reply text,
  p_actor text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry_id uuid;
  v_message_id uuid;
  v_run_id uuid;
  v_approval_id uuid;
  v_outbox_id uuid;
  v_window timestamptz;
begin
  if p_reply is null or btrim(p_reply) = '' then
    raise exception 'Reply text is required';
  end if;

  select service_window_expires_at into v_window
    from public.inquiry_conversations
    where id = p_conversation_id
    for update;
  if not found then
    raise exception 'Conversation not found';
  end if;
  if v_window is null or v_window <= now() then
    return jsonb_build_object('ok', false, 'reason', 'window_closed');
  end if;

  select id into v_message_id
    from public.inquiry_messages
    where conversation_id = p_conversation_id and direction = 'incoming'
    order by occurred_at desc
    limit 1;
  if v_message_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_inbound_message');
  end if;

  -- The inquiry row is required by the run's foreign key.
  insert into public.inquiries (conversation_id, status, source)
    values (p_conversation_id, 'human_engaged', 'unknown')
    on conflict (conversation_id) do update set updated_at = now()
    returning id into v_inquiry_id;

  insert into public.inquiry_response_runs (
    inquiry_id, conversation_id, batch_key, message_ids, model, analysis,
    proposed_reply, policy_decision, policy_reasons
  ) values (
    v_inquiry_id, p_conversation_id, 'admin:' || gen_random_uuid()::text,
    array[v_message_id], 'admin', jsonb_build_object(
      'summary', 'Reply written by ' || p_actor || ' in the admin.',
      'proposed_media_slugs', '[]'::jsonb
    ),
    p_reply, 'human_review', array['admin_authored']
  )
  returning id into v_run_id;

  insert into public.inquiry_approval_requests (
    response_run_id, conversation_id, status, final_reply,
    telegram_notification_status, decided_by, decided_at
  ) values (
    v_run_id, p_conversation_id, 'approved', p_reply,
    'sent', p_actor, now()
  )
  returning id into v_approval_id;

  insert into public.inquiry_outbox_events (event_type, aggregate_id, payload, unique_key)
    values (
      'inquiry.response_approved',
      v_approval_id,
      jsonb_build_object('approvalId', v_approval_id),
      'approval:' || v_approval_id::text
    )
    returning id into v_outbox_id;

  update public.inquiries set status = 'human_engaged', updated_at = now() where id = v_inquiry_id;
  update public.inquiry_conversations set state = 'human_engaged', updated_at = now() where id = p_conversation_id;

  return jsonb_build_object(
    'ok', true,
    'approvalId', v_approval_id,
    'outboxId', v_outbox_id
  );
end;
$$;

revoke all on function public.create_admin_reply from public, anon, authenticated;
grant execute on function public.create_admin_reply to service_role;
