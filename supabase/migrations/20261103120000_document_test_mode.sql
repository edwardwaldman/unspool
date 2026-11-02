-- Owner test mode: a document that makes reel 1 only, then one more reel each time the owner asks.
alter table public.documents add column if not exists test_mode boolean not null default false;
