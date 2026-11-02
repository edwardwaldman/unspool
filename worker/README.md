# Unspool render worker

Two jobs, one service:

- **`POST /record`: reel downloads.** An exact copy of a reel as it plays in the app (3D scenes, captions,
  quiz, voiceover and music) as a 1080×1920 MP4. Powers the **Download video** button.
- **`POST /render`:** the older ffmpeg slideshow renderer (below).

## Reel downloads (`/record`)

The app queues a recording when someone taps **Download video** (`src/lib/reel-download.ts`). The worker
opens the app's signed `/record/<reelId>?token=…` page in headless Chromium, advances the page on a
virtual clock one frame (1/30 s) at a time and screenshots each frame, then mixes the reel's own voiceover
clips (placed where the page says each line started) with the music bed, encodes H.264/AAC, uploads the
file to a signed Supabase Storage URL and calls the app back. It takes roughly 0.3–0.5 s per frame on 4 CPU
cores (a 45 s reel: about 7–11 minutes), so it runs in the background and the button polls.

```
POST /record
Authorization: Bearer $RENDER_SECRET
{ "url": "https://unspool.cc/record/<reel>?token=…", "upload": "<signed upload URL>", "done": "https://unspool.cc/api/reels/<reel>/download/done?token=…", "music": "https://unspool.cc/music/bed.mp3" }
```

`202` accepted · `400` invalid job (the page and callback must be on `APP_ORIGINS`) · `401` · `429` busy.

### Deploy (once)

1. Create a **Web Service** from this repo on Render (or Fly, Railway): Docker, Dockerfile path
   `worker/Dockerfile`, build context the repo root. 2 GB RAM and 2+ CPUs (more CPUs = faster downloads).
2. Worker env: `RENDER_SECRET` (any long random string), optionally `APP_ORIGINS`
   (default `https://unspool.cc,https://www.unspool.cc`), `MAX_RECORDINGS` (default 1).
3. Vercel env for the app: `RECORDER_URL=https://<your-worker>/record` and the same `RENDER_SECRET`.
   Redeploy. The **Download video** button then works; without these it says downloads aren't switched on.

A standalone HTTP service that renders a reel's MP4 with ffmpeg. It runs the same renderer the app uses
in-function (`src/lib/video/render.ts`), so a render looks identical wherever it runs. Use it when
rendering inside the Vercel function is too slow or hits the 300 s limit: set `RENDER_URL` in the app
and the per-reel job POSTs the render job here instead of running ffmpeg itself.

## API

```
POST /render
Authorization: Bearer $RENDER_SECRET
Content-Type: application/json

{ "job": RenderJob }        # see src/lib/video/types.ts
```

- `200 video/mp4`: the MP4 bytes (the app uploads them to the private `videos` bucket).
- `400` invalid job, `401` wrong secret, `429` already rendering `MAX_CONCURRENT` jobs, `500` ffmpeg failed (message in the body).

`GET /healthz` returns `ok`.

Every image and audio source in the job is a URL: image URLs come from the image provider (fal / Replicate),
and voiceover clips are short-lived signed Supabase Storage URLs.

## Run

Build from the repository root, because the worker bundles `src/lib/video`:

```sh
docker build -f worker/Dockerfile -t unspool-render .
docker run -p 8080:8080 -e RENDER_SECRET=change-me unspool-render
```

Then point the app at it (Vercel project env):

```
RENDER_URL=https://your-worker.example.com/render
RENDER_SECRET=change-me
```

Without Docker (needs ffmpeg with libass on PATH or `FFMPEG_PATH`):

```sh
cd worker && npm install && npm run build
RENDER_SECRET=change-me FFMPEG_PATH=$(which ffmpeg) VIDEO_FONTS_DIR=../assets/fonts npm start
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `RENDER_SECRET` | required | Bearer token the app sends. The worker refuses to start without it (`ALLOW_NO_SECRET=1` for local tests only), because jobs make it download URLs. |
| `PORT` | `8080` | Listen port. |
| `MAX_CONCURRENT` | `1` | Renders at once; extra requests get `429`. ffmpeg uses every core, so keep this at 1 per CPU-sized box. |
| `RENDER_TIMEOUT_MS` | `280000` | Kill ffmpeg after this long. |
| `FFMPEG_PATH` | `/usr/bin/ffmpeg` in the image | ffmpeg binary. |
| `VIDEO_FONTS_DIR` | `/app/assets/fonts` in the image | Caption font directory (Archivo, SIL OFL, see `assets/fonts/OFL.txt`). |

The app waits for the response inside its own 300 s function, so the worker must finish well within that.
Any worker error makes the reel fall back to the animated in-app player; the reel itself never fails.
