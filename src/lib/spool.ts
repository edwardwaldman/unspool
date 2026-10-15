import { isUnlocked } from "./access";
import { DOCUMENT_COLUMNS, type DocumentRow, type ReelRow } from "./db-types";
import { extensionOf } from "./config";
import { healIfStuck } from "./pipeline";
import type { ReelDTO, SpoolDTO } from "./spool-types";
import { adminClient } from "./supabase/admin";
import type { Viewer } from "./viewer";

const SIGNED_URL_TTL = 60 * 60 * 6;

type ReelLite = Pick<ReelRow, "id" | "index" | "title" | "hook" | "status" | "error" | "script_json" | "audio_paths" | "started_at">;

/** Build the client view of a document: titles/hooks for all reels, full script + audio only where unlocked. */
export async function buildSpool(doc: DocumentRow, viewer: Viewer, opts: { heal?: boolean } = {}): Promise<SpoolDTO> {
  const db = adminClient();
  const unlocked = isUnlocked(doc, viewer);
  const { data } = await db
    .from("reels")
    .select("id,index,title,hook,status,error,script_json,audio_paths,started_at")
    .eq("document_id", doc.id)
    .order("index");
  const rows = (data ?? []) as ReelLite[];

  if (opts.heal) await healIfStuck(doc, rows, unlocked);

  const visible = rows.filter((r) => r.index === 1 || unlocked);
  const paths = visible.flatMap((r) =>
    r.status === "ready" ? Object.values(r.audio_paths ?? {}).flatMap((a) => (a.path ? [a.path] : [])) : [],
  );
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await db.storage.from("audio").createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  const reels: ReelDTO[] = rows.map((r) => {
    const locked = r.index > 1 && !unlocked;
    const base: ReelDTO = { id: r.id, index: r.index, title: r.title, hook: r.hook, status: r.status, locked, error: r.error };
    if (locked || r.status !== "ready" || !r.script_json) return base;
    const audio = Object.fromEntries(
      Object.entries(r.audio_paths ?? {}).map(([k, a]) => [
        k,
        { url: a.path ? urls.get(a.path) : undefined, duration: a.duration, words: a.words },
      ]),
    );
    return { ...base, script: r.script_json, audio };
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
    pageCount: doc.page_count,
    wordCount: doc.word_count,
    truncated: doc.truncated,
    createdAt: doc.created_at,
    reels,
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
  if (doc.file_path) await db.storage.from("documents").remove([doc.file_path]);
  await db.from("documents").delete().eq("id", doc.id);
}
