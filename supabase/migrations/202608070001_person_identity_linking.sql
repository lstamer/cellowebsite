-- Phase 5: one human, one row.
--
-- Until now a person who filled in the website form and then messaged on
-- WhatsApp from the same number existed twice: once as an
-- `inquiry_website_leads` row keyed on a digits-only string, and once as an
-- `inquiry_contacts` row keyed on a Zernio identity. Nothing joined them, so
-- the drafting model met every returning enquirer as a stranger.
--
-- `inquiry_people` is the join: one row per canonical E.164 number, referenced
-- by both tables. The number is the only identifier the two channels share, so
-- it is the key; everything that reaches it is normalised first (in TypeScript
-- by `src/lib/inquiries/phone.ts`, and re-checked here) because a
-- half-formatted number would link nobody and a wrongly guessed one would
-- merge two strangers.

-- ---------------------------------------------------------------------------
-- The person entity
-- ---------------------------------------------------------------------------

create table if not exists public.inquiry_people (
  id uuid primary key default gen_random_uuid(),
  -- Canonical E.164. The unique index is what collapses a concurrent form
  -- submit and WhatsApp webhook into a single row.
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inquiry_people enable row level security;

alter table public.inquiry_website_leads
  add column if not exists phone_e164 text,
  add column if not exists person_id uuid references public.inquiry_people(id) on delete set null;

alter table public.inquiry_contacts
  add column if not exists person_id uuid references public.inquiry_people(id) on delete set null;

create index if not exists inquiry_contacts_person_idx
  on public.inquiry_contacts(person_id)
  where person_id is not null;

create index if not exists inquiry_website_leads_person_idx
  on public.inquiry_website_leads(person_id)
  where person_id is not null;

create index if not exists inquiry_website_leads_phone_idx
  on public.inquiry_website_leads(phone_e164)
  where phone_e164 is not null;

create index if not exists inquiry_contacts_phone_idx
  on public.inquiry_contacts(phone_e164)
  where phone_e164 is not null;

-- ---------------------------------------------------------------------------
-- Person resolution
-- ---------------------------------------------------------------------------

-- Resolve (or create) the person behind a number, concurrency-safe.
--
-- `on conflict (phone_e164) do update` rather than select-then-insert is what
-- makes the race safe: when a website form submit and an inbound WhatsApp
-- webhook arrive for the same number at the same instant, the loser blocks on
-- the unique index, falls into the update branch, and returns the winner's id.
-- Exactly one row exists either way. The `do update` also guarantees the
-- `returning` clause always yields an id, which `do nothing` would not.
--
-- NOTE ON COALESCE DIRECTION: this is deliberately the OPPOSITE of the contact
-- upsert in `ingest_zernio_message`, which does
-- `coalesce(excluded.display_name, inquiry_contacts.display_name)` so the
-- freshest Zernio snapshot wins. That is right for a contact, which is a
-- mirror of one WhatsApp identity. It is wrong for a person: the first name we
-- ever learn is almost always the one typed into the website form ("Sarah
-- Whitfield"), while the WhatsApp display name arriving later is a self-set
-- nickname ("Sazzz ✨") that Luke would not recognise on a Telegram card. So
-- here the stored value wins and only a null is filled in.
create or replace function public.upsert_inquiry_person(
  p_phone_e164 text,
  p_display_name text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
begin
  -- Anything not already canonical is dropped rather than salvaged. A missing
  -- link costs the drafter some context; a wrong one merges two strangers into
  -- one person and leaks one enquiry's details into the other's reply.
  if p_phone_e164 is null or p_phone_e164 !~ '^\+[1-9][0-9]{6,14}$' then
    return null;
  end if;

  insert into public.inquiry_people (phone_e164, display_name, email)
  values (
    p_phone_e164,
    nullif(btrim(coalesce(p_display_name, '')), ''),
    nullif(btrim(coalesce(p_email, '')), '')
  )
  on conflict (phone_e164) do update set
    display_name = coalesce(inquiry_people.display_name, excluded.display_name),
    email = coalesce(inquiry_people.email, excluded.email),
    updated_at = now()
  returning id into v_person_id;

  return v_person_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Website leads now carry the canonical number and its person.
--
-- Dropped and recreated rather than `create or replace`d: the new
-- `p_phone_e164` argument changes the signature, and `create or replace` would
-- leave the 19-argument version in place as an overload for PostgREST to pick
-- between.
-- ---------------------------------------------------------------------------

drop function if exists public.create_website_lead(
  text, text, text, text, text, text, text, text, text, text, date, boolean,
  text, integer, integer, text, text, text, jsonb
);

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
  p_payload jsonb,
  -- Trailing with a default so a caller that predates this migration still
  -- resolves to this function instead of erroring on a missing argument.
  p_phone_e164 text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_person_id uuid;
  v_phone_e164 text;
begin
  -- The column is the join key to inquiry_people, so only a canonical value is
  -- stored; a half-formatted one would sit there looking linked and match
  -- nothing.
  v_phone_e164 := nullif(btrim(coalesce(p_phone_e164, '')), '');
  if v_phone_e164 !~ '^\+[1-9][0-9]{6,14}$' then
    v_phone_e164 := null;
  end if;

  v_person_id := public.upsert_inquiry_person(
    v_phone_e164,
    nullif(btrim(concat_ws(' ', btrim(p_first_name), btrim(coalesce(p_last_name, '')))), ''),
    p_email
  );

  insert into public.inquiry_website_leads (
    source,
    first_name,
    last_name,
    email,
    phone,
    whatsapp,
    whatsapp_digits,
    phone_e164,
    person_id,
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
    v_phone_e164,
    v_person_id,
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

-- ---------------------------------------------------------------------------
-- Inbound WhatsApp contacts gain their person.
--
-- Identical to the Phase 1 body apart from the person resolution and the
-- `person_id` column on the contact upsert.
-- ---------------------------------------------------------------------------

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
  v_person_id uuid;
  v_conversation_id uuid;
  v_existing_conversation_id uuid;
  v_message_id uuid;
  v_outbox_id uuid;
begin
  -- Resolved here, before the conversation `for update` below, and not inside
  -- it. This upsert can block behind a concurrent website form submit for the
  -- same number, and the conversation row is the serialization point shared
  -- with the approval-send claim. Waiting on an unrelated form post while
  -- holding that lock would stall outbound sends on the webhook hot path.
  -- Returns null for a null or non-canonical number, which simply leaves the
  -- contact unlinked.
  v_person_id := public.upsert_inquiry_person(p_phone_e164, p_display_name, null);

  insert into public.inquiry_contacts (
    provider,
    provider_account_id,
    provider_identity,
    phone_e164,
    whatsapp_username,
    display_name,
    person_id
  ) values (
    'zernio',
    p_provider_account_id,
    p_provider_identity,
    p_phone_e164,
    p_whatsapp_username,
    p_display_name,
    v_person_id
  )
  on conflict (provider, provider_account_id, provider_identity) do update set
    phone_e164 = coalesce(excluded.phone_e164, inquiry_contacts.phone_e164),
    whatsapp_username = coalesce(excluded.whatsapp_username, inquiry_contacts.whatsapp_username),
    display_name = coalesce(excluded.display_name, inquiry_contacts.display_name),
    person_id = coalesce(excluded.person_id, inquiry_contacts.person_id),
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

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on table public.inquiry_people from anon, authenticated;
grant all on table public.inquiry_people to service_role;

revoke all on function public.upsert_inquiry_person from public, anon, authenticated;
revoke all on function public.create_website_lead from public, anon, authenticated;
revoke all on function public.ingest_zernio_message from public, anon, authenticated;

grant execute on function public.upsert_inquiry_person to service_role;
grant execute on function public.create_website_lead to service_role;
grant execute on function public.ingest_zernio_message to service_role;

-- ---------------------------------------------------------------------------
-- Backfill
--
-- Every statement below is idempotent: re-running the migration re-derives the
-- same values and inserts nothing new. Numbers that match none of the known
-- shapes are left null, never guessed, for the same reason
-- `upsert_inquiry_person` rejects them.
-- ---------------------------------------------------------------------------

-- `whatsapp_digits` was written by `phone.replace(/\D/g, "")`, so it holds one
-- of two shapes: a country-coded number missing its "+" ("27821234567"), or a
-- South African local number with its trunk prefix intact ("0821234567").
-- Anything else (a truncated number, two numbers run together) is unsalvageable.
update public.inquiry_website_leads lead
  set phone_e164 = case
    when lead.whatsapp_digits ~ '^[1-9][0-9]{6,14}$' then '+' || lead.whatsapp_digits
    else '+27' || substring(lead.whatsapp_digits from 2)
  end
  where lead.phone_e164 is null
    and lead.whatsapp_digits is not null
    and (
      lead.whatsapp_digits ~ '^[1-9][0-9]{6,14}$'
      or lead.whatsapp_digits ~ '^0[0-9]{9}$'
    );

-- `inquiry_contacts.phone_e164` was never validated on write, so despite the
-- column name it holds whatever Zernio sent. Fold the same two shapes into
-- canonical form before it is used as a join key. Rows already canonical are
-- excluded, which is also what makes this re-runnable. `updated_at` is left
-- alone: this is a representation fix, not a new fact about the contact.
update public.inquiry_contacts contact
  set phone_e164 = case
    when contact.phone_e164 ~ '^[1-9][0-9]{6,14}$' then '+' || contact.phone_e164
    else '+27' || substring(contact.phone_e164 from 2)
  end
  where contact.phone_e164 is not null
    and contact.phone_e164 !~ '^\+[1-9][0-9]{6,14}$'
    and (
      contact.phone_e164 ~ '^[1-9][0-9]{6,14}$'
      or contact.phone_e164 ~ '^0[0-9]{9}$'
    );

-- One person per distinct number across both tables. The name and email chosen
-- are the earliest non-null ones seen, mirroring the first-known-wins rule in
-- `upsert_inquiry_person`: array_agg orders by first sighting, array_remove
-- drops the nulls, and [1] takes what is left at the front.
insert into public.inquiry_people (phone_e164, display_name, email)
select
  candidate.phone_e164,
  (array_remove(array_agg(candidate.display_name order by candidate.seen_at), null))[1],
  (array_remove(array_agg(candidate.email order by candidate.seen_at), null))[1]
from (
  select
    lead.phone_e164,
    nullif(btrim(concat_ws(' ', lead.first_name, lead.last_name)), '') as display_name,
    nullif(btrim(lead.email), '') as email,
    lead.created_at as seen_at
  from public.inquiry_website_leads lead
  where lead.phone_e164 is not null
  union all
  select
    contact.phone_e164,
    nullif(btrim(coalesce(contact.display_name, '')), ''),
    null::text,
    contact.created_at
  from public.inquiry_contacts contact
  where contact.phone_e164 ~ '^\+[1-9][0-9]{6,14}$'
) candidate
group by candidate.phone_e164
on conflict (phone_e164) do nothing;

update public.inquiry_website_leads lead
  set person_id = person.id
  from public.inquiry_people person
  where lead.person_id is null
    and lead.phone_e164 is not null
    and person.phone_e164 = lead.phone_e164;

update public.inquiry_contacts contact
  set person_id = person.id
  from public.inquiry_people person
  where contact.person_id is null
    and contact.phone_e164 is not null
    and person.phone_e164 = contact.phone_e164;
