import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildAss } from "./captions";
import type { MediaSource, Motion, RenderJob, RenderSlot } from "./types";

// Renders a reel to MP4 with ffmpeg: one Ken-Burns zoom/pan clip per slot (or a gradient title card),
// crossfades between slots, burned-in ASS captions, the voiceover (clips padded/trimmed to their exact
// slot so the video clock matches the timeline the player uses), optional low background music.
// H.264 + AAC, faststart. Self-contained (node builtins only) so the standalone worker can bundle it.

export type RenderOptions = {
  /** ffmpeg binary. Defaults to FFMPEG_PATH, then the ffmpeg-static binary in node_modules, then `ffmpeg` on PATH. */
  ffmpegPath?: string;
  /** Directory holding the caption font. Defaults to VIDEO_FONTS_DIR, then ./assets/fonts. */
  fontsDir?: string;
  /** Kill ffmpeg after this long. */
  timeoutMs?: number;
  /** Also keep the MP4 at this path (otherwise only the returned buffer survives). */
  outputPath?: string;
  /** Leave the temp directory in place (debugging). */
  keepWorkDir?: boolean;
  signal?: AbortSignal;
};

export type RenderResult = { mp4: Buffer; duration: number; elapsedMs: number };

export class RenderError extends Error {}

async function exists(p: string) {
  try {
    await access(/*turbopackIgnore: true*/ p);
    return true;
  } catch {
    return false;
  }
}

export async function resolveFfmpeg(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  // The ffmpeg-static binary, by path rather than import: only the per-reel job route ships it
  // (next.config outputFileTracingIncludes), so other routes that import this module stay small.
  const bundled = path.join(/*turbopackIgnore: true*/ process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (await exists(bundled)) return bundled;
  return "ffmpeg";
}

function fontsDirFor(explicit?: string) {
  return explicit ?? process.env.VIDEO_FONTS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "assets", "fonts");
}

async function materialize(src: MediaSource, dir: string, name: string, signal?: AbortSignal): Promise<string> {
  if ("path" in src) return src.path;
  const res = await fetch(src.url, { signal: signal ?? AbortSignal.timeout(60_000) });
  if (!res.ok) throw new RenderError(`download failed (${res.status}) for ${name}`);
  const file = path.join(dir, name);
  await writeFile(/*turbopackIgnore: true*/ file, Buffer.from(await res.arrayBuffer()));
  return file;
}

const hex = (c: string) => `0x${c.replace(/^#/, "").slice(0, 6).padEnd(6, "0")}`;
const n3 = (x: number) => Number(x.toFixed(3));

/** zoompan expressions for one motion; `f` = frames in the clip. Zoom tops out at 1.12. */
function motionExpr(motion: Motion, f: number) {
  const p = `(on/${Math.max(1, f - 1)})`;
  const cx = "iw/2-(iw/zoom/2)";
  const cy = "ih/2-(ih/zoom/2)";
  switch (motion) {
    case "in":
      return { z: `1+0.12*${p}`, x: cx, y: cy };
    case "out":
      return { z: `1.12-0.12*${p}`, x: cx, y: cy };
    case "left":
      return { z: "1.12", x: `(iw-iw/zoom)*(1-${p})`, y: cy };
    case "right":
      return { z: "1.12", x: `(iw-iw/zoom)*${p}`, y: cy };
    case "up":
      return { z: "1.12", x: cx, y: `(ih-ih/zoom)*(1-${p})` };
  }
}

const MOTIONS: Motion[] = ["in", "left", "out", "right", "up"];

function validate(job: RenderJob) {
  if (!job.slots.length) throw new RenderError("job has no slots");
  if (!job.audio.length) throw new RenderError("job has no audio");
  for (const s of job.slots) if (!(s.duration > 0)) throw new RenderError("slot with non-positive duration");
  for (const a of job.audio) if (!(a.duration > 0)) throw new RenderError("audio clip with non-positive duration");
}

