-- Phase 2 of plans/007: the admin CRM data model.
--
-- 1. People become the CRM spine, keyed on phone OR email, with a pipeline
--    stage, tags and notes, plus a safe merge.
-- 2. An audit log for every manual correction made from the admin.
-- 3. Versioned, editable prompt templates and brain docs.
-- 4. Read models the admin pages query in one round trip.

-- ---------------------------------------------------------------------------
-- 1. People
-- ---------------------------------------------------------------------------

alter table public.inquiry_people
  alter column phone_e164 drop not null;

alter table public.inquiry_people
  add column if not exists stage text not null default 'new';

alter table public.inquiry_people
  drop constraint if exists inquiry_people_stage_check;

alter table public.inquiry_people
  add constraint inquiry_people_stage_check
  check (stage in ('new', 'contacted', 'quoted', 'booked', 'played', 'lost'));

alter table public.inquiry_people
  add column if not exists source text;

alter table public.inquiry_people
  add column if not exists tags text[] not null default '{}';

alter table public.inquiry_people
  add column if not exists notes text;

alter table public.inquiry_people
  add column if not exists archived_at timestamptz;

alter table public.inquiry_people
  add column if not exists updated_by text;

-- Email-only people are unique per email. A phone-keyed person may share an
-- email with nobody else either, but that is enforced by the merge in
-- upsert_inquiry_person rather than an index, because two real people can
-- legitimately share a family email address on WhatsApp.
create unique index if not exists inquiry_people_email_only_idx
  on public.inquiry_people (lower(email))
  where phone_e164 is null and email is not null;

create index if not exists inquiry_people_email_idx
  on public.inquiry_people (lower(email))
  where email is not null;

create index if not exists inquiry_people_stage_idx
  on public.inquiry_people (stage, updated_at desc)
  where archived_at is null;

-- Fold p_drop into p_keep: re-point every reference, fill gaps, delete p_drop.
create or replace function public.merge_inquiry_people(
  p_keep uuid,
  p_drop uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_drop public.inquiry_people%rowtype;
begin
  if p_keep = p_drop then
    return;
  end if;

  select * into v_drop from public.inquiry_people where id = p_drop for update;
  if not found then
    return;
  end if;

  perform 1 from public.inquiry_people where id = p_keep for update;
  if not found then
    raise exception 'merge_inquiry_people: keep person % does not exist', p_keep;
  end if;

  update public.inquiry_website_leads set person_id = p_keep where person_id = p_drop;
  update public.inquiry_contacts set person_id = p_keep where person_id = p_drop;

  update public.inquiry_people keep
    set
      phone_e164 = coalesce(keep.phone_e164, v_drop.phone_e164),
      display_name = coalesce(keep.display_name, v_drop.display_name),
      email = coalesce(keep.email, v_drop.email),
      source = coalesce(keep.source, v_drop.source),
      tags = (
        select coalesce(array_agg(distinct t), '{}')
        from unnest(keep.tags || v_drop.tags) as t
      ),
      notes = case
        when keep.notes is null then v_drop.notes
        when v_drop.notes is null then keep.notes
        else keep.notes || E'\n\n' || v_drop.notes
      end,
      stage = case
        when keep.stage = 'new' and v_drop.stage <> 'new' then v_drop.stage
        else keep.stage
      end,
      updated_at = now()
    where keep.id = p_keep;

  delete from public.inquiry_people where id = p_drop;
end;
$$;

-- Resolve (or create) the person behind a number or an email.
--
-- Phone wins: a canonical E.164 upserts on the phone index exactly as before.
-- Then, if the caller also supplied an email that an email-only person
-- already owns, that person is folded in, so a contact-form enquiry (email
-- only) and a later WhatsApp message (phone) from the same person end up as
-- one row. With no phone, the email path finds an existing person by email
-- (preferring one that already has a phone) or creates an email-only row.
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
  v_email text;
  v_name text;
  v_dup uuid;
begin
  v_email := nullif(btrim(coalesce(p_email, '')), '');
  if v_email is not null and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    v_email := null;
  end if;
  v_name := nullif(btrim(coalesce(p_display_name, '')), '');

  if p_phone_e164 is not null and p_phone_e164 ~ '^\+[1-9][0-9]{6,14}$' then
    insert into public.inquiry_people (phone_e164, display_name, email)
    values (p_phone_e164, v_name, v_email)
    on conflict (phone_e164) do update set
      display_name = coalesce(inquiry_people.display_name, excluded.display_name),
      email = coalesce(inquiry_people.email, excluded.email),
      updated_at = now()
    returning id into v_person_id;

    if v_email is not null then
      select id into v_dup
      from public.inquiry_people
      where phone_e164 is null
        and lower(email) = lower(v_email)
        and id <> v_person_id
      limit 1;
      if v_dup is not null then
        perform public.merge_inquiry_people(v_person_id, v_dup);
      end if;
    end if;

    return v_person_id;
  end if;

  if v_email is null then
    return null;
  end if;

  select id into v_person_id
  from public.inquiry_people
  where lower(email) = lower(v_email)
  order by (phone_e164 is not null) desc, created_at
  limit 1;

  if v_person_id is not null then
    update public.inquiry_people
      set
        display_name = coalesce(display_name, v_name),
        updated_at = now()
      where id = v_person_id;
    return v_person_id;
  end if;

  insert into public.inquiry_people (phone_e164, display_name, email)
  values (null, v_name, v_email)
  on conflict ((lower(email))) where phone_e164 is null and email is not null
  do update set
    display_name = coalesce(inquiry_people.display_name, excluded.display_name),
    updated_at = now()
  returning id into v_person_id;

  return v_person_id;
end;
$$;

-- Backfill: link email-only website leads that predate the email path.
do $$
declare
  r record;
  v_person uuid;
begin
  for r in
    select id, first_name, last_name, email
    from public.inquiry_website_leads
    where person_id is null and email is not null
    order by created_at
  loop
    v_person := public.upsert_inquiry_person(
      null,
      nullif(btrim(concat_ws(' ', btrim(r.first_name), btrim(coalesce(r.last_name, '')))), ''),
      r.email
    );
    if v_person is not null then
      update public.inquiry_website_leads set person_id = v_person where id = r.id;
    end if;
  end loop;
end;
$$;

revoke all on function public.merge_inquiry_people from public, anon, authenticated;
grant execute on function public.merge_inquiry_people to service_role;

-- ---------------------------------------------------------------------------
-- 2. Audit log
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('insert', 'update', 'delete', 'merge', 'action')),
  before jsonb,
  after jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_row_idx
  on public.admin_audit_log (table_name, row_id, created_at desc);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Prompt templates and brain doc versions
