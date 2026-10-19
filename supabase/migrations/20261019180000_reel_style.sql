-- Pro/Ultra "Reel style": how every reel of this account looks (captions, font, accent, layout, theme).
-- Written only by /api/studio/style (service role) after an allowlist check; null = the default look.
alter table public.profiles add column if not exists reel_style jsonb;
