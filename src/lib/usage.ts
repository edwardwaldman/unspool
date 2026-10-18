import { adminClient } from "./supabase/admin";

export type UsageKind = "upload" | "retry";
/** What the 24h limit counts by: this user, this user or this IP, or this document. */
export type UsageScope = "user" | "user_or_ip" | "document";

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
