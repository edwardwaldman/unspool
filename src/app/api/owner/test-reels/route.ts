import { supabaseConfigured } from "@/lib/config";
import type { DocumentRow } from "@/lib/db-types";
import { error, json, notConfigured } from "@/lib/http";
import { queueRemainingReels } from "@/lib/pipeline";
import { adminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Owner test mode: documents uploaded from the owner panel make reel 1 only, then one more reel each time the
// owner asks, so reel quality can be checked one reel at a time without generating whole documents.

async function owner() {
  const viewer = await getViewer();
  return viewer.isOwner && viewer.realUserId ? viewer.realUserId : null;
}

/** The owner's recent test documents and where each stands. */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const userId = await owner();
  if (!userId) return error(404, "Not found");
  const db = adminClient();
  const { data: docs } = await db
    .from("documents")
    .select("id,file_name,title,status,reel_count,credit_reels,created_at")
    .eq("user_id", userId)
    .eq("test_mode", true)
    .order("created_at", { ascending: false })
    .limit(12);
  const ids = (docs ?? []).map((d) => d.id);
  const { data: reels } = ids.length ? await db.from("reels").select("document_id,index,status").in("document_id", ids) : { data: [] };
  return json({
    docs: (docs ?? []).map((d) => {
      const rs = (reels ?? []).filter((r) => r.document_id === d.id);
      return {
        id: d.id,
        name: d.title ?? d.file_name,
        status: d.status,
        total: d.reel_count ?? rs.length,
        made: rs.filter((r) => r.status === "ready").length,
        making: rs.some((r) => r.status === "generating" || (r.status === "pending" && r.index <= (d.credit_reels ?? 1))),
        allowed: d.credit_reels ?? 1,
        createdAt: d.created_at,
      };
    }),
  });
}

/** Make the next reel of a test document: { documentId }. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  const userId = await owner();
  if (!userId) return error(404, "Not found");
  const { documentId } = ((await req.json().catch(() => ({}))) as { documentId?: string }) ?? {};
  if (!documentId) return error(400, "documentId required");
  const db = adminClient();
  const { data: doc } = await db
    .from("documents")
    .select("id,user_id,test_mode,credit_reels,reel_count,status")
    .eq("id", documentId)
    .maybeSingle<Pick<DocumentRow, "id" | "user_id" | "test_mode" | "credit_reels" | "reel_count" | "status">>();
  if (!doc || doc.user_id !== userId || !doc.test_mode) return error(404, "Not found");
  const total = doc.reel_count ?? 0;
  const next = (doc.credit_reels ?? 1) + 1;
  if (!total || next > total) return error(400, "Every reel of this document is already made");
  await db.from("documents").update({ credit_reels: next, ...(doc.status === "ready" ? { status: "scripting" } : {}) }).eq("id", doc.id);
  await queueRemainingReels(doc.id, { pendingOnly: true });
  return json({ ok: true, allowed: next });
}
