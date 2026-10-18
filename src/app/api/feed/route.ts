import { viewerDTO } from "@/lib/credits";
import { supabaseConfigured } from "@/lib/config";
import { json, notConfigured } from "@/lib/http";
import { buildSpool, listDocuments } from "@/lib/spool";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** "All my spools": every document's viewable reels, newest document first. */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  const docs = (await listDocuments(viewer, 20)).filter((d) => d.status !== "failed" && d.status !== "uploading");
  const spools = await Promise.all(docs.map((d) => buildSpool(d, viewer)));
  return json({ spools, viewer: await viewerDTO(viewer) });
}
