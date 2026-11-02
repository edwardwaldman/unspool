// Records a reel exactly as it plays in the app: opens the app's signed /record page in headless Chromium with a
// virtual clock, steps it one frame at a time, screenshots every frame, then lays the reel's own voiceover clips
// (at the moments the page says each segment started) and the music bed under the frames and encodes an MP4.

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";

export type RecordJob = {
  /** The app's /record/<reel>?token=… page. */
  url: string;
  /** A signed Supabase Storage upload URL for the finished MP4. */
  upload: string;
  /** Called with {ok} / {ok:false, error} when finished. */
  done: string;
  /** The music bed (played under the voiceover at the app's level). */
  music?: string;
};

const FPS = Number(process.env.RECORD_FPS ?? 30);

/**
 * A virtual clock for the page's own code only (performance.now, Date.now, requestAnimationFrame), advanced by
 * the recorder one frame at a time. It runs in the page's main world, so Playwright's own frame waits (in its
 * isolated world) keep the real clock and screenshots stay fast.
 */
const VIRTUAL_CLOCK = `(() => {
  let now = 0, id = 0;
  const cbs = new Map();
  const epoch = Date.now();
  performance.now = () => now;
  Date.now = () => epoch + now;
  window.requestAnimationFrame = (cb) => { cbs.set(++id, cb); return id; };
  window.cancelAnimationFrame = (i) => { cbs.delete(i); };
  window.__advance = (ms) => {
    const target = now + ms;
    while (now < target - 1e-6) {
      now = Math.min(target, now + 1000 / 60);
      const list = [...cbs.values()];
      cbs.clear();
      for (const cb of list) { try { cb(now); } catch (e) { console.error(e); } }
    }
  };
})();`;
const MAX_SECONDS = 240;
const MUSIC_LEVEL = 0.1;

function run(bin: string, args: string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d: Buffer) => (err = (err + d.toString()).slice(-4000)));
    const t = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.on("close", (code) => {
      clearTimeout(t);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${err}`));
    });
  });
}

async function fetchTo(url: string, file: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

/** Record one reel to an MP4 file and return its bytes. */
export async function recordReel(job: RecordJob, ffmpeg: string): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "unspool-rec-"));
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-dev-shm-usage"],
  });
  try {
    // 540x960 CSS pixels (a phone's layout) captured at 1.5x (810x1440, a third faster than 2x), scaled to 1080x1920.
    const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1.5 });
    const page = await ctx.newPage();
    await page.addInitScript(VIRTUAL_CLOCK);
    // Advance the page's clock, then let React and the browser flush (a real task turn) before the next step.
    const tick = async (ms: number) => {
      await page.evaluate((m) => window.__advance!(m), ms);
      await page.evaluate(() => new Promise((r) => setTimeout(r, 0)));
    };
    await page.goto(job.url, { waitUntil: "load", timeout: 90_000 });
    // Let the page boot on the virtual clock (hydration, the 3D chunk, fonts).
    for (let i = 0; i < 600; i++) {
      await tick(50);
      if (await page.evaluate(() => window.__recordReady === true && typeof window.__recordGo === "function")) break;
      await new Promise((r) => setTimeout(r, 20));
    }
    if (!(await page.evaluate(() => window.__recordReady === true))) throw new Error("record page never got ready");
    // Give the 3D scene's code and textures a real moment to load before the first frame.
    await page.waitForTimeout(1500);

    const start = await page.evaluate(() => {
      window.__recordGo!();
      return performance.now();
    });
    const step = 1000 / FPS;
    let frames = 0, doneAt = -1;
    while (frames < MAX_SECONDS * FPS) {
      await tick(step);
      await page.screenshot({ path: path.join(dir, `f${String(frames).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 });
      frames++;
      if (doneAt < 0 && frames % 10 === 0 && (await page.evaluate(() => window.__reelDone === true))) doneAt = frames;
      // A beat of the last frame after it ends.
      if (doneAt >= 0 && frames >= doneAt + FPS) break;
    }
    const marks = await page.evaluate(() => window.__reelMarks ?? []);
    const audio = await page.evaluate(() => window.__reelAudio ?? {});
    await browser.close();

    // The voiceover: each segment's clip, delayed to when that segment started on screen.
    const duration = frames / FPS;
    const inputs: string[] = [], filters: string[] = [], labels: string[] = [];
    let n = 1;
    for (const m of marks) {
      const url = audio[m.key]?.url;
      if (!url) continue;
      const file = path.join(dir, `a${n}.mp3`);
      await fetchTo(new URL(url, job.url).href, file);
      inputs.push("-i", file);
      const delay = Math.max(0, Math.round(m.at - start - step));
      filters.push(`[${n}:a]adelay=${delay}|${delay}[v${n}]`);
      labels.push(`[v${n}]`);
      n++;
    }
    if (job.music) {
      const file = path.join(dir, "music.mp3");
      try {
        await fetchTo(job.music, file);
        inputs.push("-stream_loop", "-1", "-i", file);
        filters.push(`[${n}:a]volume=${MUSIC_LEVEL},afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, duration - 1.2).toFixed(2)}:d=1.2[m]`);
        labels.push("[m]");
        n++;
      } catch {
        /* no music bed: the voiceover alone */
      }
    }
    const out = path.join(dir, "reel.mp4");
    const audioArgs = labels.length
      ? ["-filter_complex", `${filters.join(";")};${labels.join("")}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,apad[aout]`, "-map", "0:v", "-map", "[aout]", "-c:a", "aac", "-b:a", "160k"]
      : ["-map", "0:v"];
    await run(
      ffmpeg,
      ["-y", "-framerate", String(FPS), "-i", path.join(dir, "f%05d.jpg"), ...inputs, ...audioArgs, "-t", duration.toFixed(3), "-vf", "scale=1080:1920:flags=lanczos", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
      10 * 60_000,
    );
    return await readFile(out);
  } finally {
    await browser.close().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
}

/** Upload to a signed Supabase Storage upload URL (the same form the JS client sends). */
export async function uploadSigned(url: string, mp4: Buffer) {
  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", new Blob([new Uint8Array(mp4)], { type: "video/mp4" }));
  const res = await fetch(url, { method: "PUT", body: form, headers: { "x-upsert": "true" }, signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`upload failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

declare global {
  interface Window {
    __recordReady?: boolean;
    __recordGo?: () => void;
    __advance?: (ms: number) => void;
    __reelDone?: boolean;
    __reelMarks?: { seg: number; key: string; at: number }[];
    __reelAudio?: Record<string, { url?: string; duration: number }>;
  }
}
