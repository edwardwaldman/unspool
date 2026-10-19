import { supabaseConfigured } from "@/lib/config";
import { json } from "@/lib/http";
import { isOwnerEmail } from "@/lib/owner";
import { freeDocumentUsed } from "@/lib/usage";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Whether to show the "you've used your free document" banner. */
export async function GET() {
  if (!supabaseConfigured) return json({ used: false });
  const viewer = await getViewer();
  if (!viewer.userId || viewer.subscribed || isOwnerEmail(viewer.email)) return json({ used: false });
  return json({ used: await freeDocumentUsed(viewer.userId) });
}
