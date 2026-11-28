import { entitlementFor, tierOf } from "./credits";
import { dispatch } from "./jobs";
import { FREE_REELS_PER_DAY } from "./plans";
import { adminClient } from "./supabase/admin";
import { nextEasternMidnight } from "./eastern";
import type { Viewer } from "./viewer";

// The free upload queue. A free account past its one free document can still upload: the document waits as
// "queued" and starts once the account may make another free reel (free reels are FREE_REELS_PER_DAY a day, reset at
// 12:00 AM Eastern, and a document's first reel is one of them). Nothing starts on its own: when a queued document's
// turn comes, the Studio shows it under "Ready to make" with a Ready button, and it is only made once the owner taps it
// (so reels are made while they're there to watch, not in the background). One document at a time for free accounts.

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

/** Whether a free account may start another document now: no wait for a free reel and nothing it queued earlier still
 * being set up. Paid accounts always may. */
async function mayStart(viewer: Viewer): Promise<{ ok: boolean; nextAt: string | null }> {
  if (tierOf(viewer.profile) !== "free") return { ok: true, nextAt: null };
  const nextAt = await nextFreeReelAt(viewer);
  if (nextAt) return { ok: false, nextAt };
  const { count } = await adminClient()
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.userId!)
    .in("status", MAKING)
    .gt("updated_at", stuckBefore());
  return { ok: !count, nextAt: null };
}

/**
 * The queue as the Studio shows it, without starting anything: how many uploads wait, when the next free reel is
 * allowed, and whether one may be started now (then the oldest queued shows a Ready button).
 */
export async function queueState(viewer: Viewer): Promise<{ queued: number; nextAt: string | null; ready: boolean }> {
  if (!viewer.userId) return { queued: 0, nextAt: null, ready: false };
  const { count } = await adminClient().from("documents").select("id", { count: "exact", head: true }).eq("user_id", viewer.userId).eq("status", "queued");
  const queued = count ?? 0;
  if (!queued) return { queued: 0, nextAt: null, ready: false };
  const may = await mayStart(viewer);
  return { queued, nextAt: may.nextAt, ready: may.ok };
}

/** The owner tapped Ready on a queued document: start it if its turn has come (free accounts: the oldest one first). */
export async function startQueued(viewer: Viewer, documentId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!viewer.userId) return { ok: false, error: "Sign in first." };
  const db = adminClient();
  const { data: waiting } = await db.from("documents").select("id").eq("user_id", viewer.userId).eq("status", "queued").order("created_at", { ascending: true });
  const queue = waiting ?? [];
  if (!queue.some((d) => d.id === documentId)) return { ok: false, error: "That upload isn't waiting any more." };
  const free = tierOf(viewer.profile) === "free";
  if (free && queue[0].id !== documentId) return { ok: false, error: "Your earlier upload goes first." };
  const may = await mayStart(viewer);
  if (!may.ok) return { ok: false, error: may.nextAt ? "Your next free reel isn't ready yet." : "Wait for the one being made to finish." };
  // Only the request that flips it starts it (a double tap, or two tabs).
  const { data: moved } = await db.from("documents").update({ status: "uploaded" }).eq("id", documentId).eq("status", "queued").select("id");
  if (moved?.length) await dispatch({ name: "process", documentId });
  return { ok: true };
}

/** A free account past its free document may start a new upload right away (no wait, nothing it queued still being
 * made); otherwise the upload joins the queue. */
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
