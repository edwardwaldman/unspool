import { supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { deleteDocument } from "@/lib/spool";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Permanently delete the signed-in account: cancel any subscription, remove files, then the auth user. */
export async function DELETE() {
  if (!supabaseConfigured) return notConfigured();
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Not signed in", { code: "auth" });
  const db = adminClient();

  const subId = viewer.profile?.stripe_subscription_id;
  if (subId && stripeConfigured() && viewer.profile?.subscription_status !== "canceled") {
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

  // Profiles and any remaining rows cascade from auth.users.
  const { error: delErr } = await db.auth.admin.deleteUser(viewer.userId);
  if (delErr) return error(500, "Couldn't delete your account. Try again or contact us.");

  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => undefined);
  return json({ ok: true });
}
