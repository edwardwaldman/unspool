import { loadDocument } from "@/lib/access";
import { tierOf } from "@/lib/credits";
import { MAX_REELS, siteUrl, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { CURRENCY, isBilling, isTier, PLANS, TRIAL, topupPack } from "@/lib/plans";
import { ensureCustomer, getStripe, priceIdFor, stripeConfigured, TAX_CODE } from "@/lib/stripe";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * kind "subscription" + tier: subscribe, or switch an existing subscription in the billing portal
 * (Stripe prorates the upgrade/downgrade). kind "trial": the one 1-day Plus trial (card required).
 * kind "topup": a one-time pack of reel credits that never expire.
 */
export async function POST(req: Request) {
  try {
    return await checkout(req);
  } catch (err) {
    // Stripe's own message ("Your account cannot currently make live charges", "No such price", ...) says what to
    // fix; show it instead of a bare 500 the page can only call "Couldn't open checkout".
    const e = err as { type?: string; code?: string; message?: string };
    console.error("[checkout] failed", e?.type, e?.code, e?.message);
    const stripeMsg = e?.type?.startsWith("Stripe") && e.message ? e.message : null;
    return error(502, stripeMsg ? `Checkout error from Stripe: ${stripeMsg}` : "Couldn't open checkout. Try again in a minute.", { code: e?.code ?? "checkout_failed" });
  }
}

async function checkout(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  if (!stripeConfigured()) return error(503, "Payments aren't set up yet (STRIPE_SECRET_KEY).");
  const body = (await req.json().catch(() => ({}))) as { kind?: string; tier?: string; documentId?: string; reel?: number; billing?: string; pack?: string; returnTo?: string };
  const kind = body.kind === "topup" ? "topup" : body.kind === "trial" ? "trial" : "subscription";
  const tier = kind === "trial" ? TRIAL.tier : isTier(body.tier) && body.tier !== "free" ? body.tier : "plus";
  const billing = kind === "subscription" && isBilling(body.billing) ? body.billing : "week";
  const viewer = await getViewer();
  if (!viewer.userId || !viewer.profile) return error(401, "Sign in to continue.", { code: "auth" });

  const origin = siteUrl(new URL(req.url).origin);
  const reel = Math.max(1, Math.min(MAX_REELS, Number(body.reel ?? 2)));
  // Only known pages: never an arbitrary redirect target.
  let returnPath = body.returnTo === "/studio" ? "/studio" : kind === "topup" ? "/profile" : "/library";
  if (body.documentId) {
    const doc = await loadDocument(body.documentId, viewer);
    if (!doc) return error(404, "Document not found");
    returnPath = `/s/${doc.id}?reel=${reel}`;
  }
  const sep = returnPath.includes("?") ? "&" : "?";
  const success_url = `${origin}${returnPath}${sep}checkout_session={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}${returnPath}`;
  const stripe = getStripe();
  const current = tierOf(viewer.profile);

  // Already subscribed: switching tiers happens on the existing subscription, prorated by Stripe.
  if (kind !== "topup" && current !== "free") {
    if (kind === "trial" || (current === tier && (viewer.profile.billing_interval ?? "week") === billing) || !viewer.profile.stripe_subscription_id || !viewer.profile.stripe_customer_id) {
      return json({ url: `${origin}/profile` });
    }
    const sub = await stripe.subscriptions.retrieve(viewer.profile.stripe_subscription_id);
    const item = sub.items.data[0];
    const portal = await stripe.billingPortal.sessions.create({
      customer: viewer.profile.stripe_customer_id,
      return_url: `${origin}${returnPath}`,
      flow_data: {
        type: "subscription_update_confirm",
        subscription_update_confirm: { subscription: sub.id, items: [{ id: item.id, price: await priceIdFor(tier, billing), quantity: 1 }] },
        after_completion: { type: "redirect", redirect: { return_url: `${origin}${returnPath}` } },
      },
    });
    return json({ url: portal.url });
  }

  const customer = await ensureCustomer(viewer.profile, viewer.email);
  const metadata = { kind: kind === "trial" ? "subscription" : kind, tier, user_id: viewer.userId, document_id: body.documentId ?? "" };

  if (kind === "topup") {
    // The pack (and so the credits granted) is chosen from the server's list, never from the request's numbers.
    const pack = topupPack(body.pack);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer,
      client_reference_id: viewer.userId,
      metadata: { ...metadata, credits: String(pack.credits), pack: pack.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: pack.priceCents,
            product_data: { name: `${pack.credits} reel credits`, description: "Unspool top-up. Credits never expire.", tax_code: TAX_CODE },
          },
        },
      ],
      success_url,
      cancel_url,
    });
    return json({ url: session.url });
  }

  if (kind === "trial") {
    // One trial per account: the profile flag, and any earlier subscription on this Stripe customer.
    const earlier = await stripe.subscriptions.list({ customer, status: "all", limit: 1 });
    if (viewer.profile.trial_used || viewer.profile.stripe_subscription_id || earlier.data.length) {
      return error(409, "You've already used your free trial. Upgrade to keep going.", { code: "trial_used" });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: viewer.userId,
    metadata,
    subscription_data: {
      metadata: { user_id: viewer.userId, tier, billing },
      ...(kind === "trial" ? { trial_period_days: TRIAL.days } : {}),
    },
    ...(kind === "trial" ? { payment_method_collection: "always" as const } : {}),
    line_items: [{ price: await priceIdFor(tier, billing), quantity: 1 }],
    allow_promotion_codes: kind !== "trial",
    custom_text:
      kind === "trial"
        ? { submit: { message: `Free for ${TRIAL.days} day, then ${PLANS.plus.name} at $${(PLANS.plus.priceCents / 100).toFixed(2)}/week unless you cancel.` } }
        : undefined,
    success_url,
    cancel_url,
  });
  return json({ url: session.url });
}
