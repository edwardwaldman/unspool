import { viewerDTO } from "@/lib/credits";
import { loadDocument } from "@/lib/access";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { buildSpool, deleteDocument } from "@/lib/spool";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const doc = await loadDocument(id, viewer);
  if (!doc) return error(404, "Not found");
  const spool = await buildSpool(doc, viewer, { heal: true });
  return json({ spool, viewer: await viewerDTO(viewer) });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const doc = await loadDocument(id, viewer);
  if (!doc) return error(404, "Not found");
  await deleteDocument(doc);
  return json({ ok: true });
}
