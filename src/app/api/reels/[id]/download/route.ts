import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { downloadState, requestDownload } from "@/lib/reel-download";
import { loadReelWithDoc, ownerCanPlay } from "@/lib/shares";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Owner-only, and only reels they can play: the reel and its document, or an error response. */
async function authorize(reelId: string) {
  const viewer = await getViewer();
  if (!viewer.userId) return { res: error(401, "Sign in to download reels") };
  const found = await loadReelWithDoc(reelId);
  if (!found || found.doc.user_id !== viewer.userId) return { res: error(404, "Not found") };
  if (found.reel.status !== "ready" || !(await ownerCanPlay(found.doc, found.reel, viewer))) return { res: error(403, "Unlock this reel to download it") };
  return { reelId: found.reel.id };
}

/** Where the download stands (the button polls this while it records). */
export async function GET(_req: Request, ctx: RouteContext<"/api/reels/[id]/download">) {
  if (!supabaseConfigured) return notConfigured();
  const a = await authorize((await ctx.params).id);
  if ("res" in a) return a.res;
  return json(await downloadState(a.reelId));
}

/** Start recording this reel as an MP4 (or return the one already made / in progress). */
export async function POST(req: Request, ctx: RouteContext<"/api/reels/[id]/download">) {
  if (!supabaseConfigured) return notConfigured();
  const a = await authorize((await ctx.params).id);
  if ("res" in a) return a.res;
  return json(await requestDownload(a.reelId, new URL(req.url).origin));
}
