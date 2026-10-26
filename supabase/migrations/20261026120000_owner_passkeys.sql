-- Face ID (WebAuthn passkeys) for the owner panel: public keys only; read and written by the server alone.
create table if not exists public.owner_passkeys (
  id text primary key,
  email text not null,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.owner_passkeys enable row level security;
revoke all on table public.owner_passkeys from anon, authenticated;
grant select, insert, update, delete on table public.owner_passkeys to service_role;
