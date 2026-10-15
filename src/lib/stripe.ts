import Stripe from "stripe";
import { queueRemainingReels } from "./pipeline";
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
  if (profile.stripe_customer_id) return profile.stripe_customer_id;
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

/** Mirror a Stripe subscription onto the user's profile. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const update = {
    plan: active ? "sub" : "free",
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_end: periodEnd(sub),
  };
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
  const kind = session.metadata?.kind === "subscription" ? "subscription" : "document";
  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  const documentId = session.metadata?.document_id || null;

  if (kind === "document" && documentId && userId) {
    await db.from("documents").update({ unlocked: true }).eq("id", documentId).eq("user_id", userId);
  }
  if (kind === "subscription" && session.subscription) {
    const sub =
      typeof session.subscription === "string"
        ? await getStripe().subscriptions.retrieve(session.subscription)
        : session.subscription;
    await syncSubscription(sub);
  }

  await db.from("purchases").upsert(
    {
      user_id: userId,
      document_id: documentId,
      kind,
      stripe_session_id: session.id,
      amount: session.amount_total,
      currency: session.currency,
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );

  if (documentId) await queueRemainingReels(documentId);
  return { fulfilled: true, kind, documentId };
}
