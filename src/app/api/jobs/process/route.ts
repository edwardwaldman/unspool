import { after } from "next/server";
import { error } from "@/lib/http";
import { isJobRequest } from "@/lib/jobs";
import { processDocument } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!isJobRequest(req)) return error(401, "unauthorized");
  const { documentId } = ((await req.json().catch(() => ({}))) ?? {}) as { documentId?: unknown };
  if (typeof documentId !== "string" || !/^[0-9a-f-]{36}$/i.test(documentId)) return error(400, "bad job");
  after(() => processDocument(documentId));
  return new Response(null, { status: 202 });
}
