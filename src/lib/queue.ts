import { entitlementFor, tierOf } from "./credits";
import { dispatch } from "./jobs";
import { FREE_REELS_PER_DAY } from "./plans";
import { adminClient } from "./supabase/admin";
import { nextEasternMidnight } from "./eastern";
import type { Viewer } from "./viewer";

// The free upload queue. A free account past its one free document can still upload: the document waits as
// "queued" and starts once the account may make another free reel (free reels are FREE_REELS_PER_DAY a day, reset at
// 12:00 AM Eastern, and a document's first reel is one of them). Nothing runs on a timer: the queue moves when the owner
// opens the Studio (its countdown reloads the page when it reaches zero), one document at a time.

// A document still being set up (before its first reel exists): free accounts get one of these at a time.
const MAKING = ["uploaded", "extracting", "planning"];
// One that hasn't moved in 30 minutes is stuck, not being made: it never holds up the queue.
const stuckBefore = () => new Date(Date.now() - 30 * 60e3).toISOString();

/** When this account may make its next free reel: null means now. Free reels reset at 12:00 AM Eastern. */
export async function nextFreeReelAt(viewer: Viewer): Promise<string | null> {
  const subject = entitlementFor(viewer.profile, viewer.userId ? `u:${viewer.userId}` : null).subject;
  const { data } = await adminClient().rpc("free_reels_used", { p_subject: subject });
  const used = typeof data === "number" ? data : 0;
  return used < FREE_REELS_PER_DAY ? null : nextEasternMidnight();
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
  // One at a time for free accounts: wait while another of their documents is still being set up.
  if (free) {
    const { count } = await db
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", viewer.userId)
      .in("status", MAKING)
      .gt("updated_at", stuckBefore());
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

/** A free account past its free document may start a new upload right away (no wait, nothing it queued still being
 * made); otherwise the upload joins the queue. Same rule as moveQueue, so an upload never "queues" only to start. */
export async function canStartNow(viewer: Viewer): Promise<boolean> {
  if (!viewer.userId) return false;
  if (await nextFreeReelAt(viewer)) return false;
  const db = adminClient();
  const [{ count: waiting }, { count: making }] = await Promise.all([
    db.from("documents").select("id", { count: "exact", head: true }).eq("user_id", viewer.userId).eq("status", "queued"),
    db.from("documents").select("id", { count: "exact", head: true }).eq("user_id", viewer.userId).in("status", MAKING).gt("updated_at", stuckBefore()),
  ]);
  return !waiting && !making;
}
