// Standalone render worker: the same renderer the app runs in-function (src/lib/video/render.ts), behind
// a tiny HTTP API so heavy renders can run on a box with more CPU and no time limit.
//
//   POST /render   Authorization: Bearer $RENDER_SECRET   body: {"job": RenderJob}
//     200 video/mp4 (the MP4 bytes) | 400 bad job | 401 | 429 busy | 500 render failed
//   GET  /healthz  200 "ok"
//
// The app uses it when RENDER_URL is set (e.g. https://render.example.com/render).

import { createHash, timingSafeEqual } from "node:crypto";
import http from "node:http";
import { renderVideo } from "../src/lib/video/render";
import type { RenderJob } from "../src/lib/video/types";

const PORT = Number(process.env.PORT ?? 8080);
const SECRET = process.env.RENDER_SECRET ?? "";
const MAX_CONCURRENT = Math.max(1, Number(process.env.MAX_CONCURRENT ?? 1));
const MAX_BODY = 4 * 1024 * 1024;
const TIMEOUT_MS = Number(process.env.RENDER_TIMEOUT_MS ?? 280_000);

if (!SECRET && process.env.ALLOW_NO_SECRET !== "1") {
  // The job carries URLs the worker downloads; never expose that to anyone without the secret.
  console.error("RENDER_SECRET is required (set ALLOW_NO_SECRET=1 only for local testing).");
  process.exit(1);
}

let busy = 0;

function send(res: http.ServerResponse, status: number, body: string) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function authorized(header: string | undefined) {
  if (!SECRET) return true; // only reachable with ALLOW_NO_SECRET=1 (local testing)
  const a = createHash("sha256").update(header ?? "").digest();
  const b = createHash("sha256").update(`Bearer ${SECRET}`).digest();
  return timingSafeEqual(a, b);
}

/** Remote jobs may only reference http(s) URLs: a local `path` would let the caller read the worker's own files. */
function safeSource(src: unknown) {
  const s = src as { url?: unknown; path?: unknown } | undefined;
  return !!s && s.path === undefined && typeof s.url === "string" && /^https?:\/\//i.test(s.url);
}

const HEX = /^#?[0-9a-f]{6}$/i;

function safeMedia(j: RenderJob) {
  return (
    j.slots.every(
      (s) => (!s.image || safeSource(s.image)) && (!s.card || (HEX.test(String(s.card.from)) && HEX.test(String(s.card.to)))),
    ) &&
    j.audio.every((a) => !a.source || safeSource(a.source)) &&
    (!j.music || safeSource(j.music.source)) &&
    (!j.highlight || HEX.test(String(j.highlight))) &&
    j.captions.every((l) => Array.isArray(l.words) && l.words.every((w) => !w.color || HEX.test(String(w.color))))
  );
}

function isJob(v: unknown): v is RenderJob {
  const j = v as RenderJob;
  return (
    !!j &&
    typeof j.width === "number" &&
    typeof j.height === "number" &&
    typeof j.fps === "number" &&
    j.width > 0 &&
    j.width <= 1920 &&
    j.height > 0 &&
    j.height <= 1920 &&
    j.fps > 0 &&
    j.fps <= 60 &&
    Array.isArray(j.slots) &&
    j.slots.length > 0 &&
    j.slots.length <= 40 &&
    Array.isArray(j.audio) &&
    j.audio.length > 0 &&
    j.audio.length <= 40 &&
    Array.isArray(j.captions)
  );
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://worker");
  if (req.method === "GET" && url.pathname === "/healthz") return send(res, 200, "ok");
  if (req.method !== "POST" || (url.pathname !== "/render" && url.pathname !== "/")) return send(res, 404, "not found");
  if (!authorized(req.headers.authorization)) return send(res, 401, "unauthorized");
  if (busy >= MAX_CONCURRENT) return send(res, 429, "busy");

  busy++;
  const started = Date.now();
  try {
    let job: unknown;
    try {
      job = (JSON.parse(await readBody(req)) as { job?: unknown }).job;
    } catch {
      return send(res, 400, "invalid JSON");
    }
    if (!isJob(job) || !safeMedia(job)) return send(res, 400, "invalid job");
    const total = job.audio.reduce((a, c) => a + (Number(c.duration) || 0), 0);
    if (!(total > 0) || total > 300) return send(res, 400, "video must be 0–300 seconds");

    const { mp4 } = await renderVideo(job, { timeoutMs: TIMEOUT_MS });
    console.log(`[worker] rendered ${total.toFixed(1)}s video, ${mp4.length} bytes in ${Date.now() - started}ms`);
    res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": String(mp4.length) });
    res.end(mp4);
  } catch (err) {
    console.error("[worker] render failed", err);
    if (!res.headersSent) send(res, 500, err instanceof Error ? err.message.slice(0, 2000) : "render failed");
  } finally {
    busy--;
  }
});

server.requestTimeout = TIMEOUT_MS + 30_000;
server.listen(PORT, () => console.log(`[worker] listening on :${PORT}`));
