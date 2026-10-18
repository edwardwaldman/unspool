import { DOCUMENT_COLUMNS, type DocumentRow } from "./db-types";
import { MAX_REELS } from "./config";
import { tierOf } from "./credits";
import { nextDripAt } from "./drip";
import { adminClient } from "./supabase/admin";
import type { Viewer } from "./viewer";

export function canAccess(doc: Pick<DocumentRow, "user_id" | "anon_token">, viewer: Viewer) {
  if (doc.user_id) return doc.user_id === viewer.userId;
  return Boolean(doc.anon_token && viewer.anonToken && doc.anon_token === viewer.anonToken);
}

/** Every reel of this document is playable: bought under the old per-document price, or fully paid with credits. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- callers pass the viewer; the rule is per document now
export function isUnlocked(doc: Pick<DocumentRow, "unlocked" | "credit_reels" | "reel_count">, _viewer?: Viewer) {
  if (doc.unlocked) return true;
  return Boolean(doc.reel_count && (doc.credit_reels ?? 0) >= doc.reel_count);
}

/**
 * How many reels of this document may play: the ones paid for (credits, or the free drip), and for a
 * free owner when the next free reel may be unlocked (ISO; may be in the past, meaning "ready now").
 * `viewer` is the document's owner. Server-authoritative: generation is gated on the same credit_reels.
 */
export function freeReelLimit(
  doc: Pick<DocumentRow, "unlocked" | "user_id" | "created_at" | "reel_count" | "credit_reels" | "free_unlocked_at">,
  viewer: Viewer,
  opts: { reelRows?: number; now?: number } = {},
) {
  const total = reelTotal(doc, opts.reelRows);
  if (doc.unlocked) return { playable: total, nextFreeAt: null as string | null };
  const playable = Math.min(total, doc.credit_reels ?? 0);
  const free = tierOf(viewer.profile) === "free";
  const nextFreeAt = free ? nextDripAt(doc.free_unlocked_at, playable, total) : null;
  return { playable, nextFreeAt };
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
