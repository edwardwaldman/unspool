import { after } from "next/server";
import { error } from "@/lib/http";
import { jobSecret } from "@/lib/jobs";
import { processDocument } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (req.headers.get("x-job-secret") !== jobSecret()) return error(401, "unauthorized");
  const { documentId } = (await req.json()) as { documentId: string };
  after(() => processDocument(documentId));
  return new Response(null, { status: 202 });
}
