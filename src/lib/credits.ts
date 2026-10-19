import type { DocumentRow } from "./db-types";
import { FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS, TOPUP, TRIAL, type Tier } from "./plans";
import type { UsageDTO } from "./spool-types";
import { adminClient } from "./supabase/admin";
import { isSubscribed, type Profile } from "./viewer";

// Server-side credit accounting. All checks and writes happen in SQL (claim_credits, claim_free_reel,
// refund_reel_credit) under a per-subject advisory lock; this file only resolves who pays and how much.

export type Entitlement = {
  tier: Tier;
  trialing: boolean;
  trialEndsAt: string | null;
  /** Ledger subject: 'u:<user id>' (or 'ip:<hash>' for documents without an owner). */
  subject: string;
  /** Credits for the current billing period (weekly on paid tiers; 0 on free). */
  allowance: number;
  periodStart: string;
  resetsAt: string;
};

const monthStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
const nextMonthStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
/** Monday 00:00 UTC of this week: the fallback period for a paid profile whose period isn't synced yet. */
const weekStart = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));

export function tierOf(profile: Profile | null): Tier {
  if (!isSubscribed(profile)) return "free";
  const t = profile!.tier;
  return t && t !== "free" ? t : "plus"; // the old single subscription is Plus
}

export function entitlementFor(profile: Profile | null, fallbackSubject?: string | null): Entitlement {
  const tier = tierOf(profile);
  const subject = profile ? `u:${profile.id}` : fallbackSubject ?? "ip:unknown";
  const trialing = tier !== "free" && profile?.subscription_status === "trialing";
  if (tier === "free" || !profile?.current_period_start) {
    return {
      tier,
      trialing,
      trialEndsAt: trialing ? profile?.current_period_end ?? null : null,
      subject,
      allowance: trialing ? TRIAL.maxReels : PLANS[tier].credits,
      periodStart: (tier === "free" ? monthStart() : weekStart()).toISOString(),
      resetsAt:
        (tier !== "free" && profile?.current_period_end) ||
        (tier === "free" ? nextMonthStart() : new Date(weekStart().getTime() + 7 * 864e5)).toISOString(),
    };
  }
  // Yearly plans: the paid period is a year, but credits reset every 7 days from its start.
  if (profile.billing_interval === "year") {
    const start = new Date(profile.current_period_start).getTime();
    const week = 7 * 864e5;
    const sliceStart = start + Math.max(0, Math.floor((Date.now() - start) / week)) * week;
    return {
      tier,
      trialing,
      trialEndsAt: null,
      subject,
      allowance: PLANS[tier].credits,
      periodStart: new Date(sliceStart).toISOString(),
      resetsAt: new Date(sliceStart + week).toISOString(),
    };
  }
  return {
    tier,
    trialing,
    trialEndsAt: trialing ? profile.current_period_end : null,
    subject,
    // During the 1-day trial the user gets Plus limits, capped so a trial can't be farmed.
    allowance: trialing ? Math.min(TRIAL.maxReels, PLANS[tier].credits) : PLANS[tier].credits,
    periodStart: new Date(profile.current_period_start).toISOString(),
    resetsAt: profile.current_period_end ?? nextMonthStart().toISOString(),
  };
}

/** The ledger subject that pays for a document. */
export const subjectForDoc = (doc: Pick<DocumentRow, "user_id" | "ip_hash">) =>
  doc.user_id ? `u:${doc.user_id}` : `ip:${doc.ip_hash ?? "unknown"}`;

export async function ownerEntitlement(doc: Pick<DocumentRow, "user_id" | "ip_hash">): Promise<Entitlement> {
  if (!doc.user_id) return entitlementFor(null, subjectForDoc(doc));
  const { data } = await adminClient().from("profiles").select("*").eq("id", doc.user_id).maybeSingle<Profile>();
  return entitlementFor(data ?? null, subjectForDoc(doc));
}

/** What the usage meter shows. */
export async function usageFor(ent: Entitlement, profile: Profile | null): Promise<UsageDTO> {
  const db = adminClient();
  const [{ data: bal }, { data: freeUsed }] = await Promise.all([
    db.rpc("credit_balance", { p_subject: ent.subject, p_period_start: ent.periodStart }),
    db.rpc("free_reels_used", { p_subject: ent.subject }),
  ]);
  const row = (Array.isArray(bal) ? bal[0] : bal) as { used?: number; topup?: number } | null;
  const used = Math.max(0, row?.used ?? 0);
  return {
    tier: ent.tier,
    trialing: ent.trialing,
    trialEndsAt: ent.trialEndsAt,
    trialEligible: Boolean(profile) && !profile?.trial_used && ent.tier === "free",
    allowance: ent.allowance,
    used,
    left: Math.max(0, ent.allowance - used),
    topup: Math.max(0, row?.topup ?? 0),
    resetsAt: ent.resetsAt,
    freeUsedToday: typeof freeUsed === "number" ? freeUsed : 0,
    freePerDay: FREE_REELS_PER_DAY,
    freeIntervalMin: FREE_REEL_INTERVAL_MIN,
    prices: {
      plus: { cents: PLANS.plus.priceCents, credits: PLANS.plus.credits },
      pro: { cents: PLANS.pro.priceCents, credits: PLANS.pro.credits },
      ultra: { cents: PLANS.ultra.priceCents, credits: PLANS.ultra.credits },
    },
    topupCents: TOPUP.priceCents,
    topupCredits: TOPUP.credits,
  };
}

