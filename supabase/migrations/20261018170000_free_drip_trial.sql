-- Free tier = on-demand drip (reel 1 up front, then one more every 30 minutes, max 5 free reels/day per
-- account or IP), plus a one-per-account 1-day Plus trial. Additive only: no drops.

alter table public.profiles add column if not exists trial_used boolean not null default false;
alter table public.documents add column if not exists free_unlocked_at timestamptz;
alter table public.credit_events add column if not exists free boolean not null default false;
create index if not exists credit_events_free_idx on public.credit_events (subject, created_at desc) where free;

/**
 * Unlock (and pay for, from the free daily allowance) the next reel of a free document.
 * Returns 'ok', 'wait' (the 30-minute timer since the last free reel hasn't run out), 'cap' (the subject
 * already has p_daily_limit free reels in the last 24h) or 'done' (every reel is already unlocked).
 * p_first: reel 1 at plan time, which skips the timer. Serialized per subject; the document row is locked.
 */
create or replace function public.claim_free_reel(
  p_subject text,
  p_document_id uuid,
  p_daily_limit integer,
  p_interval_min integer,
  p_first boolean default false
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_have integer;
  v_last timestamptz;
  v_used integer;
begin
  perform pg_advisory_xact_lock(hashtext('unspool.credits:' || p_subject));
  select d.reel_count, coalesce(d.credit_reels, 0), d.free_unlocked_at into v_total, v_have, v_last
  from public.documents d where d.id = p_document_id for update;
  if not found then return 'done'; end if;
  if v_total is not null and v_have >= v_total then return 'done'; end if;
  if p_first and v_have > 0 then return 'done'; end if;
  if not p_first and v_last is not null and v_last + make_interval(mins => p_interval_min) > now() then
    return 'wait';
  end if;
  select count(*) filter (where e.kind = 'reserve') - count(*) filter (where e.kind = 'refund') into v_used
  from public.credit_events e
  where e.subject = p_subject and e.free and e.created_at > now() - interval '24 hours';
  if v_used >= p_daily_limit then return 'cap'; end if;
  insert into public.credit_events (subject, kind, free, document_id)
  values (p_subject, 'reserve', true, p_document_id);
  update public.documents set credit_reels = v_have + 1, free_unlocked_at = now() where id = p_document_id;
  return 'ok';
end;
$$;

/** Free reels used by a subject in the last 24 hours. */
create or replace function public.free_reels_used(p_subject text)
returns integer
language sql stable
set search_path = ''
as $$
  select (count(*) filter (where e.kind = 'reserve') - count(*) filter (where e.kind = 'refund'))::integer
  from public.credit_events e
  where e.subject = p_subject and e.free and e.created_at > now() - interval '24 hours';
$$;

-- Refunds now also return free reels (to the daily allowance) when a free reel failed for good.
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
  v_free_reserved integer;
  v_free_refunded integer;
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
         coalesce(sum(e.topup_delta) filter (where e.kind = 'refund'), 0),
         count(*) filter (where e.kind = 'reserve' and e.free),
         count(*) filter (where e.kind = 'refund' and e.free)
    into v_topup_reserved, v_topup_refunded, v_free_reserved, v_free_refunded
  from public.credit_events e where e.document_id = v_doc;

  if v_topup_refunded < v_topup_reserved then
    insert into public.credit_events (subject, kind, topup_delta, period_start, document_id, reel_id)
    values (r.subject, 'refund', 1, r.period_start, v_doc, p_reel_id);
  elsif v_free_refunded < v_free_reserved then
    insert into public.credit_events (subject, kind, free, document_id, reel_id)
    values (r.subject, 'refund', true, v_doc, p_reel_id);
  else
    insert into public.credit_events (subject, kind, allowance_delta, period_start, document_id, reel_id)
    values (r.subject, 'refund', 1, r.period_start, v_doc, p_reel_id);
  end if;
  return true;
end;
$$;

revoke execute on function public.claim_free_reel(text, uuid, integer, integer, boolean) from public, anon, authenticated;
revoke execute on function public.free_reels_used(text) from public, anon, authenticated;
revoke execute on function public.refund_reel_credit(uuid) from public, anon, authenticated;
grant execute on function public.claim_free_reel(text, uuid, integer, integer, boolean) to service_role;
grant execute on function public.free_reels_used(text) to service_role;
grant execute on function public.refund_reel_credit(uuid) to service_role;
