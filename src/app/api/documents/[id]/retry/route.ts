import { isOwnerEmail } from "@/lib/owner";
import { freeReelLimit, loadDocument } from "@/lib/access";
import { LIMITS, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { dispatch } from "@/lib/jobs";
import { adminClient } from "@/lib/supabase/admin";
import { claimUsage } from "@/lib/usage";
import { clientIpHash, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: RouteContext<"/api/documents/[id]/retry">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const doc = await loadDocument(id, viewer);
  if (!doc) return error(404, "Not found");
  const db = adminClient();

  const { data } = await db.from("reels").select("id,index,status,attempts").eq("document_id", id);
  const reels = (data ?? []) as { id: string; index: number; status: string; attempts: number }[];
  // Re-plan only a document that failed before it had a plan.
  const reprocess = doc.status === "failed" && reels.length === 0;
  // Re-queue reels the viewer can play (reel 1 plus any dripped free reels, or all when unlocked), and
  // only while they have generation attempts left, so a reel that keeps failing can't be retried forever.
  const { playable } = freeReelLimit(doc, viewer, { reelRows: reels.length });
  const failed = reels.filter((r) => r.status === "failed" && r.index <= playable);
  const toRun = [
    ...failed.filter((r) => r.attempts < LIMITS.maxReelAttempts),
    ...reels.filter((r) => r.status === "pending" && r.index <= playable),
  ];
  if (!reprocess && !toRun.length) {
    if (failed.length) return error(429, "This reel couldn't be made. Try uploading the document again.", { code: "retry_limit" });
    return json({ ok: true });
  }

  // Every retry that does work costs model/TTS calls: cap them per document per day.
  const allowed = await claimUsage({
    kind: "retry",
    scope: "document",
    limit: isOwnerEmail(viewer.email) ? 1_000_000 : LIMITS.retriesPerDocumentPerDay,
    userId: viewer.userId,
    ipHash: await clientIpHash(),
    documentId: id,
  });
  if (!allowed) return error(429, "Too many retries for this document today. Try again tomorrow.", { code: "limit" });

  if (reprocess) {
    await dispatch({ name: "process", documentId: id });
    return json({ ok: true });
  }
  if (doc.status === "failed") {
    await db.from("documents").update({ status: "scripting", error: null }).eq("id", id).eq("status", "failed");
  }
  for (const r of toRun) await dispatch({ name: "reel", reelId: r.id });
  return json({ ok: true });
}
