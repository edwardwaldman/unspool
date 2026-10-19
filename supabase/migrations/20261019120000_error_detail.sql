-- Raw pipeline errors for debugging (server-only; never selected for the browser).
alter table public.documents add column if not exists error_detail text;
alter table public.reels add column if not exists error_detail text;