/**
 * Pay for a freshly planned document: paid tiers reserve one credit per planned reel (as many as they
 * have); free accounts get reel 1 from the daily free allowance. Returns how many reels are funded.
 */
export async function fundPlannedDocument(documentId: string, ent: Entitlement, planned: number): Promise<number> {
  const db = adminClient();
  if (ent.tier === "free") {
    const { data, error } = await db.rpc("claim_free_reel", {
      p_subject: ent.subject,
      p_document_id: documentId,
      p_daily_limit: FREE_REELS_PER_DAY,
      p_interval_min: FREE_REEL_INTERVAL_MIN,
      p_first: true,
    });
    if (error) console.error("[credits] claim_free_reel failed", error);
    return data === "ok" ? 1 : 0;
  }
  const { data, error } = await db.rpc("claim_credits", {
    p_subject: ent.subject,
    p_document_id: documentId,
    p_requested: planned,
    p_allowance: ent.allowance,
    p_period_start: ent.periodStart,
  });
  if (error) console.error("[credits] claim_credits failed", error);
  return typeof data === "number" ? data : 0;
}

export type UnlockResult = { status: "ok" | "wait" | "cap" | "done" | "none" | "error"; granted: number };

/** Unlock the next free reel of a document (30-minute timer, daily cap). Generates it on demand. */
export async function unlockFreeReel(doc: DocumentRow, ent: Entitlement): Promise<UnlockResult> {
  const { data, error } = await adminClient().rpc("claim_free_reel", {
    p_subject: ent.subject,
    p_document_id: doc.id,
    p_daily_limit: FREE_REELS_PER_DAY,
    p_interval_min: FREE_REEL_INTERVAL_MIN,
    p_first: false,
  });
  if (error || typeof data !== "string") {
    console.error("[credits] claim_free_reel failed", error);
    return { status: "error", granted: 0 };
  }
  if (data !== "ok") return { status: data as UnlockResult["status"], granted: 0 };
  await queueFunded(doc.id);
  return { status: "ok", granted: 1 };
}

/** Spend credits (this period's allowance, then top-ups) on the rest of a document's reels. */
export async function unlockWithCredits(doc: Pick<DocumentRow, "id" | "reel_count" | "credit_reels">, ent: Entitlement): Promise<UnlockResult> {
  const want = Math.max(0, (doc.reel_count ?? 0) - (doc.credit_reels ?? 0));
  if (!want) return { status: "done", granted: 0 };
  const { data, error } = await adminClient().rpc("claim_credits", {
    p_subject: ent.subject,
    p_document_id: doc.id,
    p_requested: want,
    p_allowance: ent.tier === "free" ? 0 : ent.allowance,
    p_period_start: ent.periodStart,
  });
  if (error || typeof data !== "number") {
    console.error("[credits] claim_credits failed", error);
    return { status: "error", granted: 0 };
  }
  if (data > 0) await queueFunded(doc.id);
  return { status: data > 0 ? "ok" : "none", granted: data };
}

async function queueFunded(documentId: string) {
  const db = adminClient();
  await db.from("documents").update({ status: "scripting" }).eq("id", documentId).eq("status", "ready");
  const { queueRemainingReels } = await import("./pipeline");
  await queueRemainingReels(documentId, { includeFirst: true });
}

/** Give back a reel's credit once it has failed for good. Idempotent. */
export async function refundReel(reelId: string) {
  const { error } = await adminClient().rpc("refund_reel_credit", { p_reel_id: reelId });
  if (error) console.error("[credits] refund_reel_credit failed", reelId, error);
}

/** The client view of the viewer, with their usage meter. */
export async function viewerDTO(viewer: import("./viewer").Viewer): Promise<import("./spool-types").ViewerDTO> {
  const usage = viewer.userId ? await usageFor(entitlementFor(viewer.profile), viewer.profile).catch(() => null) : null;
  return { signedIn: Boolean(viewer.userId), email: viewer.email, subscribed: viewer.subscribed, usage };
}
