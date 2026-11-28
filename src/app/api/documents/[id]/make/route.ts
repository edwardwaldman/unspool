import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { startQueued } from "@/lib/queue";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** The Ready button on a queued upload: start making it now, if its turn has come (src/lib/queue.ts). */
export async function POST(_req: Request, ctx: RouteContext<"/api/documents/[id]/make">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in first.", { code: "auth" });
  const res = await startQueued(viewer, id);
  return res.ok ? json({ ok: true }) : error(409, res.error);
}
