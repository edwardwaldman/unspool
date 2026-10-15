import { loadDocument } from "@/lib/access";
import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { dispatch } from "@/lib/jobs";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Called by the browser once the file is in storage: start unspooling. */
export async function POST(_req: Request, ctx: RouteContext<"/api/documents/[id]/start">) {
  if (!supabaseConfigured) return notConfigured();
  const { id } = await ctx.params;
  const viewer = await getViewer();
  const doc = await loadDocument(id, viewer);
  if (!doc) return error(404, "Not found");
  if (doc.status !== "uploading") return json({ ok: true });

  const db = adminClient();
  const folder = await db.storage.from("documents").list(id);
  if (!folder.data?.some((f) => `${id}/${f.name}` === doc.file_path)) return error(400, "Upload not found. Try again.");

  await db.from("documents").update({ status: "uploaded" }).eq("id", id).eq("status", "uploading");
  await dispatch({ name: "process", documentId: id });
  return json({ ok: true });
}
