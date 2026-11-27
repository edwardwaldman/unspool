import { entitlementFor, tierOf } from "./credits";
import { dispatch } from "./jobs";
import { FREE_REELS_PER_DAY } from "./plans";
import { adminClient } from "./supabase/admin";
import type { Viewer } from "./viewer";

// The free upload queue. A free account past its one free document can still upload: the document waits as
// "queued" and starts once the account may make another free reel (free reels are FREE_REELS_PER_DAY in a rolling
// 24 hours, and a document's first reel is one of them). Nothing runs on a timer: the queue moves when the owner
// opens the Studio (its countdown reloads the page when it reaches zero), one document at a time.

const DAY_MS = 24 * 3600e3;

/** When this account may make its next free reel: null means now. */
export async function nextFreeReelAt(viewer: Viewer): Promise<string | null> {
  const subject = entitlementFor(viewer.profile, viewer.userId ? `u:${viewer.userId}` : null).subject;
  const { data } = await adminClient()
    .from("credit_events")
    .select("kind,created_at")
    .eq("subject", subject)
    .eq("free", true)
    .gt("created_at", new Date(Date.now() - DAY_MS).toISOString())
    .order("created_at", { ascending: true });
  const rows = data ?? [];
  const reserves = rows.filter((r) => r.kind === "reserve");
  const used = reserves.length - rows.filter((r) => r.kind === "refund").length;
  if (used < FREE_REELS_PER_DAY) return null;
  // At the cap: the oldest free reel in the window frees a slot when it turns 24 hours old.
  const oldest = reserves[0]?.created_at;
  return oldest ? new Date(Date.parse(oldest) + DAY_MS).toISOString() : null;
}

/**
 * Start the oldest queued document if the account may make a free reel now and nothing it queued earlier is still
 * being made. Returns when the queue may move next (null: now or nothing queued).
 */
export async function moveQueue(viewer: Viewer): Promise<{ queued: number; nextAt: string | null }> {
  if (!viewer.userId) return { queued: 0, nextAt: null };
  const db = adminClient();
  const { data: waiting } = await db
    .from("documents")
    .select("id")
    .eq("user_id", viewer.userId)
    .eq("status", "queued")
    .order("created_at", { ascending: true });
  const queue = waiting ?? [];
  if (!queue.length) return { queued: 0, nextAt: null };
  // A paid account (or top-ups) has no wait: everything queued starts now.
  const free = tierOf(viewer.profile) === "free";
  const nextAt = free ? await nextFreeReelAt(viewer) : null;
  if (nextAt) return { queued: queue.length, nextAt };
  // One at a time for free accounts: wait while a document released from the queue is still being made.
  if (free) {
    const { count } = await db
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", viewer.userId)
      .eq("queued", true)
      .in("status", ["uploaded", "extracting", "planning"]);
    if (count) return { queued: queue.length, nextAt: null };
  }
  const start = free ? queue.slice(0, 1) : queue;
  for (const d of start) {
    // Only the request that flips it starts it (two tabs opening the Studio at once).
    const { data: moved } = await db.from("documents").update({ status: "uploaded" }).eq("id", d.id).eq("status", "queued").select("id");
    if (moved?.length) await dispatch({ name: "process", documentId: d.id });
  }
  return { queued: queue.length - start.length, nextAt: null };
}
