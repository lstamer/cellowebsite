-- Durable per-contact memory: one profile per contact, merged from every
-- analysed burst. Gives the drafter facts that outlive the 30-message thread
-- history window (event details, stage, quoted amounts). Fields the extractor
-- does not yet produce (deposit, quoted amount, stage) are edited manually in
-- Studio until extraction grows into them.
create table if not exists public.inquiry_client_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references public.inquiry_contacts(id) on delete cascade,
  display_name text,
  role text,
  event_type text,
  event_date_text text,
  event_date_iso date,
  venue text,
  location text,
  guest_count integer,
  duration_minutes integer,
  budget_text text,
  quoted_amount_text text,
  deposit_status text not null default 'none' check (
    deposit_status in ('none', 'requested', 'paid')
  ),
  deposit_evidence text,
  booking_stage text not null default 'enquiry' check (
    booking_stage in ('enquiry', 'quoted', 'confirmed', 'deposit_paid', 'played', 'followed_up', 'lost')
  ),
  preferences text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inquiry_client_profiles enable row level security;

-- Merge newly extracted facts into the profile. Extracted values only fill or
-- refresh fields when non-null (newest evidence wins); manual edits to fields
-- the extractor never produces are preserved untouched.
create or replace function public.merge_inquiry_client_profile(
  p_conversation_id uuid,
  p_analysis jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_event jsonb;
  v_profile_id uuid;
begin
  select conversation.contact_id into v_contact_id
    from public.inquiry_conversations conversation
    where conversation.id = p_conversation_id;

  if v_contact_id is null then
    return jsonb_build_object('merged', false, 'reason', 'no_contact');
  end if;

  v_event := coalesce(p_analysis -> 'event', '{}'::jsonb);

  insert into public.inquiry_client_profiles (
    contact_id,
    display_name,
    event_type,
    event_date_text,
    event_date_iso,
    venue,
    location,
    guest_count,
    duration_minutes,
    budget_text
  ) values (
    v_contact_id,
    nullif(v_event ->> 'contact_name', ''),
    nullif(v_event ->> 'event_type', ''),
    nullif(v_event ->> 'event_date_text', ''),
    (nullif(v_event ->> 'event_date_iso', ''))::date,
    nullif(v_event ->> 'venue', ''),
    nullif(v_event ->> 'location', ''),
    (nullif(v_event ->> 'guest_count', ''))::integer,
    (nullif(v_event ->> 'duration_minutes', ''))::integer,
    nullif(v_event ->> 'budget_text', '')
  )
  on conflict (contact_id) do update set
    display_name = coalesce(excluded.display_name, inquiry_client_profiles.display_name),
    event_type = coalesce(excluded.event_type, inquiry_client_profiles.event_type),
    event_date_text = coalesce(excluded.event_date_text, inquiry_client_profiles.event_date_text),
    event_date_iso = coalesce(excluded.event_date_iso, inquiry_client_profiles.event_date_iso),
    venue = coalesce(excluded.venue, inquiry_client_profiles.venue),
    location = coalesce(excluded.location, inquiry_client_profiles.location),
    guest_count = coalesce(excluded.guest_count, inquiry_client_profiles.guest_count),
    duration_minutes = coalesce(excluded.duration_minutes, inquiry_client_profiles.duration_minutes),
    budget_text = coalesce(excluded.budget_text, inquiry_client_profiles.budget_text),
    updated_at = now()
  returning id into v_profile_id;

  return jsonb_build_object('merged', true, 'profileId', v_profile_id);
end;
$$;

-- Profile lookup for the drafting stage, keyed by conversation.
create or replace function public.get_inquiry_client_profile(
  p_conversation_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(profile) - 'id' - 'contact_id' - 'created_at'
    from public.inquiry_client_profiles profile
    join public.inquiry_conversations conversation
      on conversation.contact_id = profile.contact_id
    where conversation.id = p_conversation_id;
$$;
