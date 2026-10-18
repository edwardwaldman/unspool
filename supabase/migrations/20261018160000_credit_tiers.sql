-- Usage tiers measured in monthly reel credits (1 credit = 1 generated reel). Additive only: no drops.
-- The old single subscription (profiles.plan = 'sub') maps to the Plus tier.

alter table public.profiles add column if not exists tier text not null default 'free';
do $$ begin
  alter table public.profiles add constraint profiles_tier_check check (tier in ('free', 'plus', 'pro', 'ultra'));
exception when duplicate_object then null; end $$;
alter table public.profiles add column if not exists current_period_start timestamptz;
update public.profiles set tier = 'plus' where plan = 'sub' and tier = 'free';

-- How many of a document's reels are paid for with credits (reels 1..credit_reels generate and play).
-- Null until the plan exists. Plan-derived flags are frozen at plan time so the pipeline never re-derives them.
alter table public.documents add column if not exists credit_reels integer;
alter table public.documents add column if not exists priority boolean not null default false;
alter table public.documents add column if not exists long_reels boolean not null default false;
alter table public.documents add column if not exists watermark boolean not null default true;
-- Documents planned before credits existed keep every reel (their reels were already generated eagerly).
update public.documents set credit_reels = reel_count where credit_reels is null and reel_count is not null;

-- The credit ledger. subject is 'u:<user id>' for accounts and 'ip:<ip hash>' for signed-out visitors.
-- allowance_delta moves the monthly allowance of period_start; topup_delta moves the never-expiring top-up balance.
create table if not exists public.credit_events (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  kind text not null check (kind in ('reserve', 'refund', 'topup')),
  allowance_delta integer not null default 0,
  topup_delta integer not null default 0,
  period_start timestamptz,
  document_id uuid,
  reel_id uuid,
  stripe_session_id text,
  created_at timestamptz not null default now()
);
create index if not exists credit_events_subject_idx on public.credit_events (subject, period_start);
create index if not exists credit_events_document_idx on public.credit_events (document_id);
create unique index if not exists credit_events_refund_once on public.credit_events (reel_id) where kind = 'refund';
create unique index if not exists credit_events_topup_once on public.credit_events (stripe_session_id) where kind = 'topup';

alter table public.credit_events enable row level security;
revoke all on table public.credit_events from anon, authenticated;
grant select, insert on table public.credit_events to service_role;

/** Monthly credits used in p_period_start and the top-up balance for one subject. */
create or replace function public.credit_balance(p_subject text, p_period_start timestamptz)
returns table (used integer, topup integer)
language sql stable
set search_path = ''
as $$
  select
    coalesce(-sum(e.allowance_delta) filter (where e.period_start = p_period_start), 0)::integer,
    coalesce(sum(e.topup_delta), 0)::integer
  from public.credit_events e
  where e.subject = p_subject;
$$;

/**
 * Reserve up to p_requested credits for a document (monthly allowance first, then top-ups) and add what
 * was granted to documents.credit_reels, never beyond its reel_count. Serialized per subject, and the
 * document row is locked, so concurrent plans or unlocks can't overspend. Returns the credits granted.
 */
create or replace function public.claim_credits(
  p_subject text,
  p_document_id uuid,
  p_requested integer,
  p_allowance integer,
  p_period_start timestamptz
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_used integer;
  v_topup integer;
  v_total integer;
  v_have integer;
  v_want integer;
  a integer;
  t integer;
begin
  perform pg_advisory_xact_lock(hashtext('unspool.credits:' || p_subject));
  select d.reel_count, coalesce(d.credit_reels, 0) into v_total, v_have
  from public.documents d where d.id = p_document_id for update;
  if not found then
    return 0;
  end if;
  v_want := greatest(0, least(p_requested, coalesce(v_total, p_requested) - v_have));
  if v_want = 0 then
    update public.documents set credit_reels = v_have where id = p_document_id;
    return 0;
  end if;
  select b.used, b.topup into v_used, v_topup from public.credit_balance(p_subject, p_period_start) b;
  a := least(v_want, greatest(0, p_allowance - v_used));
  t := least(v_want - a, greatest(0, v_topup));
  if a + t > 0 then
    insert into public.credit_events (subject, kind, allowance_delta, topup_delta, period_start, document_id)
    values (p_subject, 'reserve', -a, -t, p_period_start, p_document_id);
  end if;
  update public.documents set credit_reels = v_have + a + t where id = p_document_id;
  return a + t;
end;
$$;

/**
 * Give back the credit of a reel that failed for good. Only reels covered by a reservation are refunded,
 * at most once per reel, to the bucket they came from (top-ups first, then the reserving period's allowance).
 */
create or replace function public.refund_reel_credit(p_reel_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_doc uuid;
  v_index integer;
  v_funded integer;
  r record;
  v_topup_reserved integer;
  v_topup_refunded integer;
begin
  select rl.document_id, rl.index into v_doc, v_index from public.reels rl where rl.id = p_reel_id;
  if not found then return false; end if;
  select d.credit_reels into v_funded from public.documents d where d.id = v_doc;
  if v_funded is null or v_index > v_funded then return false; end if;

  select e.subject, e.period_start into r
  from public.credit_events e
  where e.document_id = v_doc and e.kind = 'reserve'
  order by e.created_at desc limit 1;
  if not found then return false; end if; -- planned before credits existed: nothing was charged

  perform pg_advisory_xact_lock(hashtext('unspool.credits:' || r.subject));
  if exists (select 1 from public.credit_events e where e.reel_id = p_reel_id and e.kind = 'refund') then
    return false;
  end if;
  select coalesce(-sum(e.topup_delta) filter (where e.kind = 'reserve'), 0),
         coalesce(sum(e.topup_delta) filter (where e.kind = 'refund'), 0)
    into v_topup_reserved, v_topup_refunded
  from public.credit_events e where e.document_id = v_doc;

  if v_topup_refunded < v_topup_reserved then
    insert into public.credit_events (subject, kind, topup_delta, period_start, document_id, reel_id)
    values (r.subject, 'refund', 1, r.period_start, v_doc, p_reel_id);
  else
    insert into public.credit_events (subject, kind, allowance_delta, period_start, document_id, reel_id)
    values (r.subject, 'refund', 1, r.period_start, v_doc, p_reel_id);
  end if;
  return true;
end;
$$;

revoke execute on function public.credit_balance(text, timestamptz) from public, anon, authenticated;
revoke execute on function public.claim_credits(text, uuid, integer, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.refund_reel_credit(uuid) from public, anon, authenticated;
grant execute on function public.credit_balance(text, timestamptz) to service_role;
grant execute on function public.claim_credits(text, uuid, integer, integer, timestamptz) to service_role;
grant execute on function public.refund_reel_credit(uuid) to service_role;
