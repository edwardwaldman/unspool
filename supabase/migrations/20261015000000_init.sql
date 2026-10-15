-- Unspool initial schema: profiles, documents ("spools"), reels, purchases + private storage buckets.
-- All app reads/writes go through server routes using the service role; RLS is enabled on every
-- table with owner-only SELECT policies as defense in depth.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'sub')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- documents (a "spool": one uploaded document -> 10 reels)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anon_token text,
  ip_hash text,
  file_name text not null,
  file_path text,
  file_type text,
  file_size integer,
  page_count integer,
  word_count integer,
  truncated boolean not null default false,
  title text,
  doc_type text check (doc_type in ('study', 'work', 'other')),
  sensitive boolean not null default false,
  status text not null default 'uploading'
    check (status in ('uploading', 'uploaded', 'extracting', 'planning', 'scripting', 'ready', 'failed')),
  error text,
  unlocked boolean not null default false,
  extracted_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_created_idx on public.documents (user_id, created_at desc);
create index if not exists documents_anon_token_idx on public.documents (anon_token) where user_id is null;
create index if not exists documents_ip_hash_created_idx on public.documents (ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- reels (10 per document)
-- ---------------------------------------------------------------------------
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  index integer not null check (index between 1 and 10),
  title text not null,
  hook text not null,
  section text,
  script_json jsonb,
  audio_paths jsonb,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed')),
  error text,
  attempts integer not null default 0,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, index)
);

create index if not exists reels_document_id_idx on public.reels (document_id, index);

-- ---------------------------------------------------------------------------
-- purchases
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  document_id uuid references public.documents (id) on delete set null,
  kind text not null check (kind in ('document', 'subscription')),
  stripe_session_id text not null unique,
  amount integer,
  currency text,
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();
drop trigger if exists reels_touch on public.reels;
create trigger reels_touch before update on public.reels
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security (owner-only reads; writes happen server-side via service role)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.reels enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "profiles: owner can read" on public.profiles;
create policy "profiles: owner can read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "documents: owner can read" on public.documents;
create policy "documents: owner can read" on public.documents
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "reels: owner can read" on public.reels;
create policy "reels: owner can read" on public.reels
  for select to authenticated using (
    exists (
      select 1 from public.documents d
      where d.id = reels.document_id and d.user_id = (select auth.uid())
    )
  );

drop policy if exists "purchases: owner can read" on public.purchases;
create policy "purchases: owner can read" on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Private storage buckets (uploads and generated voiceover audio)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('documents', 'documents', false, 26214400),
  ('audio', 'audio', false, 10485760)
on conflict (id) do nothing;
