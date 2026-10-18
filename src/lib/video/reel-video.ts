import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { markupWords } from "../markup";
import type { AudioMap, HighlightColor, ReelScript, Visual } from "../schema";
import type { Segment } from "../segments";
import { adminClient } from "../supabase/admin";
import { estimateWordFractions } from "../timing";
import { imageProvider, styledPrompt, type GeneratedImage } from "./images";
import { renderVideo } from "./render";
import { VIDEO_BUCKET, type CaptionLine, type Card, type MediaSource, type Motion, type RenderJob, type RenderSlot, type VideoTimeline } from "./types";

// Turns a scripted + voiced reel into an MP4: one image per beat, Ken-Burns + crossfades, burned-in
// captions, the voiceover. Runs in the per-reel job after TTS, or hands the job to RENDER_URL.
// Any failure here returns null and the reel keeps today's animated player.

const W = 720;
const H = 1280;
const FPS = 24;
const ACCENT = "#d3f05a";

const MARK_HEX: Record<HighlightColor, string> = {
  primary: ACCENT,
  warn: "#ff8b6c",
  yellow: "#f2d36b",
  cyan: "#7fd3a6",
};

const CARD_PALETTES: [string, string][] = [
  ["#0b2a20", "#1d5c45"],
  ["#08110e", "#123d2e"],
  ["#10261d", "#2a5a3c"],
  ["#0d1f19", "#1b4a3a"],
];
const MOTIONS: Motion[] = ["in", "left", "out", "right", "up"];

/** VIDEO_RENDER=on|off. Default: on when an image provider or a render worker is configured. */
export function videoRenderEnabled(): boolean {
  const flag = process.env.VIDEO_RENDER?.trim().toLowerCase();
  if (flag === "off" || flag === "false" || flag === "0") return false;
  if (flag === "on" || flag === "true" || flag === "1") return true;
  return Boolean(imageProvider() || process.env.RENDER_URL);
}

function cardTitle(v: Visual): string {
  switch (v.type) {
    case "hook":
      return v.tag;
    case "bigword":
      return v.word;
    case "split":
      return `${v.left.title} ${v.mode === "vs" ? "vs" : "to"} ${v.right.title}`;
    case "flow":
      return v.steps.map((s) => s.title).slice(0, 3).join(" / ");
    case "list":
      return v.title;
    case "icons":
      return v.items.map((i) => i.label).join(" / ");
    case "crowd":
      return v.highlight_label;
    case "stat":
      return `${v.value} ${v.label}`;
  }
}

function sceneFor(script: ReelScript, beatIndex: number): string {
  const beat = script.beats[beatIndex];
  const given = beat?.image_prompt?.trim();
  if (given) return given;
  // Older scripts have no image_prompt: describe the beat's idea instead.
  return `a visual metaphor for: ${markupWords(beat?.say ?? script.title).map((w) => w.text).join(" ")}`;
}

type Plan = {
  timeline: VideoTimeline;
  slots: (RenderSlot & { prompt?: string })[];
  captions: CaptionLine[];
};

