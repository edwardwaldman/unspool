-- Calls public.sync_profile_email() (20261019170000) when an account's email changes.
-- NOT YET APPLIED to the live project: creating a trigger on auth.users timed out through the Supabase MCP.
-- Apply it from the SQL editor (or `supabase db push`) when auth.users is quiet.
set lock_timeout = '10s';
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();
