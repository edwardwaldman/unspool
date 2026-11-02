import { error, json } from "@/lib/http";
import { checkRecordToken } from "@/lib/record-token";
import { finishDownload } from "@/lib/reel-download";

export const dynamic = "force-dynamic";

/** The recorder reports back: { ok: true } once the MP4 is uploaded, or { ok: false, error }. Signed per reel. */
export async function POST(req: Request, ctx: RouteContext<"/api/reels/[id]/download/done">) {
  const id = (await ctx.params).id;
  if (!checkRecordToken(id, new URL(req.url).searchParams.get("token") ?? undefined)) return error(401, "unauthorized");
  const body = (await req.json().catch(() => ({}))) as { ok?: unknown; error?: unknown };
  await finishDownload(id, body.ok === true, typeof body.error === "string" ? body.error : undefined);
  return json({ ok: true });
}
