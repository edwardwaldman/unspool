// Every pricing tier in one place. Prices can be overridden with env vars (cents); Stripe price ids
// with STRIPE_PRICE_PLUS / STRIPE_PRICE_PRO / STRIPE_PRICE_ULTRA (else prices are created on demand).
//
// Paid tiers bill weekly and are measured in weekly reel credits (reset on the Stripe subscription period): 1 credit = 1 generated reel, and a document reserves
// as many credits as reels planned. Free accounts don't get credits: reel 1 of each document is free,
// then the next reel unlocks every FREE_REEL_INTERVAL_MIN minutes, up to FREE_REELS_PER_DAY a day.

export type Tier = "free" | "plus" | "pro" | "ultra";
export const TIERS: Tier[] = ["free", "plus", "pro", "ultra"];
export const PAID_TIERS: Exclude<Tier, "free">[] = ["plus", "pro", "ultra"];

const cents = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : fallback;
};

export type PlanDef = {
  tier: Tier;
  name: string;
  /** Price per billing period (BILLING_INTERVAL) in cents (0 for free). */
  priceCents: number;
  /** Reel credits per billing period (0 for free: free reels come from the drip instead). */
  credits: number;
  maxPages: number;
  watermark: boolean;
  priority: boolean;
  /** Longer reels (~45-90 s instead of ~30-60 s). */
  longReels: boolean;
  /** Early access to new features. */
  earlyAccess?: boolean;
  /** Env var holding a fixed Stripe price id for this tier, if any. */
  priceEnv?: string;
};

export const PLANS: Record<Tier, PlanDef> = {
  free: { tier: "free", name: "Free", priceCents: 0, credits: 0, maxPages: 20, watermark: true, priority: false, longReels: false },
  plus: {
    tier: "plus",
    name: "Plus",
    priceCents: cents("PRICE_PLUS_CENTS", 399),
    credits: 40,
    maxPages: 60,
    watermark: false,
    priority: false,
    longReels: false,
    priceEnv: "STRIPE_PRICE_PLUS",
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceCents: cents("PRICE_PRO_CENTS", 599),
    credits: 125,
    maxPages: 150,
    watermark: false,
    priority: true,
    longReels: true,
    priceEnv: "STRIPE_PRICE_PRO",
  },
  ultra: {
    tier: "ultra",
    name: "Ultra",
    priceCents: cents("PRICE_ULTRA_CENTS", 2299),
    credits: 750,
    maxPages: 300,
    watermark: false,
    priority: true,
    longReels: true,
    earlyAccess: true,
    priceEnv: "STRIPE_PRICE_ULTRA",
  },
};

/** The free drip. */
export const FREE_FIRST_REELS = 1;
export const FREE_REEL_INTERVAL_MIN = Number(process.env.FREE_REEL_INTERVAL_MIN ?? 30);
export const FREE_REELS_PER_DAY = Number(process.env.FREE_REELS_PER_DAY ?? 5);

/** One-time top-up pack, any tier. Credits never expire. */
export const TOPUP = { priceCents: cents("PRICE_TOPUP_CENTS", 249), credits: 20 };

/** The 1-day Plus trial (one per account, card required). */
export const TRIAL = { tier: "plus" as const, days: 1, maxReels: 30 };

export const CURRENCY = "usd";

/** Every paid tier bills on this Stripe recurring interval; credits reset on the subscription period. */
export const BILLING_INTERVAL = "week" as const;

/** "≈ $17/month" for a weekly price (52 weeks / 12 months). */
export function approxMonthly(c: number) {
  return `≈ $${Math.round((c * 52) / 12 / 100)}/month`;
}

export function isTier(v: unknown): v is Tier {
  return typeof v === "string" && (TIERS as string[]).includes(v);
}

/** The tier above this one, or null at the top. */
export function nextTier(tier: Tier): Exclude<Tier, "free"> | null {
  const i = TIERS.indexOf(tier);
  return i >= 0 && i < TIERS.length - 1 ? (TIERS[i + 1] as Exclude<Tier, "free">) : null;
}

/** Words the planner reads for a tier: the old 40k cap, more for bigger page limits. */
export function maxWordsFor(tier: Tier) {
  return Math.max(40_000, PLANS[tier].maxPages * 400);
}

export function formatCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}
