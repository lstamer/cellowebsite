begin;

-- A visitor's progress belongs to one form attempt. The random ID keeps
-- public writes scoped to that attempt, even if the visitor changes email.
create table public.inquiry_booking_attempts (
  id uuid primary key,
  revision integer not null check (revision > 0),
  step smallint not null check (step in (1, 2)),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  session_id text,
  email text not null check (btrim(email) <> ''),
  phone_e164 text,
  whatsapp_e164 text,
  step_one_at timestamptz not null default now(),
  step_two_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (step <> 2 or step_two_at is not null)
);

create index inquiry_booking_attempts_created_idx
  on public.inquiry_booking_attempts (created_at desc);

create table public.inquiry_booking_draft_events (
  attempt_id uuid not null references public.inquiry_booking_attempts(id) on delete cascade,
  id uuid not null,
  revision integer not null check (revision > 0),
  action text not null check (action in ('whatsapp', 'email', 'email_app', 'gmail', 'email_copy')),
  source text not null check (source in ('ai', 'template')),
  subject text,
  body text not null check (length(body) between 1 and 6000),
  created_at timestamptz not null default now(),
  primary key (attempt_id, id),
  check ((subject is null) = (action = 'whatsapp'))
);

create index inquiry_booking_draft_events_attempt_created_idx
  on public.inquiry_booking_draft_events (attempt_id, created_at desc);

alter table public.inquiry_booking_attempts enable row level security;
alter table public.inquiry_booking_draft_events enable row level security;
revoke all on table public.inquiry_booking_attempts, public.inquiry_booking_draft_events
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.inquiry_booking_attempts to service_role;
grant select, insert on table public.inquiry_booking_draft_events to service_role;

create function public.record_booking_progress(
  p_attempt_id uuid,
  p_revision integer,
  p_step integer,
  p_snapshot jsonb,
  p_session_id text,
  p_phone_e164 text,
  p_whatsapp_e164 text,
  p_event jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.inquiry_booking_attempts as attempt (
    id, revision, step, snapshot, session_id, email, phone_e164, whatsapp_e164, step_two_at
  )
  values (
    p_attempt_id, p_revision, p_step, p_snapshot, p_session_id,
    btrim(p_snapshot->>'email'), p_phone_e164, p_whatsapp_e164,
    case when p_step = 2 then now() end
  )
  on conflict (id) do update set
    revision = excluded.revision,
    step = excluded.step,
    snapshot = excluded.snapshot,
    session_id = coalesce(excluded.session_id, attempt.session_id),
    email = excluded.email,
    phone_e164 = excluded.phone_e164,
    whatsapp_e164 = excluded.whatsapp_e164,
    step_two_at = coalesce(attempt.step_two_at, excluded.step_two_at),
    updated_at = now()
  where excluded.revision > attempt.revision;

  -- A late step-two request still marks completion without replacing a
  -- newer snapshot from someone who went back and edited the first step.
  if p_step = 2 then
    update public.inquiry_booking_attempts
    set step_two_at = now(), updated_at = now()
    where id = p_attempt_id and step_two_at is null;
  end if;

  if p_event is not null then
    if p_step <> 2 then
      raise exception 'Draft actions require a completed form';
    end if;
    insert into public.inquiry_booking_draft_events (
      attempt_id, id, revision, action, source, subject, body
    )
    values (
      p_attempt_id, (p_event->>'id')::uuid, p_revision, p_event->>'action',
      p_event->>'source', p_event->>'subject', p_event->>'body'
    )
    on conflict (attempt_id, id) do nothing;
  end if;
end;
$$;

revoke all on function public.record_booking_progress(uuid, integer, integer, jsonb, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.record_booking_progress(uuid, integer, integer, jsonb, text, text, text, jsonb)
  to service_role;

commit;
