import { freeReelLimit, isUnlocked, loadDocument } from "@/lib/access";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { dispatch } from "@/lib/jobs";
import { queueRemainingReels } from "@/lib/pipeline";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: RouteContext<"/api/documents/[id]/retry">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const doc = await loadDocument(id, viewer);
  if (!doc) return error(404, "Not found");
  const db = adminClient();

  if (doc.status === "failed") {
    const { count } = await db.from("reels").select("id", { count: "exact", head: true }).eq("document_id", id);
    if (!count) {
      await dispatch({ name: "process", documentId: id });
      return json({ ok: true });
    }
    await db.from("documents").update({ status: "scripting", error: null }).eq("id", id);
  }
  // Re-queue failed reels the viewer can play (reel 1 plus any dripped free reels, or all when unlocked).
  const { data: failed } = await db.from("reels").select("id,index").eq("document_id", id).eq("status", "failed");
  const unlocked = isUnlocked(doc, viewer);
  const { playable } = freeReelLimit(doc, viewer);
  for (const r of failed ?? []) {
    if (r.index <= playable) await dispatch({ name: "reel", reelId: r.id });
  }
  if (unlocked) await queueRemainingReels(id);
  return json({ ok: true });
}
