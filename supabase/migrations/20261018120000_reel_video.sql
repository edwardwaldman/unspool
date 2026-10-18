-- Rendered reel videos (MP4 per reel). Additive only: no drops.
-- video_path: object path in the private `videos` bucket (null = the reel plays as the animated player).
-- video_meta: the timeline the player follows (segment start/duration in the video, captions burned in).
alter table public.reels add column if not exists video_path text;
alter table public.reels add column if not exists video_meta jsonb;

-- Private bucket; the app serves videos through short-lived signed URLs, like the voiceover audio.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 52428800, array['video/mp4'])
on conflict (id) do nothing;
