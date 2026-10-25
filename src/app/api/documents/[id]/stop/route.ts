import { loadDocument } from "@/lib/access";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { settleDocument } from "@/lib/pipeline";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const STOPPED = "Stopped. Tap retry to make it.";

/**
 * Stop making a document's reels: every paid reel still waiting or being written is marked stopped (failed,
 * with a retry). Credits stay spent, so Retry resumes them at no extra charge; reels already made are kept.
 */
export async function POST(_req: Request, ctx: RouteContext<"/api/documents/[id]/stop">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in to continue.", { code: "auth" });
  const doc = await loadDocument(id, viewer);
  if (!doc || doc.user_id !== viewer.userId) return error(404, "Not found");
  if (doc.status !== "scripting") return error(409, "There's nothing being made right now.");

  let q = adminClient()
    .from("reels")
    .update({ status: "failed", error: STOPPED, edit_request: null })
    .eq("document_id", id)
    .in("status", ["pending", "generating"]);
  // Locked reels (not paid for) stay locked rather than showing as stopped.
  if (!doc.unlocked) q = q.lte("index", doc.credit_reels ?? 0);
  const { data, error: e } = await q.select("id");
  if (e) return error(500, "Couldn't stop it. Try again.");
  await settleDocument(id);
  return json({ ok: true, stopped: data?.length ?? 0 });
}
