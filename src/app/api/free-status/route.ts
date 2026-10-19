import { supabaseConfigured } from "@/lib/config";
import { json } from "@/lib/http";
import { appSettings } from "@/lib/settings";
import { freeDocumentUsed } from "@/lib/usage";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Whether to show the "you've used your free document" banner. */
export async function GET() {
  if (!supabaseConfigured) return json({ used: false });
  const viewer = await getViewer();
  if (!viewer.userId || viewer.subscribed || viewer.ownerUnlimited) return json({ used: false });
  if ((await appSettings()).openAccess) return json({ used: false });
  return json({ used: await freeDocumentUsed(viewer.userId) });
}
