-- Networks (salted IP hashes) the verified owner has used: uploads from them skip the per-network free limits,
-- so the owner can test with fresh accounts. Written only by the server for the verified owner (see lib/settings.ts).
alter table public.app_settings add column if not exists owner_ip_hashes text[] not null default '{}';
