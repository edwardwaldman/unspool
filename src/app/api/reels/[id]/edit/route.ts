import { supabaseConfigured } from "@/lib/config";
import { entitlementFor } from "@/lib/credits";
import { error, json, notConfigured } from "@/lib/http";
import { dispatch } from "@/lib/jobs";
import { loadReelWithDoc, ownerCanPlay } from "@/lib/shares";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const MAX_LEN = 300;

/** Owner-only: rewrite one reel the way they ask. Body: { request: string }. Costs one credit (this period's allowance, then top-ups), refunded if the edit fails. */
export async function POST(req: Request, ctx: RouteContext<"/api/reels/[id]/edit">) {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in to edit reels");
  const found = await loadReelWithDoc((await ctx.params).id);
  if (!found || found.doc.user_id !== viewer.userId) return error(404, "Not found");
  const { reel, doc } = found;

  const body = (await req.json().catch(() => ({}))) as { request?: unknown };
  const request = typeof body.request === "string" ? body.request.replace(/\s+/g, " ").trim() : "";
  if (request.length < 3) return error(400, "Say what you'd like changed");
  if (request.length > MAX_LEN) return error(400, `Keep it under ${MAX_LEN} characters`);
  if (!(await ownerCanPlay(doc, reel, viewer))) return error(403, "Only reels you can play can be edited");

  const db = adminClient();
  // Claim the reel only if it's still ready (no double edits).
  const { data: claimed } = await db
    .from("reels")
    .update({ status: "pending", edit_request: request, attempts: 0, error: null })
    .eq("id", reel.id)
    .eq("status", "ready")
    .select("id")
    .maybeSingle();
  if (!claimed) return error(409, "This reel is already being updated");
  const ent = entitlementFor(viewer.profile);
  const { data: paid, error: rpcErr } = await db.rpc("claim_edit_credit", {
    p_subject: ent.subject,
    p_reel_id: reel.id,
    p_document_id: doc.id,
    p_allowance: ent.tier === "free" ? 0 : ent.allowance,
    p_period_start: ent.periodStart,
  });
  if (rpcErr || paid !== true) {
    await db.from("reels").update({ status: "ready", edit_request: null }).eq("id", reel.id);
    if (rpcErr) console.error("[edit] claim_edit_credit failed", rpcErr);
    return error(402, ent.tier === "free" ? "Edits cost 1 credit. Upgrade or buy a top-up to edit reels." : "You're out of credits. Top up to keep editing.");
  }
  await db.from("reel_edits").insert({ reel_id: reel.id, user_id: viewer.userId, request });
  await dispatch({ name: "reel", reelId: reel.id });
  return json({ ok: true }, { status: 202 });
}
