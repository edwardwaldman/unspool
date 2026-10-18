-- Security hardening. Additive only: no drops (tables, columns and policies are left in place).
--
-- 1) Direct table access from the browser. The app never queries tables with the anon key: every read
--    and write goes through server routes using the service role. But the "reels: owner can read"
--    policy let any signed-in user call PostgREST with their own access token and read script_json
--    (the full script) of every reel of their document, including reels still locked behind the hourly
--    drip / paywall. Revoke all table privileges from the API roles so RLS policies become inert
--    defense in depth and nothing is reachable with the anon key or a user JWT.
revoke all on table public.reels from anon, authenticated;
revoke all on table public.documents from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.purchases from anon, authenticated;
revoke all on table public._probe from anon, authenticated;

-- 2) A usage ledger for rate limits. Daily upload limits used to count rows in `documents`, so deleting
--    a document (or the account) gave the slot back, and the count-then-insert check raced under
--    concurrent requests. Events here are never deleted by the app (only pruned after a few days),
--    and claim_usage() checks and records under one lock.
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('upload', 'retry')),
  user_id uuid,
  ip_hash text,
  document_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_idx on public.usage_events (kind, user_id, created_at desc);
create index if not exists usage_events_ip_idx on public.usage_events (kind, ip_hash, created_at desc);
create index if not exists usage_events_document_idx on public.usage_events (kind, document_id, created_at desc);

alter table public.usage_events enable row level security;
revoke all on table public.usage_events from anon, authenticated;
grant select, insert, delete on table public.usage_events to service_role;

-- Seed the ledger with today's uploads so the new limit starts from the real count.
insert into public.usage_events (kind, user_id, ip_hash, document_id, created_at)
select 'upload', d.user_id, d.ip_hash, d.id, d.created_at
from public.documents d
where d.created_at > now() - interval '24 hours'
  and not exists (select 1 from public.usage_events e where e.kind = 'upload' and e.document_id = d.id);

/**
 * Record one use of `p_kind` if fewer than `p_limit` were recorded in the last 24 hours, counted by
 * p_scope: 'user' (this user), 'user_or_ip' (this user or this IP hash) or 'document'.
 * Returns true when the use was recorded (allowed), false when over the limit.
 */
create or replace function public.claim_usage(
  p_kind text,
  p_scope text,
  p_limit integer,
  p_user_id uuid default null,
  p_ip_hash text default null,
  p_document_id uuid default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  used integer;
begin
  -- Serialize claims of the same kind so concurrent requests can't all pass the check.
  perform pg_advisory_xact_lock(hashtext('unspool.claim_usage:' || p_kind));
  select count(*) into used
  from public.usage_events e
  where e.kind = p_kind
    and e.created_at > now() - interval '24 hours'
    and case p_scope
      when 'user' then e.user_id = p_user_id
      when 'user_or_ip' then e.user_id = p_user_id or e.ip_hash = p_ip_hash
      when 'document' then e.document_id = p_document_id
      else false
    end;
  if used >= p_limit then
    return false;
  end if;
  insert into public.usage_events (kind, user_id, ip_hash, document_id)
  values (p_kind, p_user_id, p_ip_hash, p_document_id);
  return true;
end;
$$;

revoke execute on function public.claim_usage(text, text, integer, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.claim_usage(text, text, integer, uuid, text, uuid) to service_role;
