-- Plans granted from the owner panel without payment.
alter table public.profiles add column if not exists comp_tier text check (comp_tier in ('plus','pro','ultra'));
