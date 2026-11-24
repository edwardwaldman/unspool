import { aiStatus } from "@/lib/ai-status";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { ownerNeedsUnlock } from "@/lib/owner-passkey";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Owner-only: whether the AI keys work, what's left where the provider reports it, and links to top up. */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.isOwner || !viewer.realUserId) return error(404, "Not found");
  if (await ownerNeedsUnlock(viewer.realUserId)) return error(403, "Unlock the owner panel with Face ID.", { code: "locked" });
  return json(await aiStatus());
}
