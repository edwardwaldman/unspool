import { DOCUMENT_COLUMNS, type DocumentRow } from "./db-types";
import { MAX_REELS } from "./config";
import { dripUnlocked, nextDripAt } from "./drip";
import { adminClient } from "./supabase/admin";
import type { Viewer } from "./viewer";

export function canAccess(doc: Pick<DocumentRow, "user_id" | "anon_token">, viewer: Viewer) {
  if (doc.user_id) return doc.user_id === viewer.userId;
  return Boolean(doc.anon_token && viewer.anonToken && doc.anon_token === viewer.anonToken);
}

export function isUnlocked(doc: Pick<DocumentRow, "unlocked" | "user_id">, viewer: Viewer) {
  if (doc.unlocked) return true;
  return Boolean(viewer.subscribed && doc.user_id && doc.user_id === viewer.userId);
}

/**
 * How many reels of this document the viewer may play right now, and when the next free one opens.
 * Unlocked documents (bought, or a subscriber's own) get all of them; everyone else gets the hourly drip.
 */
export function freeReelLimit(
  doc: Pick<DocumentRow, "unlocked" | "user_id" | "created_at" | "reel_count">,
  viewer: Viewer,
  opts: { reelRows?: number; now?: number } = {},
) {
  const total = reelTotal(doc, opts.reelRows);
  const now = opts.now ?? Date.now();
  if (isUnlocked(doc, viewer)) return { playable: total, nextFreeAt: null };
  return { playable: dripUnlocked(doc.created_at, total, now), nextFreeAt: nextDripAt(doc.created_at, total, now) };
}

/** The document's planned reel count; MAX_REELS until the plan exists. */
export function reelTotal(doc: Pick<DocumentRow, "reel_count">, reelRows = 0) {
  return doc.reel_count || reelRows || MAX_REELS;
}

/** Load a document the viewer is allowed to see, or null (treated as 404 so ids don't leak). */
export async function loadDocument(id: string, viewer: Viewer): Promise<DocumentRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await adminClient().from("documents").select(DOCUMENT_COLUMNS).eq("id", id).maybeSingle<DocumentRow>();
  if (!data || !canAccess(data, viewer)) return null;
  return data;
}
