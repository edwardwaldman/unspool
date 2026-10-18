-- Reel edits: the owner asks for a change ("simpler words", "add an example") and the reel is rewritten.
-- reels.edit_request holds the pending ask while the reel regenerates; reel_edits logs each ask for limits.
alter table public.reels add column if not exists edit_request text;

create table if not exists public.reel_edits (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null,
  request text not null,
  created_at timestamptz not null default now()
);
create index if not exists reel_edits_user_created on public.reel_edits (user_id, created_at desc);
create index if not exists reel_edits_reel on public.reel_edits (reel_id);

-- Server-only, like the other tables.
alter table public.reel_edits enable row level security;
revoke all on public.reel_edits from anon, authenticated;
