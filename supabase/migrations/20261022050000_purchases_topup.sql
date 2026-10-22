-- Top-up packs are purchases too: record them alongside subscriptions so every account's buys are on file.
alter table public.purchases drop constraint if exists purchases_kind_check;
alter table public.purchases add constraint purchases_kind_check check (kind in ('document', 'subscription', 'topup'));
