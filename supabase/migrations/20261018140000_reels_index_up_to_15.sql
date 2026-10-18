-- Plans may now have up to MAX_REELS (15) reels; the original check stopped at 10.
alter table public.reels drop constraint if exists reels_index_check;
alter table public.reels add constraint reels_index_check check (index between 1 and 15);
