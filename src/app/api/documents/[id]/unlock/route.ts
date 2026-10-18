import { loadDocument } from "@/lib/access";
import { entitlementFor, unlockFreeReel, unlockWithCredits, usageFor } from "@/lib/credits";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Unlock more reels of a document. mode "free": the next free reel once its 30-minute timer is up
 * (free tier, max per day), generated on demand. mode "credits": spend monthly or top-up credits on
 * every locked reel. All checks are atomic in SQL; the client only asks.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/documents/[id]/unlock">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in to continue.", { code: "auth" });
  const doc = await loadDocument(id, viewer);
  if (!doc) return error(404, "Not found");
  if (!doc.reel_count) return error(409, "This document is still being planned.");
  const body = (await req.json().catch(() => ({}))) as { mode?: string };
  const ent = entitlementFor(viewer.profile);

  const result = body.mode === "credits" || ent.tier !== "free" ? await unlockWithCredits(doc, ent) : await unlockFreeReel(doc, ent);
  const usage = await usageFor(ent, viewer.profile).catch(() => null);
  if (result.status === "error") return error(503, "Couldn't unlock right now. Try again in a minute.");
  return json({ ...result, usage });
}
