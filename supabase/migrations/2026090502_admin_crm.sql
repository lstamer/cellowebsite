-- Plan 007, Phase 2/3: the admin CRM's data layer.
--
-- 1. People become the CRM spine, keyed on phone OR email, with stage / tags /
--    notes so Luke can work a lead without leaving the admin.
-- 2. Every admin mutation is audited (admin_audit_log).
-- 3. The Telegram card wordings and AI prompt scaffolds become versioned,
--    editable rows (inquiry_prompt_templates) with code defaults as fallback.
-- 4. Brain docs gain version history; reply examples gain edit tracking.
-- 5. First-party, cookieless visitor analytics (site_visits / site_events).
-- 6. Health probe storage (health_checks / health_state).
-- 7. Read-model views so list pages are single queries.

-- ---------------------------------------------------------------------------
-- 1. People: phone or email
-- ---------------------------------------------------------------------------

alter table public.inquiry_people
  alter column phone_e164 drop not null;

-- The inline `unique` from 202608070001 becomes a partial unique index so
-- email-only people (null phone) can coexist.
alter table public.inquiry_people
  drop constraint if exists inquiry_people_phone_e164_key;

create unique index if not exists inquiry_people_phone_unique_idx
  on public.inquiry_people(phone_e164)
  where phone_e164 is not null;

-- One email-only person per address. A person WITH a phone may share an email
-- with someone else (couples booking together), so uniqueness only binds rows
-- that have nothing but the email to identify them.
create unique index if not exists inquiry_people_email_only_unique_idx
  on public.inquiry_people(lower(email))
  where phone_e164 is null and email is not null;

create index if not exists inquiry_people_email_idx
  on public.inquiry_people(lower(email))
  where email is not null;

alter table public.inquiry_people
  add column if not exists stage text not null default 'new' check (
    stage in ('new', 'contacted', 'quoted', 'booked', 'played', 'lost')
  ),
  add column if not exists source text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists notes text,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_by text,
  add column if not exists last_activity_at timestamptz;

-- Every row must still identify a human somehow.
alter table public.inquiry_people
  drop constraint if exists inquiry_people_identity_check;
alter table public.inquiry_people
  add constraint inquiry_people_identity_check
  check (phone_e164 is not null or email is not null);

create index if not exists inquiry_people_stage_idx
  on public.inquiry_people(stage, updated_at desc)
  where archived_at is null;

-- Phone first, then email. See 202608070001 for why the stored display name
-- wins over a later one (the website name beats the WhatsApp nickname).
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
  v_phone text;
  v_email text;
  v_name text;
begin
  v_phone := case
    when p_phone_e164 ~ '^\+[1-9][0-9]{6,14}$' then p_phone_e164
    else null
  end;
  v_email := nullif(btrim(coalesce(p_email, '')), '');
  v_name := nullif(btrim(coalesce(p_display_name, '')), '');

  if v_phone is null and v_email is null then
    return null;
  end if;

  if v_phone is not null then
    -- Someone we only knew by email now has a phone: upgrade that row rather
    -- than opening a second one. The unique phone index makes a concurrent
    -- insert of the same number a unique_violation, in which case the normal
    -- phone upsert below finds the winner.
    if v_email is not null then
      begin
        update public.inquiry_people person
           set phone_e164 = v_phone,
               display_name = coalesce(person.display_name, v_name),
               updated_at = now()
         where person.phone_e164 is null
           and lower(person.email) = lower(v_email)
           and not exists (
             select 1 from public.inquiry_people other where other.phone_e164 = v_phone
           )
        returning person.id into v_person_id;

        if v_person_id is not null then
          return v_person_id;
        end if;
      exception when unique_violation then
        v_person_id := null;
      end;
    end if;

    insert into public.inquiry_people (phone_e164, display_name, email)
    values (v_phone, v_name, v_email)
    on conflict (phone_e164) where phone_e164 is not null do update set
      display_name = coalesce(inquiry_people.display_name, excluded.display_name),
      email = coalesce(inquiry_people.email, excluded.email),
      updated_at = now()
    returning id into v_person_id;

    return v_person_id;
  end if;

  -- Email only. Prefer an existing person who also has a phone (richer row),
  -- else the email-only row, else create one.
  select person.id
    into v_person_id
    from public.inquiry_people person
   where lower(person.email) = lower(v_email)
   order by (person.phone_e164 is not null) desc, person.created_at asc
   limit 1;

  if v_person_id is not null then
    update public.inquiry_people
       set display_name = coalesce(display_name, v_name),
           updated_at = now()
     where id = v_person_id;
    return v_person_id;
  end if;

  insert into public.inquiry_people (phone_e164, display_name, email)
  values (null, v_name, v_email)
  on conflict ((lower(email))) where phone_e164 is null and email is not null do update set
    display_name = coalesce(inquiry_people.display_name, excluded.display_name),
    updated_at = now()
  returning id into v_person_id;

  return v_person_id;