-- ---------------------------------------------------------------------------

create table if not exists public.inquiry_prompt_templates (
  slug text primary key,
  title text not null,
  description text,
  content text not null check (btrim(content) <> ''),
  version integer not null default 1,
  active boolean not null default true,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_prompt_template_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version integer not null,
  content text not null,
  note text,
  saved_by text,
  saved_at timestamptz not null default now(),
  unique (slug, version)
);

alter table public.inquiry_prompt_templates enable row level security;
alter table public.inquiry_prompt_template_versions enable row level security;

-- Save a template: bump the version and record it, atomically.
create or replace function public.save_prompt_template(
  p_slug text,
  p_title text,
  p_description text,
  p_content text,
  p_active boolean,
  p_actor text,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
begin
  insert into public.inquiry_prompt_templates (slug, title, description, content, active, updated_by)
  values (p_slug, p_title, p_description, p_content, coalesce(p_active, true), p_actor)
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    content = excluded.content,
    active = excluded.active,
    version = inquiry_prompt_templates.version + 1,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning version into v_version;

  insert into public.inquiry_prompt_template_versions (slug, version, content, note, saved_by)
  values (p_slug, v_version, p_content, p_note, p_actor);

  return v_version;
end;
$$;

alter table public.inquiry_brain_docs
  add column if not exists version integer not null default 1;

alter table public.inquiry_brain_docs
  add column if not exists updated_by text;

create table if not exists public.inquiry_brain_doc_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version integer not null,
  title text not null,
  category text not null,
  content text not null,
  saved_by text,
  saved_at timestamptz not null default now(),
  unique (slug, version)
);

alter table public.inquiry_brain_doc_versions enable row level security;

