-- Reel edits cost one credit (this period's allowance first, then top-ups), refunded if the edit fails.
alter table public.credit_events drop constraint if exists credit_events_kind_check;
alter table public.credit_events add constraint credit_events_kind_check
  check (kind = any (array['reserve', 'refund', 'topup', 'edit', 'edit_refund']));

create or replace function public.claim_edit_credit(p_subject text, p_reel_id uuid, p_document_id uuid, p_allowance integer, p_period_start timestamptz)
returns boolean language plpgsql set search_path to '' as $$
declare
  v_used integer;
  v_topup integer;
begin
  perform pg_advisory_xact_lock(hashtext('unspool.credits:' || p_subject));
  select b.used, b.topup into v_used, v_topup from public.credit_balance(p_subject, p_period_start) b;
  if p_allowance - v_used > 0 then
    insert into public.credit_events (subject, kind, allowance_delta, topup_delta, period_start, document_id, reel_id)
    values (p_subject, 'edit', -1, 0, p_period_start, p_document_id, p_reel_id);
  elsif v_topup > 0 then
    insert into public.credit_events (subject, kind, allowance_delta, topup_delta, period_start, document_id, reel_id)
    values (p_subject, 'edit', 0, -1, p_period_start, p_document_id, p_reel_id);
  else
    return false;
  end if;
  return true;
end;
$$;

-- Give back the credit of a reel's latest unrefunded edit. Idempotent per edit.
create or replace function public.refund_edit_credit(p_reel_id uuid)
returns boolean language plpgsql set search_path to '' as $$
declare
  r record;
  v_edits integer;
  v_refunds integer;
begin
  select e.* into r from public.credit_events e where e.reel_id = p_reel_id and e.kind = 'edit' order by e.created_at desc limit 1;
  if not found then return false; end if;
  perform pg_advisory_xact_lock(hashtext('unspool.credits:' || r.subject));
  select count(*) filter (where e.kind = 'edit'), count(*) filter (where e.kind = 'edit_refund')
    into v_edits, v_refunds from public.credit_events e where e.reel_id = p_reel_id;
  if v_refunds >= v_edits then return false; end if;
  insert into public.credit_events (subject, kind, allowance_delta, topup_delta, period_start, document_id, reel_id)
  values (r.subject, 'edit_refund', -r.allowance_delta, -r.topup_delta, r.period_start, r.document_id, p_reel_id);
  return true;
end;
$$;

revoke all on function public.claim_edit_credit(text, uuid, uuid, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.refund_edit_credit(uuid) from public, anon, authenticated;
