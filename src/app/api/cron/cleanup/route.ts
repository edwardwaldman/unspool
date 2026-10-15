import { LIMITS } from "@/lib/config";
import { error, json } from "@/lib/http";
import { deleteDocument } from "@/lib/spool";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Daily (vercel.json cron): delete anonymous uploads that were never unlocked after 7 days. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}` || !process.env.CRON_SECRET) {
    return error(401, "unauthorized");
  }
  const cutoff = new Date(Date.now() - LIMITS.anonymousRetentionDays * 864e5).toISOString();
  const { data } = await adminClient()
    .from("documents")
    .select("id,file_path")
    .is("user_id", null)
    .eq("unlocked", false)
    .lt("created_at", cutoff)
    .limit(200);
  for (const doc of data ?? []) await deleteDocument(doc);
  return json({ deleted: data?.length ?? 0 });
}
