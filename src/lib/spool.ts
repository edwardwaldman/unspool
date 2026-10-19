import { freeReelLimit, isUnlocked } from "./access";
import { DOCUMENT_COLUMNS, type DocumentRow, type ReelRow } from "./db-types";
import { extensionOf } from "./config";
import { healIfStuck } from "./pipeline";
import { styleForViewer } from "./studio";
import type { ReelDTO, SpoolDTO } from "./spool-types";
import { adminClient } from "./supabase/admin";
import { VIDEO_BUCKET } from "./video/types";
import type { Viewer } from "./viewer";

const SIGNED_URL_TTL = 60 * 60 * 6;

type ReelLite = Pick<
  ReelRow,
  "id" | "index" | "title" | "hook" | "status" | "error" | "script_json" | "audio_paths" | "started_at" | "video_path" | "video_meta"
>;

/** Build the client view of a document: titles/hooks for all reels, full script + audio only where unlocked. */
export async function buildSpool(doc: DocumentRow, viewer: Viewer, opts: { heal?: boolean } = {}): Promise<SpoolDTO> {
  const db = adminClient();
  const unlocked = isUnlocked(doc, viewer);
  const style = styleForViewer(viewer);
  const { data } = await db
    .from("reels")
    .select("id,index,title,hook,status,error,script_json,audio_paths,started_at,video_path,video_meta")
    .eq("document_id", doc.id)
    .order("index");
  const rows = (data ?? []) as ReelLite[];
  // Free accounts: reel 1, then one more every hour (the drip). Only playable reels get scripts and audio.
  const { playable, nextFreeAt } = freeReelLimit(doc, viewer, { reelRows: rows.length });

  if (opts.heal) await healIfStuck(doc, rows, playable);

  const visible = rows.filter((r) => r.index <= playable);
  const paths = visible.flatMap((r) =>
    r.status === "ready" ? Object.values(r.audio_paths ?? {}).flatMap((a) => (a.path ? [a.path] : [])) : [],
  );
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await db.storage.from("audio").createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  // Rendered videos: signed only for playable (unlocked or free) reels; locked reels never get one.
  const videoPaths = visible.flatMap((r) => (r.status === "ready" && r.video_path && r.video_meta ? [r.video_path] : []));
  const videoUrls = new Map<string, string>();
  if (videoPaths.length) {
    const { data: signed } = await db.storage.from(VIDEO_BUCKET).createSignedUrls(videoPaths, SIGNED_URL_TTL);
    for (const s of signed ?? []) if (s.path && s.signedUrl) videoUrls.set(s.path, s.signedUrl);
  }

  const reels: ReelDTO[] = rows.map((r) => {
    const locked = r.index > playable;
    const base: ReelDTO = { id: r.id, index: r.index, title: r.title, hook: r.hook, status: r.status, locked, error: r.error };
    if (locked || r.status !== "ready" || !r.script_json) return base;
    const audio = Object.fromEntries(
      Object.entries(r.audio_paths ?? {}).map(([k, a]) => [
        k,
        { url: a.path ? urls.get(a.path) : undefined, duration: a.duration, words: a.words },
      ]),
    );
    const videoUrl = r.video_path ? videoUrls.get(r.video_path) : undefined;
    return { ...base, script: r.script_json, audio, ...(videoUrl && r.video_meta ? { videoUrl, video: r.video_meta } : {}) };
  });

  return {
    id: doc.id,
    fileName: doc.file_name,
    fileType: extensionOf(doc.file_name),
    title: doc.title,
    docType: doc.doc_type,
    sensitive: doc.sensitive,
    status: doc.status,
    error: doc.error,
    unlocked,
    totalReels: doc.reel_count || rows.length || null,
    freeReels: playable,
    nextFreeUnlockAt: nextFreeAt,
    pageCount: doc.page_count,
    wordCount: doc.word_count,
    truncated: doc.truncated,
    createdAt: doc.created_at,
    reels,
    ...(doc.user_id && doc.user_id === viewer.userId && style ? { style } : {}),
  };
}

/** Documents visible to the viewer, newest first. */
export async function listDocuments(viewer: Viewer, limit = 50): Promise<DocumentRow[]> {
  const db = adminClient();
  if (viewer.userId) {
    const { data } = await db
      .from("documents")
      .select(DOCUMENT_COLUMNS)
      .eq("user_id", viewer.userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as DocumentRow[];
  }
  if (!viewer.anonToken) return [];
  const { data } = await db
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .is("user_id", null)
    .eq("anon_token", viewer.anonToken)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DocumentRow[];
}

export async function deleteDocument(doc: Pick<DocumentRow, "id" | "file_path">) {
  const db = adminClient();
  const { data: audio } = await db.storage.from("audio").list(doc.id, { limit: 100 });
  // Audio is stored as {docId}/{reelIndex}/{segment}.mp3
  const audioPaths: string[] = [];
  for (const folder of audio ?? []) {
    const { data: files } = await db.storage.from("audio").list(`${doc.id}/${folder.name}`, { limit: 200 });
    for (const f of files ?? []) audioPaths.push(`${doc.id}/${folder.name}/${f.name}`);
  }
  if (audioPaths.length) await db.storage.from("audio").remove(audioPaths);
  // Videos are stored as {docId}/{reelIndex}/reel-{attempt}.mp4
  const { data: videoFolders } = await db.storage.from(VIDEO_BUCKET).list(doc.id, { limit: 100 });
  const videoPaths: string[] = [];
  for (const folder of videoFolders ?? []) {
    const { data: files } = await db.storage.from(VIDEO_BUCKET).list(`${doc.id}/${folder.name}`, { limit: 100 });
    for (const f of files ?? []) videoPaths.push(`${doc.id}/${folder.name}/${f.name}`);
  }
  if (videoPaths.length) await db.storage.from(VIDEO_BUCKET).remove(videoPaths);
  if (doc.file_path) await db.storage.from("documents").remove([doc.file_path]);
  await db.from("documents").delete().eq("id", doc.id);
}