/** Build the ffmpeg argument list + filter graph. Exported for tests. */
export function buildGraph(
  job: RenderJob,
  files: { slotImages: (string | null)[]; audio: (string | null)[]; music: string | null; ass: string; fontsDir: string },
) {
  const { width: W, height: H, fps } = job;
  const total = job.audio.reduce((a, c) => a + c.duration, 0);
  const minSlot = Math.min(...job.slots.map((s) => s.duration));
  const F = Math.max(0, Math.min(job.fade ?? 0.35, minSlot / 2, 1));
  const args: string[] = [];
  const graph: string[] = [];
  let input = 0;

  // Video: one stream per slot. Every slot but the last runs F longer so the crossfade into the next
  // slot starts exactly at that slot's start time (xfade offset = slot start), keeping sync with audio.
  const labels: string[] = [];
  job.slots.forEach((slot: RenderSlot, i) => {
    const len = slot.duration + (i < job.slots.length - 1 ? F : 0);
    const frames = Math.max(1, Math.round(len * fps));
    const img = files.slotImages[i];
    const out = `v${i}`;
    if (img) {
      args.push("-i", img);
      const m = motionExpr(slot.motion ?? MOTIONS[i % MOTIONS.length], frames);
      // Upscale 2x before zoompan so its integer crop steps don't jitter at output size.
      graph.push(
        `[${input}:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},setsar=1,` +
          `zoompan=z='${m.z}':x='${m.x}':y='${m.y}':d=${frames}:s=${W}x${H}:fps=${fps},` +
          `trim=end_frame=${frames},setpts=PTS-STARTPTS,fps=${fps},format=yuv420p,setsar=1[${out}]`,
      );
      input++;
    } else {
      const card = slot.card ?? { from: "#0b2a20", to: "#1d5c45" };
      graph.push(
        `gradients=s=${W}x${H}:c0=${hex(card.from)}:c1=${hex(card.to)}:x0=0:y0=0:x1=${W}:y1=${H}:nb_colors=2:speed=0.004:r=${fps}:d=${n3(len)},` +
          `trim=end_frame=${frames},setpts=PTS-STARTPTS,fps=${fps},format=yuv420p,setsar=1[${out}]`,
      );
    }
    labels.push(out);
  });

  let video = labels[0];
  for (let i = 1; i < labels.length; i++) {
    const out = `x${i}`;
    if (F > 0) graph.push(`[${video}][${labels[i]}]xfade=transition=fade:duration=${n3(F)}:offset=${n3(job.slots[i].start)}[${out}]`);
    else graph.push(`[${video}][${labels[i]}]concat=n=2:v=1:a=0[${out}]`);
    video = out;
  }
  const q = (p: string) => `'${p.replace(/'/g, "'\\''")}'`;
  graph.push(`[${video}]ass=filename=${q(files.ass)}:fontsdir=${q(files.fontsDir)},format=yuv420p[vout]`);

  // Audio: each clip forced to exactly its slot length, then concatenated.
  const aLabels: string[] = [];
  job.audio.forEach((clip, i) => {
    const file = files.audio[i];
    const D = n3(clip.duration);
    const out = `a${i}`;
    if (file) {
      args.push("-i", file);
      graph.push(
        `[${input}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_dur=${D},atrim=0:${D},asetpts=PTS-STARTPTS[${out}]`,
      );
      input++;
    } else {
      graph.push(`anullsrc=r=48000:cl=stereo,atrim=0:${D},asetpts=PTS-STARTPTS[${out}]`);
    }
    aLabels.push(out);
  });
  graph.push(`${aLabels.map((l) => `[${l}]`).join("")}concat=n=${aLabels.length}:v=0:a=1[voice]`);

  let audioOut = "voice";
  if (files.music) {
    args.push("-stream_loop", "-1", "-i", files.music);
    const vol = job.music?.volume ?? 0.08;
    const fadeAt = Math.max(0, total - 1.5);
    graph.push(
      `[${input}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=0:${n3(total)},asetpts=PTS-STARTPTS,volume=${vol},afade=t=in:d=0.8,afade=t=out:st=${n3(fadeAt)}:d=1.5[music]`,
    );
    graph.push(`[voice][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`);
    audioOut = "aout";
    input++;
  }

  const encode = [
    "-map", "[vout]",
    "-map", `[${audioOut}]`,
    "-c:v", "libx264",
    "-preset", job.preset ?? "veryfast",
    "-crf", String(job.crf ?? 28),
    "-pix_fmt", "yuv420p",
    "-r", String(fps),
    "-c:a", "aac",
    "-b:a", "96k",
    "-ar", "48000",
    "-movflags", "+faststart",
    "-t", String(n3(total)),
  ];
  return { inputArgs: args, graph: graph.join(";\n"), encodeArgs: encode, total };
}

