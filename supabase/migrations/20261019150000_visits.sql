-- Visit log for the owner panel: one row per browser tab session, with the pages and key actions in it.
-- Raw IPs are kept (the owner reads them to spot abuse); rows older than 90 days are deleted by the nightly cron.
create table if not exists public.visits (
  id uuid primary key,
  visitor_id text not null,
  user_id uuid,
  email text,
  ip text,
  country text,
  user_agent text,
  referrer text,
  landing text,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  duration_ms bigint not null default 0,
  -- [{ t: ms since the visit started, name, detail? }], capped by track_visit.
  events jsonb not null default '[]'::jsonb,
  signed_up boolean not null default false,
  checkout boolean not null default false
);
create index if not exists visits_started_idx on public.visits (started_at desc);
create index if not exists visits_visitor_idx on public.visits (visitor_id, started_at);
create index if not exists visits_ip_idx on public.visits (ip);
create index if not exists visits_user_idx on public.visits (user_id) where user_id is not null;

-- Server-only, like the other tables.
alter table public.visits enable row level security;
revoke all on table public.visits from anon, authenticated;
grant select, insert, update, delete on table public.visits to service_role;

-- The owner's chosen test view ("free" / "plus" / ...), so background jobs treat the owner's new documents
-- the way the request that uploaded them did. Null = the normal unlimited owner.
alter table public.profiles add column if not exists owner_view text check (owner_view in ('free', 'plus', 'pro', 'ultra'));

/**
 * Start or continue a visit and append a batch of events, atomically (beacons can arrive together).
 * A visit only accepts events from the visitor cookie that started it. At most p_max events are kept.
 */
create or replace function public.track_visit(
  p_id uuid,
  p_visitor text,
  p_user_id uuid,
  p_email text,
  p_ip text,
  p_country text,
  p_user_agent text,
  p_referrer text,
  p_landing text,
  p_events jsonb,
  p_duration_ms bigint,
  p_max integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.visits (id, visitor_id, user_id, email, ip, country, user_agent, referrer, landing)
  values (p_id, p_visitor, p_user_id, p_email, p_ip, p_country, p_user_agent, p_referrer, p_landing)
  on conflict (id) do nothing;

  update public.visits v
  set
    events = v.events || coalesce(
      (
        select jsonb_agg(x.e order by x.n)
        from jsonb_array_elements(p_events) with ordinality as x(e, n)
        where x.n <= greatest(0, p_max - jsonb_array_length(v.events))
      ),
      '[]'::jsonb
    ),
    last_seen_at = now(),
    duration_ms = greatest(v.duration_ms, p_duration_ms),
    user_id = coalesce(p_user_id, v.user_id),
    email = coalesce(p_email, v.email),
    signed_up = v.signed_up or p_events @> '[{"name":"signup_done"}]'::jsonb,
    checkout = v.checkout or p_events @> '[{"name":"checkout_clicked"}]'::jsonb
  where v.id = p_id and v.visitor_id = p_visitor;
end;
$$;

revoke execute on function public.track_visit(uuid, text, uuid, text, text, text, text, text, text, jsonb, bigint, integer) from public, anon, authenticated;
grant execute on function public.track_visit(uuid, text, uuid, text, text, text, text, text, text, jsonb, bigint, integer) to service_role;
