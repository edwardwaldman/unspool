-- Public share links for single reels. Additive only (no drops).
-- Server-only like every other table: RLS on, no privileges for anon/authenticated; the app reads and
-- writes through server routes with the service role.
create table if not exists public.reel_shares (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{8,16}$'),
  reel_id uuid not null references public.reels(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  show_title boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  view_count integer not null default 0
);

create index if not exists reel_shares_reel_idx on public.reel_shares (reel_id, user_id) where revoked_at is null;
create index if not exists reel_shares_user_idx on public.reel_shares (user_id, created_at desc);

alter table public.reel_shares enable row level security;
revoke all on table public.reel_shares from anon, authenticated;
grant select, insert, update, delete on table public.reel_shares to service_role;

/** Best-effort view counter for a public share page (service role only). */
create or replace function public.increment_share_view(p_id text)
returns void
language sql
set search_path = ''
as $$
  update public.reel_shares set view_count = view_count + 1 where id = p_id and revoked_at is null;
$$;
revoke all on function public.increment_share_view(text) from public, anon, authenticated;
grant execute on function public.increment_share_view(text) to service_role;

-- Attribution: which share link brought this account in (first touch, set once by /api/auth/claim).
alter table public.profiles add column if not exists referred_by_share text;
