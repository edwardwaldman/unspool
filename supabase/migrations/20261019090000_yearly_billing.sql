-- Yearly plans: paid once a year, credits still reset weekly from the period start.
alter table public.profiles add column if not exists billing_interval text not null default 'week'
  check (billing_interval in ('week', 'year'));
