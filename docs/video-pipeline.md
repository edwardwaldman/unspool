# Video pipeline (rendered MP4 reels)

Every reel can be rendered as a real 9:16 MP4 (720x1280, 24 fps, H.264 + AAC) instead of being drawn
live by the animated player. The animated player stays as the fallback: if anything in the video path
fails, the reel still ships, just without `videoUrl`.

## Flow

```
upload ─► /api/jobs/process ─► extract text ─► plan (Claude, script model)
                                   │
                                   └─► one /api/jobs/reel invocation per reel (maxDuration 300, nodejs)
                                         1. script        Claude (script model): beats, each with an image_prompt
                                         2. voiceover     TTS per segment (OpenAI gpt-4o-mini-tts by default), word timings
                                         3. images        one per beat: fal.ai FLUX schnell (or Replicate), 720x1280, 4 steps
                                                          no provider / failure -> gradient title card for that beat
                                         4. render        ffmpeg: Ken-Burns per beat, 0.35 s crossfades, ASS captions
                                                          (word-by-word highlight #d3f05a, Archivo ExtraBold), voiceover,
                                                          optional music; CRF 28, preset veryfast, +faststart
                                                          in-function (ffmpeg-static) or POST to RENDER_URL (worker/)
                                         5. upload        private `videos` bucket: {docId}/{reelIndex}/reel-{attempt}.mp4
                                         6. save          reels.video_path + reels.video_meta (timeline), status=ready
```

Code: `src/lib/pipeline.ts` (`generateReel`), `src/lib/video/reel-video.ts` (plan + orchestration),
`src/lib/video/images.ts` (providers), `src/lib/video/render.ts` (ffmpeg), `src/lib/video/captions.ts`
(ASS), `worker/` (standalone renderer).

The reel is marked ready only after the video step, so a viewer never sees a reel switch from the
animated player to the video mid-play. The video step has a time budget inside the job's 300 s limit;
if it runs out, the reel is saved without video.

### Serving and playback

- `src/lib/spool.ts` signs a `videoUrl` (6 h, same as audio) only for playable reels (unlocked, or free
  under the drip). Locked reels never get one. It also sends `video` (the timeline).
- `ReelMedia` renders a `<video>`; `usePlayback` drives it: the clock is `video.currentTime`, segments are
  located on the timeline, the quiz holds the video paused at the end of the question and seeks to the
  explanation when answered (or after the 7 s wait). Mute/speed apply to the video.
- The caption overlay is hidden when the video has burned-in captions. The quiz card, headline, stat line,
  action rail and title block are still drawn by the app on top of the video.
- During the quiz the video shows a plain card (the app's quiz card covers it), and captions are not burned
  into quiz segments. The outro is a title card ("Next: …").

### Storage and schema

Migration `supabase/migrations/20261018120000_reel_video.sql` (additive): `reels.video_path text`,
`reels.video_meta jsonb`, and the private `videos` bucket (50 MB limit, `video/mp4` only). Deleting a
document (and the daily cleanup cron) removes its videos too.

## Environment variables

| Variable | Default | What it does |
| --- | --- | --- |
| `VIDEO_RENDER` | on when `FAL_KEY`, `REPLICATE_API_TOKEN` or `RENDER_URL` is set, else off | `on` / `off`. `off` keeps today's animated player for new reels. `on` without an image key renders with gradient title cards. |
| `FAL_KEY` | – | fal.ai key; enables FLUX schnell images (`https://fal.run/fal-ai/flux/schnell`). |
| `IMAGE_PROVIDER` | auto | `fal`, `replicate` or `none` (force title cards). |
| `REPLICATE_API_TOKEN` | – | Alternative image provider (black-forest-labs/flux-schnell). |
| `ANTHROPIC_SCRIPT_MODEL` | `claude-haiku-5-5` | Model for the plan + per-reel scripts. |
| `ANTHROPIC_SCRIPT_EFFORT` | `low` | Effort for the script model. |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | OCR of scanned files, and the retry model when the script model declines a document (Haiku has no server-side refusal fallback). |
| `RENDER_URL` | – | If set, the job POSTs the render job here (see `worker/README.md`) instead of running ffmpeg in the function. |
| `RENDER_SECRET` | – | Bearer token sent to `RENDER_URL`; must match the worker's. |
| `MUSIC_URL` | – | Optional background music (any ffmpeg-readable audio URL), looped under the voice. |
| `MUSIC_VOLUME` | `0.08` | Music gain relative to the voice. |
| `FFMPEG_PATH` / `VIDEO_FONTS_DIR` | ffmpeg-static / `./assets/fonts` | Overrides for the renderer. |

TTS is unchanged (`OPENAI_API_KEY`, optional `ELEVENLABS_API_KEY`). A reel is only rendered when every
segment has real TTS audio; without TTS the animated player (device voice) is used.

### Deployment notes

- `next.config.ts` keeps `ffmpeg-static` external and traces its binary plus `assets/fonts` into the
  `/api/jobs/reel` function (`outputFileTracingIncludes`). The static ffmpeg binary is about 80 MB
  uncompressed, within Vercel's function size limit but worth knowing.
- If the job dispatch falls back to running inline in another route, that route has no ffmpeg; the
  render fails and the reel keeps the animated player.
- Render time measured in the dev container (4 cores): a 42.6 s reel in 12.6 s, an 18 s test in 3.6 s.
  Vercel's CPU allocation differs, so check real job durations in the function logs after enabling.

## Estimated cost per reel

**These are estimates**, built from list prices as published by each provider at the time of writing
and from assumed sizes. Check current pricing before relying on them. A typical reel: ~8 beats,
~45 s of speech, ~3k output tokens of script.

| Step | Formula | Estimate |
| --- | --- | --- |
| Script (Claude Haiku 5.5: $0.10 / MTok input, $0.50 / MTok output for prompts up to 100k tokens; cache reads 0.1x input) | `prompt_tokens x $0.10/M + doc_tokens x $0.01/M (cache read) + output_tokens x $0.50/M` | 2.5k prompt + 20k cached doc + 3k output ≈ **$0.002** |
| Plan (once per document, shared across its reels) | `doc_tokens x $0.125/M (cache write) + output x $0.50/M` | 20k doc, 1.5k output ≈ $0.003 per document |
| Voiceover (OpenAI gpt-4o-mini-tts) | `minutes_of_speech x [TTS $/min]` | OpenAI's published estimate is about $0.015/min, so ≈ **$0.011** for 45 s. **Verify against current OpenAI pricing.** |
| Images (fal FLUX schnell) | `beats x megapixels x [fal $/MP]` | 8 x 0.92 MP x $0.003/MP ≈ **$0.022**. **Verify the fal price**; Replicate lists flux-schnell per image (`beats x [$/image]`). |
| Render (Vercel function) | `render_seconds x vCPU x [Vercel $/CPU-hour] / 3600 + memory GB-hours x [$/GB-hour]` | **[placeholder: fill in from your Vercel plan's Fluid Compute rates]** |
| Storage (Supabase) | `MB_per_reel x [$/GB-month] / 1024` | ~1–4 MB per reel at CRF 28 (1.05 MB measured for a 42.6 s test reel with flat images; detailed images compress worse) |
| Delivery (Supabase egress) | `MB_per_view x views x [$/GB egress] / 1024` | **[placeholder: depends on your plan's included egress]** |

Rough total, excluding render compute, storage and egress: **about $0.035 per reel** (≈ $0.04 with the
amortized plan call), dominated by images and TTS. Levers: `IMAGE_PROVIDER=none` (title cards, $0
images), fewer beats per reel, or `VIDEO_RENDER=off`.