end;
$$;

-- Website leads: new trailing argument for the analytics session. Dropped and
-- recreated because the signature changes (see 202608070001 for the reasoning).
drop function if exists public.create_website_lead(
  text, text, text, text, text, text, text, text, text, text, date, boolean,
  text, integer, integer, text, text, text, jsonb, text
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
  p_phone_e164 text default null,
  p_session_id text default null
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
  v_phone_e164 := nullif(btrim(coalesce(p_phone_e164, '')), '');
  if v_phone_e164 !~ '^\+[1-9][0-9]{6,14}$' then
    v_phone_e164 := null;
  end if;

  -- Email-only leads now link too (phone-or-email upsert above).
  v_person_id := public.upsert_inquiry_person(
    v_phone_e164,
    nullif(btrim(concat_ws(' ', btrim(p_first_name), btrim(coalesce(p_last_name, '')))), ''),
    p_email
  );

  insert into public.inquiry_website_leads (
    source, first_name, last_name, email, phone, whatsapp, whatsapp_digits,
    phone_e164, person_id, contact_preference, event_type, event_date_text,
    event_date_iso, date_flexible, location, guest_count, performance_minutes,
    booker_role, message, notes, payload, session_id
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
    coalesce(p_payload, '{}'::jsonb),
    nullif(btrim(coalesce(p_session_id, '')), '')
  )
  returning id into v_lead_id;

  if v_person_id is not null then
    update public.inquiry_people
       set last_activity_at = greatest(coalesce(last_activity_at, 'epoch'::timestamptz), now()),
           source = coalesce(source, p_source)
     where id = v_person_id;
  end if;

  return jsonb_build_object('leadId', v_lead_id);
end;
$$;

-- Backfill: leads stored before people could be keyed on email get their
-- person now. Only touches unlinked rows, so re-running is a no-op.
update public.inquiry_website_leads lead
   set person_id = public.upsert_inquiry_person(
         lead.phone_e164,
         nullif(btrim(concat_ws(' ', lead.first_name, coalesce(lead.last_name, ''))), ''),
         lead.email
       )
 where lead.person_id is null
   and (lead.phone_e164 is not null or lead.email is not null);

-- Merge two people. Everything that pointed at `drop` points at `keep`;
-- empty fields on `keep` are filled from `drop`; tags are unioned; notes are
-- concatenated; `drop` is deleted.
create or replace function public.merge_inquiry_people(
  p_keep uuid,
  p_drop uuid,
  p_actor text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_keep public.inquiry_people;
  v_drop public.inquiry_people;
  v_leads integer;
  v_contacts integer;
begin
  if p_keep = p_drop then
    raise exception 'Cannot merge a person into themselves';
  end if;

  select * into v_keep from public.inquiry_people where id = p_keep for update;
  select * into v_drop from public.inquiry_people where id = p_drop for update;

  if v_keep.id is null or v_drop.id is null then
    raise exception 'Both people must exist';
  end if;

  if v_keep.phone_e164 is not null and v_drop.phone_e164 is not null
     and v_keep.phone_e164 <> v_drop.phone_e164 then
    raise exception 'Both people have different phone numbers; merge is ambiguous';
  end if;

  update public.inquiry_website_leads set person_id = p_keep where person_id = p_drop;
  get diagnostics v_leads = row_count;

  update public.inquiry_contacts set person_id = p_keep where person_id = p_drop;
  get diagnostics v_contacts = row_count;

  -- Free the dropped row's unique keys before copying them across.
  delete from public.inquiry_people where id = p_drop;

  update public.inquiry_people
     set phone_e164 = coalesce(v_keep.phone_e164, v_drop.phone_e164),
         email = coalesce(v_keep.email, v_drop.email),
         display_name = coalesce(v_keep.display_name, v_drop.display_name),
         source = coalesce(v_keep.source, v_drop.source),
         tags = (select coalesce(array_agg(distinct tag), '{}') from unnest(v_keep.tags || v_drop.tags) as tag),
         notes = nullif(concat_ws(E'\n\n', v_keep.notes, v_drop.notes), ''),
         -- The further-along stage wins.
         stage = case
           when array_position(array['new','contacted','quoted','booked','played','lost'], v_drop.stage)
              > array_position(array['new','contacted','quoted','booked','played','lost'], v_keep.stage)
             and v_drop.stage <> 'lost'
           then v_drop.stage
           else v_keep.stage
         end,
         last_activity_at = greatest(v_keep.last_activity_at, v_drop.last_activity_at),
         updated_by = coalesce(p_actor, v_keep.updated_by),
         updated_at = now()
   where id = p_keep;

  return jsonb_build_object(
    'keptId', p_keep,
    'droppedId', p_drop,
    'movedLeads', v_leads,
    'movedContacts', v_contacts
  );
end;
$$;

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

alter table public.admin_audit_log enable row level security;

create index if not exists admin_audit_log_row_idx
  on public.admin_audit_log(table_name, row_id, created_at desc);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Editable, versioned templates (Telegram cards + AI prompt scaffolds)
--
-- Code defaults live in src/lib/admin/templates.ts. A row here overrides the
-- default while active; deactivating it (or deleting it) restores the default.
-- ---------------------------------------------------------------------------

create table if not exists public.inquiry_prompt_templates (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_.]*$'),
  kind text not null check (kind in ('ai_prompt', 'telegram_card')),
  content text not null check (btrim(content) <> ''),
  version integer not null default 1 check (version >= 1),
  active boolean not null default true,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_prompt_template_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.inquiry_prompt_templates(slug) on delete cascade,
  version integer not null,
  content text not null,
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (slug, version)
);

alter table public.inquiry_prompt_templates enable row level security;
alter table public.inquiry_prompt_template_versions enable row level security;

create or replace function public.save_prompt_template(
  p_slug text,
  p_kind text,
  p_content text,
  p_actor text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
begin
  insert into public.inquiry_prompt_templates (slug, kind, content, version, active, updated_by)
  values (p_slug, p_kind, p_content, 1, true, p_actor)
  on conflict (slug) do update set
    content = excluded.content,
    version = inquiry_prompt_templates.version + 1,
    active = true,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning version into v_version;

  insert into public.inquiry_prompt_template_versions (slug, version, content, note, created_by)
  values (p_slug, v_version, p_content, p_note, p_actor);

  return jsonb_build_object('slug', p_slug, 'version', v_version);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Brain docs: versions. Reply examples: edit tracking.
-- ---------------------------------------------------------------------------

alter table public.inquiry_brain_docs
  add column if not exists updated_by text,
  add column if not exists version integer not null default 1;

create table if not exists public.inquiry_brain_doc_versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.inquiry_brain_docs(id) on delete cascade,
  version integer not null,
  title text not null,
  category text not null,
  content text not null,
  active boolean not null,
  sort_order integer not null,
  created_by text,
  created_at timestamptz not null default now(),
  unique (doc_id, version)
);

alter table public.inquiry_brain_doc_versions enable row level security;

create or replace function public.save_brain_doc(
  p_id uuid,
  p_slug text,
  p_title text,
  p_category text,
  p_content text,
  p_active boolean,
  p_sort_order integer,
  p_actor text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_version integer;
begin
  if p_id is null then
    insert into public.inquiry_brain_docs (slug, title, category, content, active, sort_order, updated_by, version)
    values (p_slug, p_title, p_category, p_content, coalesce(p_active, true), coalesce(p_sort_order, 100), p_actor, 1)
    returning id, version into v_id, v_version;
  else
    update public.inquiry_brain_docs
       set slug = coalesce(p_slug, slug),
           title = p_title,
           category = p_category,
           content = p_content,
           active = coalesce(p_active, active),
           sort_order = coalesce(p_sort_order, sort_order),
           updated_by = p_actor,
           version = version + 1,
           updated_at = now()
     where id = p_id
    returning id, version into v_id, v_version;

    if v_id is null then
      raise exception 'Brain doc % not found', p_id;
    end if;
  end if;

  insert into public.inquiry_brain_doc_versions (doc_id, version, title, category, content, active, sort_order, created_by)
  select d.id, d.version, d.title, d.category, d.content, d.active, d.sort_order, p_actor
    from public.inquiry_brain_docs d
   where d.id = v_id;

  return jsonb_build_object('id', v_id, 'version', v_version);
end;
$$;

alter table public.inquiry_reply_examples
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by text;

-- ---------------------------------------------------------------------------
-- 5. First-party visitor analytics. No cookies, no IPs, no fingerprints: a
--    random per-tab session id from sessionStorage plus the page, referrer,
--    UTM tags, device class and country from Vercel's geo header.
-- ---------------------------------------------------------------------------

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (session_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  path text not null,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  country text,
  created_at timestamptz not null default now()
);

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (session_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  name text not null check (name ~ '^[a-z][a-z0-9_]{1,40}$'),
  path text,
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.site_visits enable row level security;
alter table public.site_events enable row level security;

create index if not exists site_visits_created_idx on public.site_visits(created_at desc);
create index if not exists site_visits_session_idx on public.site_visits(session_id, created_at);
create index if not exists site_events_created_idx on public.site_events(created_at desc);
create index if not exists site_events_session_idx on public.site_events(session_id, created_at);
create index if not exists site_events_name_idx on public.site_events(name, created_at desc);

-- Aggregates for the analytics page in one round trip.
create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with since as (
    select now() - make_interval(days => greatest(p_days, 1)) as ts
  ),
  visits as (
    select v.* from public.site_visits v, since where v.created_at >= since.ts
  ),
  events as (
    select e.* from public.site_events e, since where e.created_at >= since.ts
  ),
  daily as (
    select date_trunc('day', created_at)::date as day,
           count(*) as views,
           count(distinct session_id) as sessions
      from visits
     group by 1
     order by 1
  ),
  pages as (
    select path, count(*) as views, count(distinct session_id) as sessions
      from visits group by path order by views desc limit 15
  ),
  referrers as (
    select coalesce(referrer_host, '(direct)') as host, count(distinct session_id) as sessions
      from visits group by 1 order by sessions desc limit 12
  ),
  sources as (
    select coalesce(utm_source, '(none)') as source, count(distinct session_id) as sessions
      from visits group by 1 order by sessions desc limit 12
  ),
  devices as (
    select coalesce(device, 'unknown') as device, count(distinct session_id) as sessions
      from visits group by 1 order by sessions desc
  ),
  countries as (
    select coalesce(country, '??') as country, count(distinct session_id) as sessions
      from visits group by 1 order by sessions desc limit 10
  ),
  funnel as (
    select
      (select count(distinct session_id) from visits where path = '/book') as book_views,
      (select count(distinct session_id) from events where name = 'book_step_2') as step_2,
      (select count(distinct session_id) from events where name = 'book_submitted') as submitted,
      (select count(distinct session_id) from events where name = 'whatsapp_click') as whatsapp_clicks
  )
  select jsonb_build_object(
    'days', p_days,
    'totals', jsonb_build_object(
      'views', (select count(*) from visits),
      'sessions', (select count(distinct session_id) from visits),
      'leads', (select count(*) from public.inquiry_website_leads l, since where l.created_at >= since.ts)
    ),
    'daily', (select coalesce(jsonb_agg(to_jsonb(daily)), '[]'::jsonb) from daily),
    'pages', (select coalesce(jsonb_agg(to_jsonb(pages)), '[]'::jsonb) from pages),
    'referrers', (select coalesce(jsonb_agg(to_jsonb(referrers)), '[]'::jsonb) from referrers),
    'sources', (select coalesce(jsonb_agg(to_jsonb(sources)), '[]'::jsonb) from sources),
    'devices', (select coalesce(jsonb_agg(to_jsonb(devices)), '[]'::jsonb) from devices),
    'countries', (select coalesce(jsonb_agg(to_jsonb(countries)), '[]'::jsonb) from countries),
    'funnel', (select to_jsonb(funnel) from funnel)
  );
$$;

-- The path one session took, oldest first: what the CRM shows next to a lead.
create or replace function public.admin_session_path(p_session_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(step order by step_at), '[]'::jsonb)
    from (
      select jsonb_build_object('kind', 'view', 'path', v.path, 'referrer', v.referrer_host, 'at', v.created_at) as step,
             v.created_at as step_at
        from public.site_visits v where v.session_id = p_session_id
      union all
      select jsonb_build_object('kind', 'event', 'name', e.name, 'path', e.path, 'at', e.created_at),
             e.created_at
        from public.site_events e where e.session_id = p_session_id
    ) steps;
$$;

-- ---------------------------------------------------------------------------
-- 6. Health
-- ---------------------------------------------------------------------------

create table if not exists public.health_checks (
  id uuid primary key default gen_random_uuid(),
  "check" text not null,
  ok boolean not null,
  latency_ms integer,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.health_state (
  "check" text primary key,
  ok boolean not null,
  since timestamptz not null default now(),
  last_checked_at timestamptz not null default now(),
  last_latency_ms integer,
  last_detail jsonb not null default '{}'::jsonb,
  last_alerted_at timestamptz
);

alter table public.health_checks enable row level security;
alter table public.health_state enable row level security;

create index if not exists health_checks_check_idx
  on public.health_checks("check", created_at desc);

-- Record a probe result and report whether the state flipped. `alert` is true
-- when the caller should notify (flip, and not alerted in the last 30 min).
create or replace function public.record_health_check(
  p_check text,
  p_ok boolean,
  p_latency_ms integer,
  p_detail jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous boolean;
  v_last_alerted timestamptz;
  v_flipped boolean := false;
  v_alert boolean := false;
begin
  insert into public.health_checks ("check", ok, latency_ms, detail)
  values (p_check, p_ok, p_latency_ms, coalesce(p_detail, '{}'::jsonb));

  select ok, last_alerted_at into v_previous, v_last_alerted
    from public.health_state where "check" = p_check for update;

  if not found then
    -- A brand-new check that starts failing is worth a message.
    v_flipped := not p_ok;
    v_alert := not p_ok;
    insert into public.health_state ("check", ok, since, last_checked_at, last_latency_ms, last_detail, last_alerted_at)
    values (
      p_check, p_ok, now(), now(), p_latency_ms, coalesce(p_detail, '{}'::jsonb),
      case when v_alert then now() else null end
    );
  else
    v_flipped := v_previous <> p_ok;
    -- Failure messages are rate-limited to one per 30 minutes per check so a
    -- flapping integration cannot flood the chat; a recovery always reports.
    v_alert := v_flipped and (
      p_ok
      or v_last_alerted is null
      or v_last_alerted < now() - interval '30 minutes'
    );
    update public.health_state
       set ok = p_ok,
           since = case when v_flipped then now() else since end,
           last_checked_at = now(),
           last_latency_ms = p_latency_ms,
           last_detail = coalesce(p_detail, '{}'::jsonb),
           last_alerted_at = case when v_alert and not p_ok then now() else last_alerted_at end
     where "check" = p_check;
  end if;

  return jsonb_build_object('flipped', v_flipped, 'alert', v_alert, 'previous', v_previous);
end;
$$;

-- Keep the checks table bounded: 14 days of five-minute samples.
create or replace function public.prune_health_checks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.health_checks where created_at < now() - interval '14 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Read models
-- ---------------------------------------------------------------------------

create or replace view public.admin_inquiries_v as
  select
    lead.id,
    'website'::text as channel,
    lead.source,
    null::uuid as conversation_id,
    nullif(concat_ws(' ', lead.first_name, lead.last_name), '') as name,
    lead.email,
    coalesce(lead.phone_e164, lead.phone) as phone,
    lead.whatsapp_digits,
    lead.event_type,
    lead.event_date_text,
    lead.event_date_iso,
    lead.location,
    lead.status,
    lead.alert_status,
    lead.availability,
    lead.person_id,
    person.stage,
    left(coalesce(lead.message, lead.notes), 240) as summary,
    lead.session_id,
    lead.created_at,
    lead.updated_at,
    (
      lead.alert_status = 'failed'
      or lead.review_notification_status in ('failed', 'uncertain')
    ) as needs_attention
  from public.inquiry_website_leads lead
  left join public.inquiry_people person on person.id = lead.person_id
  union all
  -- One row per WhatsApp conversation, whether or not the AI has analysed it
  -- yet (the `inquiries` row only appears after the first analysis).
  select
    conversation.id,
    'whatsapp'::text as channel,
    'whatsapp'::text as source,
    conversation.id as conversation_id,
    coalesce(profile.display_name, contact.display_name, person.display_name, contact.phone_e164) as name,
    person.email,
    contact.phone_e164 as phone,
    case when contact.phone_e164 is null then null else replace(contact.phone_e164, '+', '') end as whatsapp_digits,
    coalesce(profile.event_type, inquiry.latest_analysis -> 'event' ->> 'event_type') as event_type,
    coalesce(profile.event_date_text, inquiry.latest_analysis -> 'event' ->> 'event_date_text') as event_date_text,
    profile.event_date_iso,
    coalesce(profile.location, profile.venue, inquiry.latest_analysis -> 'event' ->> 'location') as location,
    coalesce(inquiry.status, conversation.state) as status,
    null::text as alert_status,
    null::text as availability,
    contact.person_id,
    person.stage,
    left(
      coalesce(
        inquiry.latest_analysis ->> 'summary',
        (
          select message.body
            from public.inquiry_messages message
           where message.conversation_id = conversation.id
           order by message.occurred_at desc
           limit 1
        )
      ),
      240
    ) as summary,
    null::text as session_id,
    conversation.created_at,
    greatest(conversation.updated_at, coalesce(inquiry.updated_at, conversation.updated_at)) as updated_at,
    exists (
      select 1
        from public.inquiry_approval_requests approval
       where approval.conversation_id = conversation.id
         and (
           approval.status in ('failed', 'send_uncertain')
           or approval.telegram_notification_status in ('failed', 'uncertain')
         )
    ) as needs_attention
  from public.inquiry_conversations conversation
  left join public.inquiries inquiry on inquiry.conversation_id = conversation.id
  left join public.inquiry_contacts contact on contact.id = conversation.contact_id
  left join public.inquiry_people person on person.id = contact.person_id
  left join public.inquiry_client_profiles profile on profile.contact_id = contact.id;

create or replace view public.admin_needs_attention_v as
  select
    'lead_alert_failed'::text as kind,
    'website_lead'::text as entity_type,
    lead.id::text as entity_id,
    'Telegram alert failed for ' || lead.first_name as title,
    lead.alert_error as detail,
    lead.updated_at as at
  from public.inquiry_website_leads lead
  where lead.alert_status = 'failed'
     or (lead.alert_status = 'skipped' and lead.alert_error like 'Gave up%')
  union all
  select
    'lead_review_undelivered', 'website_lead', lead.id::text,
    'Draft review card not delivered for ' || lead.first_name,
    lead.review_notification_error, lead.updated_at
  from public.inquiry_website_leads lead
  where lead.status = 'draft_ready'
    and lead.review_notification_status in ('failed', 'uncertain')
  union all
  select
    'approval_send_problem', 'approval', approval.id::text,
    'WhatsApp send ' || approval.status || ' for ' || coalesce(contact.display_name, contact.phone_e164, 'a contact'),
    approval.last_error, approval.updated_at
  from public.inquiry_approval_requests approval
  join public.inquiry_conversations conversation on conversation.id = approval.conversation_id
  left join public.inquiry_contacts contact on contact.id = conversation.contact_id
  where approval.status in ('failed', 'send_uncertain')
  union all
  select
    'approval_pending_stale', 'approval', approval.id::text,
    'Review card waiting over 24h for ' || coalesce(contact.display_name, contact.phone_e164, 'a contact'),
    null, approval.created_at
  from public.inquiry_approval_requests approval
  join public.inquiry_conversations conversation on conversation.id = approval.conversation_id
  left join public.inquiry_contacts contact on contact.id = conversation.contact_id
  where approval.status = 'pending'
    and approval.created_at < now() - interval '24 hours'
  union all
  select
    'outbox_failed', 'outbox', outbox.id::text,
    'Outbox event failed: ' || outbox.event_type,
    outbox.last_error, outbox.created_at
  from public.inquiry_outbox_events outbox
  where outbox.status = 'failed'
  union all
  select
    'health_failing', 'health', state."check",
    'Health check failing: ' || state."check",
    state.last_detail ->> 'message', state.since
  from public.health_state state
  where state.ok = false
  union all
  select
    'admin_event', 'admin_event', event.id::text,
    event.message,
    event.kind, event.created_at
  from public.admin_events event
  where event.level = 'error'
    and event.acknowledged_at is null;

-- Dashboard KPIs in one call.
create or replace function public.admin_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with leads as (
    select * from public.admin_inquiries_v
  ),
  by_channel as (
    select channel,
           count(*) filter (where created_at >= now() - interval '7 days') as last_7,
           count(*) filter (where created_at >= now() - interval '30 days') as last_30,
           count(*) filter (where created_at >= now() - interval '90 days') as last_90
      from leads group by channel
  ),
  by_event_type as (
    select coalesce(event_type, 'Unknown') as event_type, count(*) as total
      from leads where created_at >= now() - interval '90 days'
     group by 1 order by total desc limit 8
  ),
  by_source as (
    select source, count(*) as total
      from leads where created_at >= now() - interval '90 days'
     group by 1 order by total desc
  ),
  stages as (
    select stage, count(*) as total
      from public.inquiry_people where archived_at is null
     group by stage
  ),
  response as (
    select percentile_cont(0.5) within group (order by extract(epoch from (decided_at - created_at)) / 60) as median_minutes
      from public.inquiry_website_leads
     where decided_at is not null
       and created_at >= now() - interval '90 days'
  ),
  monthly as (
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, channel, count(*) as total
      from leads where created_at >= now() - interval '12 months'
     group by 1, 2 order by 1
  )
  select jsonb_build_object(
    'byChannel', (select coalesce(jsonb_agg(to_jsonb(by_channel)), '[]'::jsonb) from by_channel),
    'byEventType', (select coalesce(jsonb_agg(to_jsonb(by_event_type)), '[]'::jsonb) from by_event_type),
    'bySource', (select coalesce(jsonb_agg(to_jsonb(by_source)), '[]'::jsonb) from by_source),
    'stages', (select coalesce(jsonb_agg(to_jsonb(stages)), '[]'::jsonb) from stages),
    'medianResponseMinutes', (select median_minutes from response),
    'monthly', (select coalesce(jsonb_agg(to_jsonb(monthly)), '[]'::jsonb) from monthly),
    'needsAttention', (select count(*) from public.admin_needs_attention_v),
    'pendingApprovals', (select count(*) from public.inquiry_approval_requests where status = 'pending'),
    'openLeads', (select count(*) from public.inquiry_website_leads where status in ('new', 'drafting', 'draft_ready'))
  );
$$;
