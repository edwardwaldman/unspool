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
  /** Paid tier (free/plus/pro/ultra); only meaningful while the subscription is active (see tierOf). */
  tier?: "free" | "plus" | "pro" | "ultra" | null;
  current_period_start?: string | null;
  /** The one 1-day Plus trial has been started. */
  trial_used?: boolean | null;
};

export type Viewer = {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  anonToken: string | null;
  subscribed: boolean;
};

export function isSubscribed(profile: Profile | null) {
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
  if (!supabaseConfigured) return { userId: null, email: null, profile: null, anonToken, subscribed: false };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { userId: null, email: null, profile: null, anonToken, subscribed: false };

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
  return { userId, email, profile, anonToken, subscribed: isSubscribed(profile) };
}

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "unspool";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Buffer.from(digest).toString("hex").slice(0, 32);
}
