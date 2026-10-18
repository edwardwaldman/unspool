import { loadDocument } from "@/lib/access";
import { MAX_REELS, PRICING, siteUrl, supabaseConfigured } from "@/lib/config";
import { error, json, notConfigured } from "@/lib/http";
import { ensureCustomer, getStripe, stripeConfigured } from "@/lib/stripe";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!supabaseConfigured) return notConfigured();
  if (!stripeConfigured()) return error(503, "Payments aren't set up yet (STRIPE_SECRET_KEY).");
  const body = (await req.json().catch(() => ({}))) as { kind?: string; documentId?: string; reel?: number };
  const kind = body.kind === "subscription" ? "subscription" : "document";
  const viewer = await getViewer();
  if (!viewer.userId || !viewer.profile) return error(401, "Sign in to unlock.", { code: "auth" });

  const origin = siteUrl(new URL(req.url).origin);
  const reel = Math.max(1, Math.min(MAX_REELS, Number(body.reel ?? 2)));
  let returnPath = "/library";
  let docName = "";
  if (body.documentId) {
    const doc = await loadDocument(body.documentId, viewer);
    if (!doc) return error(404, "Document not found");
    returnPath = `/s/${doc.id}?reel=${reel}`;
    docName = doc.title ?? doc.file_name;
    if (kind === "document" && doc.unlocked) return json({ url: `${origin}${returnPath}` });
  } else if (kind === "document") {
    return error(400, "Missing document");
  }
  if (kind === "subscription" && viewer.subscribed) return json({ url: `${origin}${returnPath}` });

  const customer = await ensureCustomer(viewer.profile, viewer.email);
  const sep = returnPath.includes("?") ? "&" : "?";
  const metadata = { kind, user_id: viewer.userId, document_id: body.documentId ?? "" };
  const stripe = getStripe();

  const session =
    kind === "document"
      ? await stripe.checkout.sessions.create({
          mode: "payment",
          customer,
          client_reference_id: viewer.userId,
          metadata,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: PRICING.currency,
                unit_amount: PRICING.documentCents,
                product_data: {
                  name: "Unlock all reels",
                  description: docName ? `Unspool: ${docName.slice(0, 200)}` : undefined,
                },
              },
            },
          ],
          success_url: `${origin}${returnPath}${sep}checkout_session={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}${returnPath}`,
        })
      : await stripe.checkout.sessions.create({
          mode: "subscription",
          customer,
          client_reference_id: viewer.userId,
          metadata,
          subscription_data: { metadata: { user_id: viewer.userId } },
          line_items: [
            process.env.STRIPE_PRICE_SUBSCRIPTION
              ? { price: process.env.STRIPE_PRICE_SUBSCRIPTION, quantity: 1 }
              : {
                  quantity: 1,
                  price_data: {
                    currency: PRICING.currency,
                    unit_amount: PRICING.subscriptionCents,
                    recurring: { interval: "month" },
                    product_data: { name: "Unspool Unlimited" },
                  },
                },
          ],
          allow_promotion_codes: true,
          success_url: `${origin}${returnPath}${sep}checkout_session={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}${returnPath}`,
        });

  return json({ url: session.url });
}
