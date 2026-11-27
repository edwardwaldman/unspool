-- Free reels reset at 12:00 AM Eastern (America/New_York) instead of a rolling 24 hours, so the "free reels today"
-- countdown to midnight is true.
create or replace function public.free_day_start() returns timestamptz
language sql stable set search_path to '' as $$
  select (date_trunc('day', now() at time zone 'America/New_York')) at time zone 'America/New_York';
$$;

create or replace function public.free_reels_used(p_subject text)
returns integer language sql stable set search_path to '' as $function$
  select (count(*) filter (where e.kind = 'reserve') - count(*) filter (where e.kind = 'refund'))::integer
  from public.credit_events e
  where e.subject = p_subject and e.free and e.created_at >= public.free_day_start();
$function$;

create or replace function public.claim_free_reel(p_subject text, p_document_id uuid, p_daily_limit integer, p_interval_min integer, p_first boolean default false)
returns text language plpgsql set search_path to '' as $function$
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
  where e.subject = p_subject and e.free and e.created_at >= public.free_day_start();
  if v_used >= p_daily_limit then return 'cap'; end if;
  insert into public.credit_events (subject, kind, free, document_id)
  values (p_subject, 'reserve', true, p_document_id);
  update public.documents set credit_reels = v_have + 1, free_unlocked_at = now() where id = p_document_id;
  return 'ok';
end;
$function$;
