import "server-only";
import Stripe from "stripe";
import { entitlementFor, unlockWithCredits } from "./credits";
import { DOCUMENT_COLUMNS, type DocumentRow } from "./db-types";
import { BILLING_INTERVAL, CURRENCY, isTier, PAID_TIERS, PLANS, priceFor, TOPUP, type Billing, type Tier } from "./plans";
import { adminClient } from "./supabase/admin";
import type { Profile } from "./viewer";

let stripe: Stripe | null = null;

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export async function ensureCustomer(profile: Profile, email: string | null) {
  if (profile.stripe_customer_id) {
    // A customer from another Stripe account or mode (test vs live keys) or one deleted in the dashboard can't be
    // charged: make a fresh one instead of failing every checkout.
    try {
      const c = await getStripe().customers.retrieve(profile.stripe_customer_id);
      if (!("deleted" in c && c.deleted)) return profile.stripe_customer_id;
    } catch (err) {
      if ((err as { code?: string }).code !== "resource_missing") throw err;
    }
  }
  const customer = await getStripe().customers.create({
    email: email ?? profile.email ?? undefined,
    metadata: { user_id: profile.id },
  });
  await adminClient().from("profiles").update({ stripe_customer_id: customer.id }).eq("id", profile.id);
  return customer.id;
}

function periodEnd(sub: Stripe.Subscription): string | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter(Boolean);
  return ends.length ? new Date(Math.max(...ends) * 1000).toISOString() : null;
}

function periodStart(sub: Stripe.Subscription): string | null {
  const starts = sub.items.data.map((i) => i.current_period_start).filter(Boolean);
  return starts.length ? new Date(Math.max(...starts) * 1000).toISOString() : null;
}

const lookupKey = (tier: Exclude<Tier, "free">, billing: Billing) => `unspool_${tier}_${priceFor(tier, billing)}_${billing}`;
const envFor = (tier: Exclude<Tier, "free">, billing: Billing) => (billing === "year" ? `${PLANS[tier].priceEnv}_YEARLY` : PLANS[tier].priceEnv);

/**
 * The Stripe price id for a paid tier: STRIPE_PRICE_<TIER> when set, else a price found by lookup key,
 * else one created on the spot (same amount as PLANS, so plan switching in the portal can use it).
 */
export async function priceIdFor(tier: Exclude<Tier, "free">, billing: Billing = "week"): Promise<string> {
  const env = envFor(tier, billing);
  if (env && process.env[env]) return process.env[env]!;
  const stripe = getStripe();
  const key = lookupKey(tier, billing);
  const found = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const price = await stripe.prices.create({
    currency: CURRENCY,
    unit_amount: priceFor(tier, billing),
    recurring: { interval: billing },
    lookup_key: key,
    metadata: { tier, billing },
    product_data: { name: `Unspool ${PLANS[tier].name}${billing === "year" ? " (yearly)" : ""}`, metadata: { tier } },
  });
  return price.id;
}

/** Which tier a subscription price is. Unknown prices (the old $7.99 "Unspool Unlimited") are Plus. */
export function tierForPrice(price: Stripe.Price | null | undefined): Exclude<Tier, "free"> {
  if (!price) return "plus";
  for (const tier of PAID_TIERS) {
    for (const b of ["week", "year"] as const) {
      const env = envFor(tier, b);
      if (env && process.env[env] === price.id) return tier;
    }
  }
  const meta = price.metadata?.tier;
  if (isTier(meta) && meta !== "free") return meta;
  const key = /^unspool_(plus|pro|ultra)_/.exec(price.lookup_key ?? "")?.[1];
  if (isTier(key) && key !== "free") return key;
  // Matching amounts only count on the current interval: the legacy $7.99/month "Unspool Unlimited" is Plus.
  if (price.recurring?.interval === BILLING_INTERVAL) {
    const byAmount = PAID_TIERS.find((t) => PLANS[t].priceCents === price.unit_amount);
    if (byAmount) return byAmount;
  }
  if (price.recurring?.interval === "year") {
    const byAmount = PAID_TIERS.find((t) => PLANS[t].yearlyCents === price.unit_amount);
    if (byAmount) return byAmount;
  }
  return "plus";
}

/** Mirror a Stripe subscription onto the user's profile: status, tier and current period. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const tier = tierForPrice(sub.items.data[0]?.price);
  const update: Record<string, unknown> = {
    plan: active ? "sub" : "free",
    tier: active ? tier : "free",
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_start: periodStart(sub),
    current_period_end: periodEnd(sub),
    billing_interval: sub.items.data[0]?.price?.recurring?.interval === "year" ? "year" : "week",
  };
  if (sub.trial_start) update.trial_used = true;
  const db = adminClient();
  const userId = sub.metadata?.user_id;
  if (userId) await db.from("profiles").update({ ...update, stripe_customer_id: customerId }).eq("id", userId);
  else await db.from("profiles").update(update).eq("stripe_customer_id", customerId);
}

/** Idempotently grant whatever a completed Checkout Session paid for. */
export async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (session.status !== "complete" || !paid) return { fulfilled: false };

  const db = adminClient();
  const kind = session.metadata?.kind ?? "";
  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  const documentId = session.metadata?.document_id || null;

  // Legacy one-document unlock sessions (before credits) still fulfil if Stripe retries them.
  if (kind === "document" && documentId && userId) {
    await db.from("documents").update({ unlocked: true }).eq("id", documentId).eq("user_id", userId);
  }

  if (kind === "subscription" && session.subscription) {
    const sub =
      typeof session.subscription === "string"
        ? await getStripe().subscriptions.retrieve(session.subscription)
        : session.subscription;
    await syncSubscription(sub);
    await db.from("purchases").upsert(
      { user_id: userId, document_id: documentId, kind, stripe_session_id: session.id, amount: session.amount_total, currency: session.currency },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    );
  }

  if (kind === "topup" && userId) {
    // The ledger row is unique per Checkout Session, so a webhook retry can't add the pack twice.
    const credits = Number(session.metadata?.credits) || TOPUP.credits;
    const { error } = await db
      .from("credit_events")
      .insert({ subject: `u:${userId}`, kind: "topup", topup_delta: credits, stripe_session_id: session.id });
    if (error && error.code !== "23505") throw error;
    await db.from("purchases").upsert(
      { user_id: userId, document_id: documentId, kind, stripe_session_id: session.id, amount: session.amount_total, currency: session.currency },
      { onConflict: "stripe_session_id", ignoreDuplicates: true },
    );
  }

  // Back on a document: spend what's now available on its locked reels.
  if (documentId && userId) {
    const { data: doc } = await db
      .from("documents")
      .select(DOCUMENT_COLUMNS)
      .eq("id", documentId)
      .eq("user_id", userId)
      .maybeSingle<DocumentRow>();
    if (doc?.reel_count) {
      const { data: profile } = await db.from("profiles").select("*").eq("id", userId).maybeSingle<Profile>();
      await unlockWithCredits(doc, entitlementFor(profile ?? null));
    }
  }
  return { fulfilled: true, kind, documentId };
}
