import { siteUrl } from "./config";
import { recordToken } from "./record-token";
import { loadReelWithDoc } from "./shares";
import type { ReelDTO, SpoolDTO } from "./spool-types";
import { adminClient } from "./supabase/admin";
import { VIDEO_BUCKET } from "./video/types";

// Downloadable reels: an exact recording of the reel as it plays in the app (3D scenes, captions, quiz), made by
// the recorder service (worker/, POST /record). The app queues a job; the recorder opens the reel's signed
// /record page in a headless browser, steps it frame by frame on a fake clock, lays the voiceover and music under
// the frames, uploads the MP4 to a signed upload URL and calls back. The file lives at videos/downloads/<reel>.mp4.

export type DownloadState = { status: "none" | "rendering" | "ready" | "failed"; url?: string; error?: string };
type Row = { id: string; title: string; download_path: string | null; download_status: string | null; download_error: string | null; download_requested_at: string | null };

/** Recording takes a few minutes; a job that hasn't reported back after this is treated as failed. */
const STALE_MS = 20 * 60_000;
const pathFor = (reelId: string) => `downloads/${reelId}.mp4`;
export const recorderConfigured = () => Boolean(process.env.RECORDER_URL && process.env.RENDER_SECRET);

/** Everything the record page needs to play one reel, with its voiceover clips signed for two hours. */
export async function loadReelForRecording(reelId: string): Promise<{ spool: SpoolDTO; reel: ReelDTO } | null> {
  const found = await loadReelWithDoc(reelId);
  if (!found || found.reel.status !== "ready" || !found.reel.script_json) return null;
  const { reel, doc } = found;
  const db = adminClient();
  const paths = Object.values(reel.audio_paths ?? {}).flatMap((a) => (a.path ? [a.path] : []));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await db.storage.from("audio").createSignedUrls(paths, 2 * 60 * 60);
    for (const s of data ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  const audio = Object.fromEntries(
    Object.entries(reel.audio_paths ?? {}).map(([k, a]) => [k, { url: a.path ? urls.get(a.path) : undefined, duration: a.duration, words: a.words }]),
  );
  const dto: ReelDTO = { id: reel.id, index: reel.index, title: reel.title, hook: reel.hook, status: "ready", locked: false, script: reel.script_json!, audio };
  const spool: SpoolDTO = {
    id: `record-${reel.id}`,
    fileName: doc.file_name,
    fileType: doc.file_type ?? "",
    title: doc.title ?? null,
    docType: doc.doc_type,
    sensitive: doc.sensitive,
    status: "ready",
    error: null,
    unlocked: true,
    totalReels: doc.reel_count ?? 1,
    freeReels: 1,
    nextFreeUnlockAt: null,
    pageCount: null,
    wordCount: null,
    truncated: false,
    createdAt: doc.created_at,
    reels: [dto],
  };
  return { spool, reel: dto };
}

async function row(reelId: string) {
  const { data } = await adminClient().from("reels").select("id,title,download_path,download_status,download_error,download_requested_at").eq("id", reelId).maybeSingle<Row>();
  return data;
}

const fileName = (title: string) => `unspool-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "reel"}.mp4`;

/** Where this reel's download stands; a ready one comes with a short-lived signed link that saves as a file. */
export async function downloadState(reelId: string): Promise<DownloadState> {
  const r = await row(reelId);
  if (!r) return { status: "none" };
  if (r.download_status === "ready" && r.download_path) {
    const { data } = await adminClient().storage.from(VIDEO_BUCKET).createSignedUrl(r.download_path, 60 * 60, { download: fileName(r.title) });
    return data?.signedUrl ? { status: "ready", url: data.signedUrl } : { status: "failed", error: "The video file is missing. Try again." };
  }
  if (r.download_status === "rendering") {
    if (r.download_requested_at && Date.now() - new Date(r.download_requested_at).getTime() > STALE_MS) {
      await adminClient().from("reels").update({ download_status: "failed", download_error: "Recording took too long" }).eq("id", reelId);
      return { status: "failed", error: "Recording took too long. Try again." };
    }
    return { status: "rendering" };
  }
  if (r.download_status === "failed") return { status: "failed", error: r.download_error ?? "Recording failed" };
  return { status: "none" };
}

/** Queue a recording (or return the one in progress / done). */
export async function requestDownload(reelId: string, origin?: string): Promise<DownloadState> {
  const now = await downloadState(reelId);
  if (now.status === "ready" || now.status === "rendering") return now;
  if (!recorderConfigured()) return { status: "failed", error: "Video downloads aren't switched on yet." };
  const token = recordToken(reelId, 60 * 60);
  if (!token) return { status: "failed", error: "Video downloads aren't switched on yet." };
  const db = adminClient();
  const path = pathFor(reelId);
  const { data: up, error: upErr } = await db.storage.from(VIDEO_BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (upErr || !up?.signedUrl) return { status: "failed", error: "Couldn't prepare the video upload." };
  const site = siteUrl(origin);
  await db.from("reels").update({ download_status: "rendering", download_error: null, download_path: null, download_requested_at: new Date().toISOString() }).eq("id", reelId);
  try {
    const res = await fetch(process.env.RECORDER_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RENDER_SECRET}` },
      body: JSON.stringify({
        url: `${site}/record/${reelId}?token=${encodeURIComponent(token)}`,
        upload: up.signedUrl,
        done: `${site}/api/reels/${reelId}/download/done?token=${encodeURIComponent(token)}`,
        music: `${site}/music/bed.mp3`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status !== 202 && !res.ok) throw new Error(`recorder ${res.status}`);
  } catch (err) {
    console.error("[download] recorder unreachable", err);
    await db.from("reels").update({ download_status: "failed", download_error: "The recorder is busy. Try again in a minute." }).eq("id", reelId);
    return { status: "failed", error: "The recorder is busy. Try again in a minute." };
  }
  return { status: "rendering" };
}

/** The recorder's callback: the MP4 is uploaded (ok) or the recording failed. */
export async function finishDownload(reelId: string, ok: boolean, message?: string) {
  await adminClient()
    .from("reels")
    .update(ok ? { download_status: "ready", download_path: pathFor(reelId), download_error: null } : { download_status: "failed", download_error: (message ?? "Recording failed").slice(0, 300) })
    .eq("id", reelId);
}