/** Lay segments end to end and decide what fills the screen during each. */
export function planVideo(script: ReelScript, segments: Segment[], audio: AudioMap): Plan {
  let t = 0;
  const timed = segments.map((s) => {
    const duration = audio[s.key]?.duration ?? 0;
    const start = t;
    t += duration;
    return { seg: s, start, duration };
  });
  const total = t;

  // Visual slots: one per beat; the quiz question + answer share one card (the app draws the quiz on
  // top); the outro gets a title card teasing the next reel.
  const slots: Plan["slots"] = [];
  for (const { seg, start, duration } of timed) {
    const last = slots[slots.length - 1];
    if (seg.kind === "explain" && last) {
      last.duration += duration;
      continue;
    }
    const palette = CARD_PALETTES[slots.length % CARD_PALETTES.length];
    if (seg.kind === "beat") {
      const visual = script.beats[seg.beatIndex]?.visual;
      slots.push({
        start,
        duration,
        motion: MOTIONS[slots.length % MOTIONS.length],
        card: { from: palette[0], to: palette[1], title: visual ? cardTitle(visual) : undefined },
        prompt: styledPrompt(sceneFor(script, seg.beatIndex)),
      });
    } else if (seg.kind === "quiz") {
      slots.push({ start, duration, card: { from: "#08110e", to: "#0f2a20" } });
    } else {
      const next = script.outro.next_title;
      const title = /wrap/i.test(next) ? next : `Next: ${next}`;
      slots.push({ start, duration, card: { from: palette[0], to: palette[1], title } });
    }
  }

  // Captions for everything but the quiz (the app shows the quiz card instead).
  const captions: CaptionLine[] = [];
  for (const { seg, start, duration } of timed) {
    if (seg.kind === "quiz" || seg.kind === "explain") continue;
    const words = markupWords(seg.text);
    const stored = audio[seg.key]?.words ?? [];
    const fractions = stored.length === words.length ? stored : estimateWordFractions(words.map((w) => w.text).join(" "));
    captions.push({
      start,
      end: start + duration,
      words: words.map((w, i) => ({ text: w.text, start: start + (fractions[i] ?? 0) * duration, color: w.color ? MARK_HEX[w.color] : null })),
    });
  }

  return {
    slots,
    captions,
    timeline: {
      duration: total,
      segments: timed.map(({ seg, start, duration }) => ({ key: seg.key, start, duration })),
      captions: true,
      width: W,
      height: H,
    },
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** POST the job to the standalone worker; it answers with the MP4 bytes. */
async function renderRemote(job: RenderJob, timeoutMs: number): Promise<Buffer> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.RENDER_SECRET) headers.Authorization = `Bearer ${process.env.RENDER_SECRET}`;
  const res = await fetch(process.env.RENDER_URL!, {
    method: "POST",
    headers,
    body: JSON.stringify({ job }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`render worker returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

export type ReelVideo = { path: string; timeline: VideoTimeline };

/**
 * Render and upload one reel's video. `clips` holds the voiceover MP3s just synthesized (by segment key)
 * so the in-function render doesn't download them again. Returns null when the reel can't be rendered
 * (no real voiceover) — callers treat errors the same way.
 */
export async function renderReelVideo(input: {
  reel: { document_id: string; index: number; attempts: number };
  script: ReelScript;
  segments: Segment[];
  audio: AudioMap;
  clips: Map<string, Buffer>;
  /** Epoch ms by which the reel must be saved (the function's time limit, minus a margin). */
  deadline: number;
}): Promise<ReelVideo | null> {
  const { reel, script, segments, audio, clips } = input;
  // Without a real voiceover for every segment the animated player (device voice) is the better experience.
  if (!segments.every((s) => audio[s.key]?.path && audio[s.key].duration > 0)) return null;

  const plan = planVideo(script, segments, audio);
  const db = adminClient();
  const remote = Boolean(process.env.RENDER_URL);

  // 1. Images (in parallel; any failure leaves that slot as its gradient title card).
  const provider = imageProvider();
  const images: (GeneratedImage | null)[] = await mapLimit(plan.slots, 4, async (slot) => {
    if (!provider || !slot.prompt) return null;
    try {
      const left = input.deadline - Date.now() - 120_000;
      if (left < 5_000) return null;
      return await provider.generate(slot.prompt, { width: W, height: H }, AbortSignal.timeout(Math.min(45_000, left)));
    } catch (err) {
      console.warn("[video] image failed, using a title card:", err instanceof Error ? err.message : err);
      return null;
    }
  });

  const work = await mkdtemp(path.join(tmpdir(), "reel-in-"));
  try {
    // 2. Sources: local files in-function; URLs for the worker.
    let signed = new Map<string, string>();
    if (remote) {
      const paths = segments.map((s) => audio[s.key].path!);
      const { data } = await db.storage.from("audio").createSignedUrls(paths, 60 * 60);
      signed = new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
    }
    const slots: RenderSlot[] = await Promise.all(
      plan.slots.map(async (slot, i) => {
        const img = images[i];
        const base: RenderSlot = { start: slot.start, duration: slot.duration, motion: slot.motion };
        if (!img) return { ...base, card: slot.card as Card };
        if (remote && img.url) return { ...base, image: { url: img.url } };
        if (remote) return { ...base, card: slot.card as Card }; // nothing the worker could fetch
        const file = path.join(work, `img${i}.${img.contentType.includes("png") ? "png" : "jpg"}`);
        await writeFile(/*turbopackIgnore: true*/ file, img.data);
        return { ...base, image: { path: file } };
      }),
    );
    const audioClips = await Promise.all(
      plan.timeline.segments.map(async (s) => {
        const storagePath = audio[s.key].path!;
        let source: MediaSource;
        if (remote) {
          const url = signed.get(storagePath);
          if (!url) throw new Error(`no signed URL for ${storagePath}`);
          source = { url };
        } else {
          let buf = clips.get(s.key);
          if (!buf) {
            const { data, error } = await db.storage.from("audio").download(storagePath);
            if (error || !data) throw error ?? new Error("audio download failed");
            buf = Buffer.from(await data.arrayBuffer());
          }
          const file = path.join(work, `${s.key}.mp3`);
          await writeFile(/*turbopackIgnore: true*/ file, buf);
          source = { path: file };
        }
        return { start: s.start, duration: s.duration, source };
      }),
    );

    const job: RenderJob = {
      width: W,
      height: H,
      fps: FPS,
      slots,
      audio: audioClips,
      captions: plan.captions,
      highlight: ACCENT,
      crf: 28,
      preset: "veryfast",
      fade: 0.35,
      ...(process.env.MUSIC_URL ? { music: { source: { url: process.env.MUSIC_URL }, volume: Number(process.env.MUSIC_VOLUME ?? 0.08) } } : {}),
    };

    // 3. Render, leaving time to upload and save before the function's limit.
    const budget = input.deadline - Date.now() - 15_000;
    if (budget < 30_000) {
      console.warn("[video] not enough time left to render; keeping the animated player");
      return null;
    }
    const mp4 = remote ? await renderRemote(job, budget) : (await renderVideo(job, { timeoutMs: budget })).mp4;

    // 4. Upload (private bucket; served through short-lived signed URLs like the audio).
    const objectPath = `${reel.document_id}/${reel.index}/reel-${reel.attempts + 1}.mp4`;
    const { error } = await db.storage.from(VIDEO_BUCKET).upload(objectPath, mp4, { contentType: "video/mp4", upsert: true });
    if (error) throw error;
    return { path: objectPath, timeline: plan.timeline };
  } finally {
    await rm(/*turbopackIgnore: true*/ work, { recursive: true, force: true }).catch(() => undefined);
  }
}
