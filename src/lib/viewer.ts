import { isOwnerEmail } from "./owner";
import { cookies, headers } from "next/headers";
import { ANON_COOKIE, supabaseConfigured } from "./config";
import { adminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  plan: "free" | "sub";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  /** "year" for yearly plans (credits still reset weekly); "week" otherwise. */
  billing_interval?: "week" | "year" | null;
  /** Paid tier (free/plus/pro/ultra); only meaningful while the subscription is active (see tierOf). */
  tier?: "free" | "plus" | "pro" | "ultra" | null;
  current_period_start?: string | null;
  /** The one 1-day Plus trial has been started. */
  trial_used?: boolean | null;
  /** Plan granted from the owner panel, no payment (null = none). */
  comp_tier?: "plus" | "pro" | "ultra" | null;
  /** The owner's stored test view (see /api/owner/view), for background jobs that have no cookie. */
  owner_view?: TestTier | null;
  /** Pro/Ultra reel look (see lib/reel-style.ts); raw JSON, parse before use. */
  reel_style?: unknown;
  /** Set (never stored) when the owner's profile is standing in for a real user of this tier. */
  view_as?: TestTier;
};

/** Owner test views: signed out, or a real account of one tier. */
export type TestTier = "free" | "plus" | "pro" | "ultra";
export type OwnerView = "out" | TestTier;
export const OWNER_VIEWS: OwnerView[] = ["out", "free", "plus", "pro", "ultra"];
export const OWNER_VIEW_COOKIE = "unspool_owner_view";

export type Viewer = {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  anonToken: string | null;
  subscribed: boolean;
  /** The real signed-in user is the owner (true even while they view the site as someone else). */
  isOwner: boolean;
  realUserId: string | null;
  realEmail: string | null;
  /** The owner's no-limits bypass applies (off while testing as another tier or signed out). */
  ownerUnlimited: boolean;
  /** The owner's active test view, or null. */
  ownerView: OwnerView | null;
};

/** The owner, not testing as another tier: unlimited use. */
export function ownerUnlimited(profile: Profile | null) {
  return Boolean(profile && isOwnerEmail(profile.email) && !profile.view_as);
}

/** The owner's profile as a real user of `tier` would have it: no owner bypass, no subscription, comp_tier forced. */
export function asTier(profile: Profile, tier: TestTier): Profile {
  return {
    ...profile,
    view_as: tier,
    comp_tier: tier === "free" ? null : tier,
    plan: "free",
    tier: null,
    subscription_status: null,
    stripe_subscription_id: null,
    current_period_start: null,
    current_period_end: null,
  };
}

/** A profile loaded outside a request (background jobs): apply the owner's stored test view, if any. */
export function withStoredView(profile: Profile | null): Profile | null {
  return profile && profile.owner_view && isOwnerEmail(profile.email) ? asTier(profile, profile.owner_view) : profile;
}

export function isSubscribed(profile: Profile | null) {
  if (profile && (ownerUnlimited(profile) || profile.comp_tier)) return true;
  if (!profile || profile.plan !== "sub") return false;
  if (profile.current_period_end && new Date(profile.current_period_end).getTime() < Date.now() - 3 * 864e5) return false;
  return true;
}

/** Who is making this request: a signed-in user, an anonymous visitor, or both (pre-claim). */
export async function getViewer(): Promise<Viewer> {
  // The cookie is client-controlled: only accept the UUID the proxy issues, never arbitrary text that
  // could end up inside a PostgREST filter.
  const rawAnon = (await cookies()).get(ANON_COOKIE)?.value;
  const anonToken = rawAnon && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawAnon) ? rawAnon : null;
  const out: Viewer = { userId: null, email: null, profile: null, anonToken, subscribed: false, isOwner: false, realUserId: null, realEmail: null, ownerUnlimited: false, ownerView: null };
  if (!supabaseConfigured) return out;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return out;

  const userId = claims.sub as string;
  const email = (claims.email as string | undefined) ?? null;
  const admin = adminClient();
  let { data: profile } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle<Profile>();
  if (!profile) {
    const { data: created } = await admin
      .from("profiles")
      .upsert({ id: userId, email }, { onConflict: "id" })
      .select("*")
      .single<Profile>();
    profile = created;
  }
  // The owner bypass hangs off the email, so never trust it from the token or the profile alone: confirm with
  // Supabase Auth that this account's current, confirmed email really is the owner's (an unconfirmed sign-up,
  // a pending email change or a stale profile row must not unlock the owner panel or unlimited use).
  if (isOwnerEmail(email) || isOwnerEmail(profile?.email)) {
    const { data: auth } = await admin.auth.admin.getUserById(userId);
    const verified = Boolean(auth.user?.email_confirmed_at) && isOwnerEmail(auth.user?.email) && isOwnerEmail(email);
    if (!verified) {
      // Not the owner: strip the owner email so ownerUnlimited()/tierOf() can't match it anywhere downstream.
      if (profile && isOwnerEmail(profile.email)) profile = { ...profile, email: isOwnerEmail(email) ? null : email };
      const notOwner = { isOwner: false, realUserId: userId, realEmail: email, ownerUnlimited: false, ownerView: null };
      return { userId, email: isOwnerEmail(email) ? null : email, profile, anonToken, subscribed: isSubscribed(profile), ...notOwner };
    }
  }
  const real = { isOwner: false, realUserId: userId, realEmail: email, ownerUnlimited: ownerUnlimited(profile), ownerView: null };
  if (!isOwnerEmail(email)) return { userId, email, profile, anonToken, subscribed: isSubscribed(profile), ...real };

  // The owner can look at the site as a signed-out visitor or as a real account of any tier (the
  // TEST: OWNER VIEW box). Honoured only here, after the real identity is known to be the owner.
  const raw = (await cookies()).get(OWNER_VIEW_COOKIE)?.value as OwnerView | undefined;
  const view = raw && OWNER_VIEWS.includes(raw) ? raw : null;
  const owner = { ...real, isOwner: true, ownerView: view };
  if (view === "out") return { ...out, ...owner, ownerUnlimited: false };
  if (view && profile) profile = asTier(profile, view);
  return { userId, email, profile, anonToken, subscribed: isSubscribed(profile), ...owner, ownerUnlimited: ownerUnlimited(profile) };
}

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "unspool";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Buffer.from(digest).toString("hex").slice(0, 32);
}
