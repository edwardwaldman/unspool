import { after } from "next/server";
import { error } from "@/lib/http";
import { isJobRequest } from "@/lib/jobs";
import { generateReel } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
// Node runtime: the reel job may run ffmpeg (video render) after the voiceover.
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isJobRequest(req)) return error(401, "unauthorized");
  const { reelId } = ((await req.json().catch(() => ({}))) ?? {}) as { reelId?: unknown };
  if (typeof reelId !== "string" || !/^[0-9a-f-]{36}$/i.test(reelId)) return error(400, "bad job");
  after(() => generateReel(reelId));
  return new Response(null, { status: 202 });
}
