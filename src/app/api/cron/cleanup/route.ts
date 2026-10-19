import { LIMITS } from "@/lib/config";
import { error, json } from "@/lib/http";
import { secretMatches } from "@/lib/jobs";
import { deleteDocument } from "@/lib/spool";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Daily (vercel.json cron): delete anonymous uploads that were never unlocked after 7 days, and old visits. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !secretMatches(req.headers.get("authorization"), `Bearer ${secret}`)) {
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
  // Rate-limit ledger: only the last 24h is ever counted.
  // Usage log: rows go after 3 days, except an account's upload rows, which are what enforce "one free document
  // per account". Those are kept for the life of the account but stripped of the hashed IP and document link.
  const usageCutoff = new Date(Date.now() - 3 * 864e5).toISOString();
  await adminClient().from("usage_events").delete().lt("created_at", usageCutoff).or("kind.neq.upload,user_id.is.null");
  await adminClient().from("usage_events").update({ ip_hash: null, document_id: null }).lt("created_at", usageCutoff).eq("kind", "upload").not("user_id", "is", null);
  // Visit log (raw IPs): kept 90 days, as the privacy policy says.
  await adminClient().from("visits").delete().lt("started_at", new Date(Date.now() - 90 * 864e5).toISOString());
  return json({ deleted: data?.length ?? 0 });
}
