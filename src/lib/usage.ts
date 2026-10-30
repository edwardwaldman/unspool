import { adminClient } from "./supabase/admin";

export type UsageKind = "upload" | "retry";
/** What the 24h limit counts by: this user, this user or this IP (first_user_or_ip: and only if the user has never uploaded), or this document. */
export type UsageScope = "user" | "user_or_ip" | "first_user_or_ip" | "document";

/**
 * Atomically record one use if under the rolling 24h limit (public.claim_usage, see migrations).
 * Returns true when allowed and recorded, false when over the limit, null when the check itself
 * failed - callers must treat null as "deny" so a database hiccup never lifts the limit.
 */
export async function claimUsage(opts: {
  kind: UsageKind;
  scope: UsageScope;
  limit: number;
  userId?: string | null;
  ipHash?: string | null;
  documentId?: string | null;
}): Promise<boolean | null> {
  const { data, error } = await adminClient().rpc("claim_usage", {
    p_kind: opts.kind,
    p_scope: opts.scope,
    p_limit: opts.limit,
    p_user_id: opts.userId ?? null,
    p_ip_hash: opts.ipHash ?? null,
    p_document_id: opts.documentId ?? null,
  });
  if (error || typeof data !== "boolean") {
    console.error("[usage] claim_usage failed", error);
    return null;
  }
  return data;
}

/**
 * Give back the upload a document used when the file itself couldn't be read (nothing was made from it), so a
 * blurry photo doesn't burn a free account's one document. Capped at 3 refunds a day so unreadable files can't be
 * sent over and over for free OCR.
 */
export async function refundUnreadableUpload(userId: string) {
  const db = adminClient();
  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await db.from("documents").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "failed").gte("created_at", since);
  if ((count ?? 0) > 3) return;
  const { data } = await db.from("usage_events").select("id").eq("kind", "upload").eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
  if (data?.[0]) await db.from("usage_events").delete().eq("id", data[0].id);
}

/** Whether this account has ever uploaded a document (free accounts get one). */
export async function freeDocumentUsed(userId: string) {
  const { count } = await adminClient().from("usage_events").select("id", { count: "exact", head: true }).eq("kind", "upload").eq("user_id", userId);
  return (count ?? 0) > 0;
}
