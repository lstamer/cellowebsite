-- Atomic, shared request limits for public forms, telemetry, and admin login.
-- The key stores an HMAC of the platform-supplied client IP, never the IP itself.

begin;

create table if not exists public.request_rate_limit_buckets (
  family text not null check (family in ('public_form', 'telemetry', 'admin_login')),
  scope text not null check (scope in ('ip', 'global')),
  bucket_key text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (family, scope, bucket_key, window_started_at),
  check (
    (scope = 'global' and bucket_key = 'global') or
    (scope = 'ip' and bucket_key ~ '^[0-9a-f]{64}$')
  )
);

create index if not exists request_rate_limit_buckets_expiry_idx
  on public.request_rate_limit_buckets (expires_at);

alter table public.request_rate_limit_buckets enable row level security;
revoke all on table public.request_rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table public.request_rate_limit_buckets to service_role;

create or replace function public.consume_public_request_limit(
  p_family text,
  p_ip_hash text default null
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  rate_limit integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ip_limit integer;
  v_global_limit integer;
  v_window_seconds integer;
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_expiry timestamptz;
  v_ip_count integer;
  v_global_count integer;
  v_remaining integer;
begin
  case p_family
    when 'public_form' then
      v_ip_limit := 5;
      v_global_limit := 120;
      v_window_seconds := 600;
    when 'telemetry' then
      v_ip_limit := 120;
      v_global_limit := 6000;
      v_window_seconds := 60;
    when 'admin_login' then
      v_ip_limit := 10;
      v_global_limit := 60;
      v_window_seconds := 900;
    else
      raise exception 'Unsupported request limit family';
  end case;

  if p_ip_hash is not null and p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid request limit key';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / v_window_seconds) * v_window_seconds
  );
  v_window_end := v_window_start + make_interval(secs => v_window_seconds);
  v_expiry := v_window_end;

  -- Once the shared bucket is known to be full, avoid creating per-IP rows for
  -- traffic that cannot pass. This is a fast pre-check; the final global upsert
  -- below remains the atomic authority when requests race at the threshold.
  select bucket.request_count
    into v_global_count
    from public.request_rate_limit_buckets bucket
   where bucket.family = p_family
     and bucket.scope = 'global'
     and bucket.bucket_key = 'global'
     and bucket.window_started_at = v_window_start;

  if coalesce(v_global_count, 0) >= v_global_limit then
    delete from public.request_rate_limit_buckets
     where ctid in (
       select ctid
         from public.request_rate_limit_buckets
        where expires_at <= v_now
        order by expires_at
        limit 250
     );
    return query select
      false,
      greatest(1, ceil(extract(epoch from (v_window_end - v_now)))::integer),
      case when p_ip_hash is null then v_global_limit else v_ip_limit end,
      0;
    return;
  end if;

  if p_ip_hash is not null then
    insert into public.request_rate_limit_buckets (
      family, scope, bucket_key, window_started_at, request_count, expires_at
    ) values (
      p_family, 'ip', p_ip_hash, v_window_start, 1, v_expiry
    )
    on conflict (family, scope, bucket_key, window_started_at)
    do update set
      request_count = least(
        public.request_rate_limit_buckets.request_count + 1,
        v_ip_limit + 1
      ),
      expires_at = excluded.expires_at
    returning request_count into v_ip_count;

    if v_ip_count > v_ip_limit then
      delete from public.request_rate_limit_buckets
       where ctid in (
         select ctid
           from public.request_rate_limit_buckets
          where expires_at <= v_now
          order by expires_at
          limit 250
       );
      return query select
        false,
        greatest(1, ceil(extract(epoch from (v_window_end - v_now)))::integer),
        v_ip_limit,
        0;
      return;
    end if;
  end if;

  insert into public.request_rate_limit_buckets (
    family, scope, bucket_key, window_started_at, request_count, expires_at
  ) values (
    p_family, 'global', 'global', v_window_start, 1, v_expiry
  )
  on conflict (family, scope, bucket_key, window_started_at)
  do update set
    request_count = least(
      public.request_rate_limit_buckets.request_count + 1,
      v_global_limit + 1
    ),
    expires_at = excluded.expires_at
  returning request_count into v_global_count;

  -- Opportunistically prune a bounded batch. This keeps storage close to the
  -- active windows without requiring pg_cron or a second scheduler.
  delete from public.request_rate_limit_buckets
   where ctid in (
     select ctid
       from public.request_rate_limit_buckets
      where expires_at <= v_now
      order by expires_at
      limit 250
   );

  v_remaining := greatest(0, v_global_limit - v_global_count);
  if p_ip_hash is not null then
    v_remaining := least(v_remaining, greatest(0, v_ip_limit - v_ip_count));
  end if;

  return query select
    (v_global_count <= v_global_limit and (p_ip_hash is null or v_ip_count <= v_ip_limit)),
    greatest(1, ceil(extract(epoch from (v_window_end - v_now)))::integer),
    case when p_ip_hash is null then v_global_limit else v_ip_limit end,
    v_remaining;
end;
$$;

revoke all on function public.consume_public_request_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_public_request_limit(text, text) to service_role;

commit;
