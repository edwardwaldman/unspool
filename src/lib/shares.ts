import { freeReelLimit } from "./access";
import { DOCUMENT_COLUMNS, type DocumentRow, type ReelRow } from "./db-types";
import { SAMPLE_SPOOL } from "./sample";
import type { ReelDTO, SpoolDTO } from "./spool-types";
import { adminClient } from "./supabase/admin";
import { VIDEO_BUCKET } from "./video/types";
import { isSubscribed, ownerUnlimited, withStoredView, type Profile, type Viewer } from "./viewer";

// Public share links for one reel (/r/[slug]). Everything here runs with the service role, so each
// function re-checks what it serves: an active (not revoked) share, a ready reel the OWNER can play
// right now, and only that reel's script/audio/video. Never the document file, other reels or the owner.

export type ShareRow = {
  id: string;
  reel_id: string;
  document_id: string;
  user_id: string;
  show_title: boolean;
  created_at: string;
  revoked_at: string | null;
  view_count: number;
};

export const DEMO_SHARE = "demo";
export const SHARE_SLUG = /^[A-Za-z0-9_-]{8,16}$/;
/** New share links per user per 24h. */
export const SHARE_DAILY_LIMIT = 60;
const PUBLIC_URL_TTL = 60 * 60;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function newSlug(len = 10) {
  // 62 doesn't divide 256: reject bytes >= 248 so every character is equally likely.
  let out = "";
  while (out.length < len) {
    for (const b of crypto.getRandomValues(new Uint8Array(len * 2))) if (b < 248 && out.length < len) out += ALPHABET[b % 62];
  }
  return out;
}

/** The owner as a Viewer, so the drip/unlock rules are evaluated for them, not for whoever is watching. */
export async function ownerViewer(userId: string): Promise<Viewer> {
  const { data: profile } = await adminClient().from("profiles").select("*").eq("id", userId).maybeSingle<Profile>();
  const p = withStoredView(profile ?? null);
  return { userId, email: null, profile: p, anonToken: null, subscribed: isSubscribed(p), isOwner: false, realUserId: userId, realEmail: null, ownerUnlimited: ownerUnlimited(p), ownerView: null };
}

type ReelPublic = Pick<ReelRow, "id" | "index" | "title" | "hook" | "status" | "script_json" | "audio_paths" | "video_path" | "video_meta" | "document_id">;
const REEL_COLUMNS = "id,index,title,hook,status,script_json,audio_paths,video_path,video_meta,document_id";

/** Whether the owner may play this reel right now (free, dripped or unlocked) and it is ready. */
export async function ownerCanPlay(doc: DocumentRow, reel: Pick<ReelRow, "index" | "status" | "script_json">, owner: Viewer) {
  if (reel.status !== "ready" || !reel.script_json) return false;
  const { count } = await adminClient().from("reels").select("id", { count: "exact", head: true }).eq("document_id", doc.id);
  const { playable } = freeReelLimit(doc, owner, { reelRows: count ?? 0 });
  return reel.index <= playable;
}

export async function loadReelWithDoc(reelId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(reelId)) return null;
  const db = adminClient();
  const { data: reel } = await db.from("reels").select(REEL_COLUMNS).eq("id", reelId).maybeSingle<ReelPublic>();
  if (!reel) return null;
  const { data: doc } = await db.from("documents").select(DOCUMENT_COLUMNS).eq("id", reel.document_id).maybeSingle<DocumentRow>();
  if (!doc) return null;
  return { reel, doc };
}

export type PublicShare = { slug: string; spool: SpoolDTO; reel: ReelDTO; hook: string; index: number };

/** A demo share of the sample spool's first reel, so /s/demo can show sharing without an account. */
function demoShare(): PublicShare {
  const reel = SAMPLE_SPOOL.reels[0];
  return { slug: DEMO_SHARE, spool: { ...SAMPLE_SPOOL, reels: [reel] }, reel, hook: reel.hook, index: reel.index };
}

/**
 * Load what a public share page may show, or null (revoked, missing, no longer playable).
 * `signMedia` false skips signing audio/video (link previews only need the hook).
 */
export async function loadPublicShare(slug: string, opts: { signMedia?: boolean } = {}): Promise<PublicShare | null> {
  if (slug === DEMO_SHARE) return demoShare();
  if (!SHARE_SLUG.test(slug)) return null;
  const db = adminClient();
  const { data: share } = await db.from("reel_shares").select("*").eq("id", slug).is("revoked_at", null).maybeSingle<ShareRow>();
  if (!share) return null;
  const found = await loadReelWithDoc(share.reel_id);
  if (!found || found.doc.id !== share.document_id || found.doc.user_id !== share.user_id) return null;
  const { reel, doc } = found;
  // Re-check on every view: a reel that stopped being playable for its owner is not public either.
  if (!(await ownerCanPlay(doc, reel, await ownerViewer(share.user_id)))) return null;

  let audio: ReelDTO["audio"] = undefined;
  let videoUrl: string | undefined;
  const sign = opts.signMedia !== false;
  const paths = Object.values(reel.audio_paths ?? {}).flatMap((a) => (a.path ? [a.path] : []));
  const urls = new Map<string, string>();
  if (sign && paths.length) {
    const { data } = await db.storage.from("audio").createSignedUrls(paths, PUBLIC_URL_TTL);
    for (const s of data ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  audio = Object.fromEntries(
    Object.entries(reel.audio_paths ?? {}).map(([k, a]) => [k, { url: a.path ? urls.get(a.path) : undefined, duration: a.duration, words: a.words }]),
  );
  if (sign && reel.video_path && reel.video_meta) {
    const { data } = await db.storage.from(VIDEO_BUCKET).createSignedUrl(reel.video_path, PUBLIC_URL_TTL);
    videoUrl = data?.signedUrl;
  }

  const dto: ReelDTO = {
    id: share.id,
    index: reel.index,
    title: reel.title,
    hook: reel.hook,
    status: "ready",
    locked: false,
    script: reel.script_json!,
    audio,
    ...(videoUrl && reel.video_meta ? { videoUrl, video: reel.video_meta } : {}),
  };
  const title = share.show_title ? doc.title ?? null : null;
  const spool: SpoolDTO = {
    // No document id, file name, counts or dates: only what this one reel needs.
    id: `share-${share.id}`,
    fileName: title ?? "Shared reel",
    fileType: "",
    title,
    docType: doc.doc_type,
    sensitive: doc.sensitive,
    status: "ready",
    error: null,
    unlocked: true,
    totalReels: 1,
    freeReels: 1,
    nextFreeUnlockAt: null,
    pageCount: null,
    wordCount: null,
    truncated: false,
    createdAt: share.created_at,
    reels: [dto],
  };
  return { slug: share.id, spool, reel: dto, hook: reel.hook, index: reel.index };
}

export async function countShareView(slug: string) {
  if (slug === DEMO_SHARE || !SHARE_SLUG.test(slug)) return;
  try {
    await adminClient().rpc("increment_share_view", { p_id: slug });
  } catch {
    // best effort
  }
}

export type ShareSummary = { slug: string; views: number; createdAt: string; showTitle: boolean };
export const toSummary = (s: ShareRow): ShareSummary => ({ slug: s.id, views: s.view_count, createdAt: s.created_at, showTitle: s.show_title });
