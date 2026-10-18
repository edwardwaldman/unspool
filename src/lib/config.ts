// Central place for product knobs and environment lookups.

/** A document gets as many reels as it has distinct key ideas, within these bounds (the planner decides). */
export const MIN_REELS = 3;
export const MAX_REELS = 15;
export const FREE_REELS = 1;

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_WORDS = 40_000;
/** The largest page limit of any tier (per-tier limits live in src/lib/plans.ts). */
export const MAX_PAGES = 300;

export const ACCEPTED_EXTENSIONS = ["pdf", "docx", "pptx", "txt", "md", "png", "jpg", "jpeg", "webp"] as const;
export type AcceptedExtension = (typeof ACCEPTED_EXTENSIONS)[number];

export const LIMITS = {
  freeUploadsPerDay: Number(process.env.FREE_UPLOADS_PER_DAY ?? 3),
  subscriberUploadsPerDay: Number(process.env.SUBSCRIBER_UPLOADS_PER_DAY ?? 40),
  anonymousRetentionDays: 7,
  /** Retries (re-plan or re-generate) one document may trigger per 24 hours. */
  retriesPerDocumentPerDay: Number(process.env.RETRIES_PER_DOCUMENT_PER_DAY ?? 10),
  /** A reel that has failed this many generation attempts is not re-queued by a retry. */
  maxReelAttempts: Number(process.env.MAX_REEL_ATTEMPTS ?? 5),
};

// Reels are generated only once paid for (credits or the free drip); see src/lib/plans.ts.

export const ANON_COOKIE = "unspool_anon";
/** Which share link (slug) brought this browser here, for signup attribution. */
export const REF_COOKIE = "unspool_ref";

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function siteUrl(fallbackOrigin?: string) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (fallbackOrigin) return fallbackOrigin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * A same-origin path to redirect to after sign-in, or `fallback`. Resolves the value the way a browser
 * would, so "/\t/evil.com", "/\\evil.com" and similar tricks that normalise to "//evil.com" are refused.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/")) return fallback;
  const base = "https://same-origin.invalid";
  try {
    const url = new URL(next, base);
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (url.origin !== base || path.startsWith("//") || path.startsWith("/\\")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

export function extensionOf(fileName: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(fileName);
  return m ? m[1].toLowerCase() : "";
}

export function isAccepted(fileName: string): fileName is string {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(extensionOf(fileName));
}

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
