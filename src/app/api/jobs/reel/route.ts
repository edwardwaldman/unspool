import { after } from "next/server";
import { error } from "@/lib/http";
import { jobSecret } from "@/lib/jobs";
import { generateReel } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
// Node runtime: the reel job may run ffmpeg (video render) after the voiceover.
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (req.headers.get("x-job-secret") !== jobSecret()) return error(401, "unauthorized");
  const { reelId } = (await req.json()) as { reelId: string };
  after(() => generateReel(reelId));
  return new Response(null, { status: 202 });
}
