-- Security audit, 2026-10-19.

-- 1. One free document per account, atomically. The upload route used to check "has this account ever
--    uploaded?" and then claim the daily slot in two steps, so parallel requests from a fresh free account
--    could each pass the first check and get several free documents. Scope 'first_user_or_ip' does both
--    under the same advisory lock: refuse if the account has any upload ever, else apply the daily
--    user-or-IP cap.
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
  perform pg_advisory_xact_lock(hashtext('unspool.claim_usage:' || p_kind));
  if p_scope = 'first_user_or_ip' then
    if p_user_id is null or exists (
      select 1 from public.usage_events e where e.kind = p_kind and e.user_id = p_user_id
    ) then
      return false;
    end if;
  end if;
  select count(*) into used
  from public.usage_events e
  where e.kind = p_kind
    and e.created_at > now() - interval '24 hours'
    and case p_scope
      when 'user' then e.user_id = p_user_id
      when 'user_or_ip' then e.user_id = p_user_id or e.ip_hash = p_ip_hash
      when 'first_user_or_ip' then e.user_id = p_user_id or e.ip_hash = p_ip_hash
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

-- 2. track_visit is SECURITY DEFINER: pin its search_path to '' like every other function (it already
--    schema-qualifies everything it touches).
alter function public.track_visit(uuid, text, uuid, text, text, text, text, text, text, jsonb, bigint, integer)
  set search_path = '';

-- 3. Keep profiles.email equal to the account's confirmed email. It was only written at sign-up, so after
--    an email change it went stale, and background jobs decide the owner bypass from it.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end;
$$;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;

-- The trigger that calls it is in 20261019170100_profile_email_sync_trigger.sql.

-- 4. Fail closed for anything created later: new tables and functions in public are not reachable by the
--    browser roles until a migration grants it on purpose (every table here is server-only today).
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
