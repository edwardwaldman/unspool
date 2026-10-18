import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { loadReelWithDoc, newSlug, ownerCanPlay, SHARE_DAILY_LIMIT, toSummary, type ShareRow } from "@/lib/shares";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Owner-only: the reel and its document, or an error response. */
async function authorize(reelId: string) {
  const viewer = await getViewer();
  if (!viewer.userId) return { res: error(401, "Sign in to share reels") };
  const found = await loadReelWithDoc(reelId);
  // 404 for someone else's reel too, so ids don't leak.
  if (!found || found.doc.user_id !== viewer.userId) return { res: error(404, "Not found") };
  return { ...found, viewer };
}

/** The owner's active share links for this reel (views + revoke in the workbench). */
export async function GET(_req: Request, ctx: RouteContext<"/api/reels/[id]/share">) {
  if (!supabaseConfigured) return notConfigured();
  const a = await authorize((await ctx.params).id);
  if (a.res) return a.res;
  const { data } = await adminClient()
    .from("reel_shares")
    .select("*")
    .eq("reel_id", a.reel.id)
    .eq("user_id", a.viewer.userId!)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return json({ shares: ((data ?? []) as ShareRow[]).map(toSummary) });
}

/** Return the active share link for this reel, or create one. Body: { showTitle?: boolean }. */
export async function POST(req: Request, ctx: RouteContext<"/api/reels/[id]/share">) {
  if (!supabaseConfigured) return notConfigured();
  const a = await authorize((await ctx.params).id);
  if (a.res) return a.res;
  const body = (await req.json().catch(() => ({}))) as { showTitle?: unknown };
  const showTitle = typeof body.showTitle === "boolean" ? body.showTitle : undefined;
  // Locked reels are never shareable: their script/audio/video must not become public.
  if (!(await ownerCanPlay(a.doc, a.reel, a.viewer))) return error(403, "Only reels you can play can be shared");

  const db = adminClient();
  const userId = a.viewer.userId!;
  const { data: existing } = await db
    .from("reel_shares")
    .select("*")
    .eq("reel_id", a.reel.id)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ShareRow>();
  if (existing) {
    if (showTitle !== undefined && showTitle !== existing.show_title) {
      await db.from("reel_shares").update({ show_title: showTitle }).eq("id", existing.id);
      existing.show_title = showTitle;
    }
    return json({ share: toSummary(existing) });
  }

  const since = new Date(Date.now() - 864e5).toISOString();
  const { count, error: countErr } = await db.from("reel_shares").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  if (countErr) return error(503, "Couldn't create a link right now");
  if ((count ?? 0) >= SHARE_DAILY_LIMIT) return error(429, "That's a lot of links today. Try again tomorrow.");

  for (let attempt = 0; attempt < 3; attempt++) {
    const row = { id: newSlug(), reel_id: a.reel.id, document_id: a.doc.id, user_id: userId, show_title: showTitle ?? true };
    const { data, error: insErr } = await db.from("reel_shares").insert(row).select("*").single<ShareRow>();
    if (data) return json({ share: toSummary(data) }, { status: 201 });
    if (insErr?.code !== "23505") break; // only retry slug collisions
  }
  return error(500, "Couldn't create a link");
}

/** Revoke one link (?slug=) or every active link for this reel. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/reels/[id]/share">) {
  if (!supabaseConfigured) return notConfigured();
  const a = await authorize((await ctx.params).id);
  if (a.res) return a.res;
  const slug = new URL(req.url).searchParams.get("slug");
  let q = adminClient()
    .from("reel_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("reel_id", a.reel.id)
    .eq("user_id", a.viewer.userId!)
    .is("revoked_at", null);
  if (slug) q = q.eq("id", slug);
  const { error: e } = await q;
  if (e) return error(500, "Couldn't revoke");
  return json({ ok: true });
}
