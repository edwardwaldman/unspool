import { supabaseConfigured } from "@/lib/config";
import { entitlementFor, usageFor } from "@/lib/credits";
import { error, json, notConfigured } from "@/lib/http";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** The signed-in account's credits right now (the Studio counter polls this). */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in first");
  const usage = await usageFor(entitlementFor(viewer.profile), viewer.profile).catch(() => null);
  if (!usage) return error(503, "Couldn't load your credits.");
  return json({ usage }, { headers: { "Cache-Control": "no-store" } });
}
