# Unspool render worker

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
