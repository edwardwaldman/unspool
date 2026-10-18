import { supabaseConfigured } from "@/lib/config";
import { tierOf } from "@/lib/credits";
import { error, json, notConfigured } from "@/lib/http";
import { dispatch } from "@/lib/jobs";
import { loadReelWithDoc, ownerCanPlay } from "@/lib/shares";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Each edit rewrites and re-voices a whole reel, so it's capped: per reel, and per account per day.
const PER_REEL = 3;
const PER_DAY = { free: 1, paid: 10 };
const MAX_LEN = 300;

/** Owner-only: rewrite one reel the way they ask. Body: { request: string }. The reel keeps playing its old version until the new one is ready. */
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
  const since = new Date(Date.now() - 864e5).toISOString();
  const [{ count: onReel }, { count: today }] = await Promise.all([
    db.from("reel_edits").select("id", { count: "exact", head: true }).eq("reel_id", reel.id),
    db.from("reel_edits").select("id", { count: "exact", head: true }).eq("user_id", viewer.userId).gte("created_at", since),
  ]);
  if ((onReel ?? 0) >= PER_REEL) return error(429, `Each reel can be edited ${PER_REEL} times`);
  const daily = tierOf(viewer.profile) === "free" ? PER_DAY.free : PER_DAY.paid;
  if ((today ?? 0) >= daily) return error(429, daily === 1 ? "Free accounts get 1 edit a day. Upgrade for more." : "That's today's edits. Try again tomorrow.");

  // Claim the reel only if it's still ready (no double edits).
  const { data: claimed } = await db
    .from("reels")
    .update({ status: "pending", edit_request: request, attempts: 0, error: null })
    .eq("id", reel.id)
    .eq("status", "ready")
    .select("id")
    .maybeSingle();
  if (!claimed) return error(409, "This reel is already being updated");
  await db.from("reel_edits").insert({ reel_id: reel.id, user_id: viewer.userId, request });
  await dispatch({ name: "reel", reelId: reel.id });
  return json({ ok: true }, { status: 202 });
}
