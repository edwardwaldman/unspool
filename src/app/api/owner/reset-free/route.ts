import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Owner-only: forget the owner's own uploads in the ledger, so the 1-free-document limit can be tested again. */
export async function POST() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.isOwner || !viewer.realUserId) return error(404, "Not found");
  const { error: delErr, count } = await adminClient()
    .from("usage_events")
    .delete({ count: "exact" })
    .eq("kind", "upload")
    .eq("user_id", viewer.realUserId);
  if (delErr) return error(500, "Couldn't reset it");
  return json({ ok: true, removed: count ?? 0 });
}
