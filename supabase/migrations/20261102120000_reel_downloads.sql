-- Downloadable reels: an MP4 recording of the reel as it plays in the app, made on request by the recorder.
alter table public.reels
  add column if not exists download_path text,
  add column if not exists download_status text check (download_status in ('rendering', 'ready', 'failed')),
  add column if not exists download_error text,
  add column if not exists download_requested_at timestamptz;