function run(bin: string, args: string[], env: NodeJS.ProcessEnv, timeoutMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, { env, stdio: ["ignore", "ignore", "pipe"] });
    let tail = "";
    child.stderr.on("data", (d: Buffer) => {
      tail = (tail + d.toString()).slice(-6000);
    });
    const kill = () => child.kill("SIGKILL");
    const timer = setTimeout(kill, timeoutMs);
    signal?.addEventListener("abort", kill, { once: true });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new RenderError(`could not start ffmpeg (${bin}): ${err.message}`));
    });
    child.on("close", (code, sig) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", kill);
      if (code === 0) resolve();
      else reject(new RenderError(`ffmpeg failed (${sig ?? code}): ${tail.slice(-1500)}`));
    });
  });
}

export async function renderVideo(job: RenderJob, opts: RenderOptions = {}): Promise<RenderResult> {
  validate(job);
  const started = Date.now();
  const bin = await resolveFfmpeg(opts.ffmpegPath);
  const fontsDir = fontsDirFor(opts.fontsDir);
  const work = await mkdtemp(path.join(tmpdir(), "reel-"));
  try {
    const slotImages = await Promise.all(
      job.slots.map((s, i) => (s.image ? materialize(s.image, work, `slot${i}.img`, opts.signal) : Promise.resolve(null))),
    );
    const audio = await Promise.all(
      job.audio.map((a, i) => (a.source ? materialize(a.source, work, `clip${i}.audio`, opts.signal) : Promise.resolve(null))),
    );
    const music = job.music ? await materialize(job.music.source, work, "music.audio", opts.signal).catch(() => null) : null;

    const ass = path.join(work, "captions.ass");
    await writeFile(/*turbopackIgnore: true*/ ass, buildAss({ width: job.width, height: job.height, captions: job.captions, slots: job.slots, highlight: job.highlight }));

    // A private fontconfig that only knows the bundled font: serverless images have no /etc/fonts,
    // and this keeps the look identical everywhere.
    await mkdir(/*turbopackIgnore: true*/ path.join(work, "fc-cache"));
    const fontsConf = path.join(work, "fonts.conf");
    await writeFile(
      /*turbopackIgnore: true*/ fontsConf,
      `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <dir>${fontsDir}</dir>\n  <cachedir>${path.join(work, "fc-cache")}</cachedir>\n</fontconfig>\n`,
    );

    const { inputArgs, graph, encodeArgs, total } = buildGraph(job, { slotImages, audio, music, ass, fontsDir });
    const graphFile = path.join(work, "graph.txt");
    await writeFile(/*turbopackIgnore: true*/ graphFile, graph);
    const out = opts.outputPath ?? path.join(work, "out.mp4");
    const args = ["-hide_banner", "-nostdin", "-y", "-loglevel", "error", ...inputArgs, "-filter_complex_script", graphFile, ...encodeArgs, out];
    await run(bin, args, { ...process.env, FONTCONFIG_FILE: fontsConf }, opts.timeoutMs ?? 240_000, opts.signal);
    const mp4 = await readFile(/*turbopackIgnore: true*/ out);
    return { mp4, duration: total, elapsedMs: Date.now() - started };
  } finally {
    if (!opts.keepWorkDir) await rm(/*turbopackIgnore: true*/ work, { recursive: true, force: true }).catch(() => undefined);
  }
}
