-- Site-wide switches the owner flips from the owner panel. One row only (id = true).
-- open_access: when on, the one-free-document limit is not enforced for anyone. Daily upload caps still apply.
create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  open_access boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;

-- Server-only, like the other tables.
alter table public.app_settings enable row level security;
revoke all on table public.app_settings from anon, authenticated;
grant select, insert, update on table public.app_settings to service_role;
