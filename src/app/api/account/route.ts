import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { tierOf } from "@/lib/credits";
import { PLANS } from "@/lib/plans";
import { deleteDocument } from "@/lib/spool";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** What the Manage account popup shows: email, plan name, signup rank and how the account signs in. */
export async function GET() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Not signed in", { code: "auth" });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  // Account #n: how many accounts were created at or before this one (one profile per auth user).
  let accountNumber: number | null = null;
  // The profile row is written by the signup trigger, so its own timestamp keeps this account inside the count.
  const createdAt = (viewer.profile as { created_at?: string } | null)?.created_at ?? user?.created_at;
  if (createdAt) {
    const { count } = await adminClient().from("profiles").select("id", { count: "exact", head: true }).lte("created_at", createdAt);
    accountNumber = count ?? null;
  }
  const providers = (user?.app_metadata?.providers as string[] | undefined) ?? [];
  return json({
    email: user?.email ?? viewer.email,
    plan: PLANS[tierOf(viewer.profile)].name,
    tier: tierOf(viewer.profile),
    accountNumber,
    provider: (user?.app_metadata?.provider as string | undefined) ?? "email",
    hasPassword: providers.length === 0 || providers.includes("email"),
    hasBilling: Boolean(viewer.profile?.stripe_customer_id),
  });
}

/** Permanently delete the signed-in account: cancel any subscription, remove files, then the auth user. */
export async function DELETE() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Not signed in", { code: "auth" });
  const db = adminClient();

  // The stored profile, not viewer.profile: an owner test view masks the real subscription, which must still be cancelled.
  const { data: stored } = await db.from("profiles").select("stripe_subscription_id,subscription_status").eq("id", viewer.userId).maybeSingle();
  const subId = stored?.stripe_subscription_id as string | null | undefined;
  if (subId && stripeConfigured() && stored?.subscription_status !== "canceled") {
    try {
      await getStripe().subscriptions.cancel(subId);
    } catch (err) {
      // Already gone in Stripe is fine; anything else would leave a live subscription billing a deleted account.
      if ((err as { code?: string }).code !== "resource_missing") {
        console.error("[account] couldn't cancel subscription", err);
        return error(502, "Couldn't cancel your subscription, so your account wasn't deleted. Try again or contact us.");
      }
    }
  }

  const { data: docs } = await db.from("documents").select("id,file_path").eq("user_id", viewer.userId);
  for (const doc of docs ?? []) await deleteDocument(doc);

  // Unlink rather than delete: the hashed-IP rows must keep counting toward the 24h per-IP upload cap, or
  // delete-and-re-sign-up would hand out unlimited free documents. The nightly cleanup drops them after 3 days.
  await db.from("usage_events").update({ user_id: null, document_id: null }).eq("user_id", viewer.userId);
  // Profiles and any remaining rows cascade from auth.users.
  const { error: delErr } = await db.auth.admin.deleteUser(viewer.userId);
  if (delErr) return error(500, "Couldn't delete your account. Try again or contact us.");

  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => undefined);
  return json({ ok: true });
}