create or replace function public.save_brain_doc(
  p_slug text,
  p_title text,
  p_category text,
  p_content text,
  p_active boolean,
  p_sort_order integer,
  p_actor text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
begin
  insert into public.inquiry_brain_docs (slug, title, category, content, active, sort_order, updated_by)
  values (p_slug, p_title, p_category, p_content, coalesce(p_active, true), coalesce(p_sort_order, 100), p_actor)
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    content = excluded.content,
    active = excluded.active,
    sort_order = excluded.sort_order,
    version = inquiry_brain_docs.version + 1,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning version into v_version;

  insert into public.inquiry_brain_doc_versions (slug, version, title, category, content, saved_by)
  values (p_slug, v_version, p_title, p_category, p_content, p_actor);

  return v_version;
end;
$$;

revoke all on function public.save_prompt_template from public, anon, authenticated;
revoke all on function public.save_brain_doc from public, anon, authenticated;
grant execute on function public.save_prompt_template to service_role;
grant execute on function public.save_brain_doc to service_role;

-- ---------------------------------------------------------------------------
-- 4. Read models
-- ---------------------------------------------------------------------------

-- One row per enquiry regardless of channel. Website leads and WhatsApp
-- inquiries have different shapes; this view flattens the fields the list
-- page and dashboard need.
-- A view with the same name but different columns cannot be replaced in place.
drop view if exists public.admin_inquiries_v;
create or replace view public.admin_inquiries_v as
  select
    'website'::text as channel,
    l.id,
    l.created_at,
    l.updated_at as last_activity_at,
    l.source as origin,
    nullif(btrim(concat_ws(' ', l.first_name, coalesce(l.last_name, ''))), '') as contact_name,
    l.email,
    coalesce(l.whatsapp, l.phone) as phone,
    l.event_type,
    l.event_date_iso,
    l.event_date_text,
    l.location,
    l.guest_count,
    l.status,
    l.availability,
    l.alert_status,
    l.person_id,
    null::uuid as conversation_id,
    null::text as primary_intent,
    null::text as summary,
    coalesce(l.message, '') as preview
  from public.inquiry_website_leads l
  union all
  select
    'whatsapp'::text as channel,
    i.id,
    i.created_at,
    coalesce(c.last_inbound_at, i.updated_at) as last_activity_at,
    i.source as origin,
    coalesce(
      i.latest_analysis -> 'event' ->> 'contact_name',
      ct.display_name,
      p.display_name
    ) as contact_name,
    p.email,
    coalesce(ct.phone_e164, p.phone_e164) as phone,
    i.latest_analysis -> 'event' ->> 'event_type' as event_type,
    case
      when (i.latest_analysis -> 'event' ->> 'event_date_iso') ~ '^\d{4}-\d{2}-\d{2}$'
        then (i.latest_analysis -> 'event' ->> 'event_date_iso')::date
      else null
    end as event_date_iso,
    i.latest_analysis -> 'event' ->> 'event_date_text' as event_date_text,
    coalesce(
      i.latest_analysis -> 'event' ->> 'venue',
      i.latest_analysis -> 'event' ->> 'location'
    ) as location,
    (i.latest_analysis -> 'event' ->> 'guest_count')::integer as guest_count,
    i.status,
    null::text as availability,
    null::text as alert_status,
    ct.person_id,
    i.conversation_id,
    i.primary_intent,
    i.latest_analysis ->> 'summary' as summary,
    coalesce(
      (
        select m.body
        from public.inquiry_messages m
        where m.conversation_id = i.conversation_id and m.direction = 'incoming'
        order by m.occurred_at desc
        limit 1
      ),
      ''
    ) as preview
  from public.inquiries i
  join public.inquiry_conversations c on c.id = i.conversation_id
  left join public.inquiry_contacts ct on ct.id = c.contact_id
  left join public.inquiry_people p on p.id = ct.person_id;

-- Everything that needs a human. Each row is one thing to look at.
-- A view with the same name but different columns cannot be replaced in place.
drop view if exists public.admin_needs_attention_v;
create or replace view public.admin_needs_attention_v as
  select
    'lead_alert_failed'::text as kind,
    l.id as ref_id,
    l.created_at,
    concat('Telegram alert failed for ', l.first_name, ' (', l.alert_attempts, ' attempts)') as title,
    l.alert_error as detail
  from public.inquiry_website_leads l
  where l.alert_status = 'failed'
  union all
  select
    'approval_pending'::text,
    a.id,
    a.created_at,
    'WhatsApp reply waiting for approval',
    left(coalesce(a.final_reply, ''), 200)
  from public.inquiry_approval_requests a
  where a.status = 'pending' and a.created_at < now() - interval '12 hours'
  union all
  select
    'send_uncertain'::text,
    a.id,
    a.updated_at,
    'WhatsApp send outcome uncertain',
    a.last_error
  from public.inquiry_approval_requests a
  where a.status = 'send_uncertain'
  union all
  select
    'outbox_failed'::text,
    o.id,
    o.created_at,
    concat('Outbox event failed: ', o.event_type),
    o.last_error
  from public.inquiry_outbox_events o
  where o.status = 'failed'
  union all
  select
    'lead_draft_ready'::text,
    l.id,
    l.updated_at,
    concat('Draft ready for ', l.first_name, ', waiting for approval'),
    left(coalesce(l.final_reply, l.draft_reply, ''), 200)
  from public.inquiry_website_leads l
  where l.status = 'draft_ready' and l.updated_at < now() - interval '12 hours'
  union all
  select
    'event_error'::text,
    e.id,
    e.created_at,
    e.message,
    e.kind
  from public.admin_events e
  where e.level = 'error' and e.acknowledged_at is null;

revoke all on table public.admin_audit_log from anon, authenticated;
revoke all on table public.inquiry_prompt_templates from anon, authenticated;
revoke all on table public.inquiry_prompt_template_versions from anon, authenticated;
revoke all on table public.inquiry_brain_doc_versions from anon, authenticated;
revoke all on table public.admin_events from anon, authenticated;
revoke all on public.admin_inquiries_v from anon, authenticated;
revoke all on public.admin_needs_attention_v from anon, authenticated;
grant all on table public.admin_audit_log to service_role;
grant all on table public.inquiry_prompt_templates to service_role;
grant all on table public.inquiry_prompt_template_versions to service_role;
grant all on table public.inquiry_brain_doc_versions to service_role;
grant all on table public.admin_events to service_role;
grant select on public.admin_inquiries_v to service_role;
grant select on public.admin_needs_attention_v to service_role;
