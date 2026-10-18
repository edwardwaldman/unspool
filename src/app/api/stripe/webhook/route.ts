import type Stripe from "stripe";
import { error } from "@/lib/http";
import { fulfillCheckout, getStripe, syncSubscription } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return error(400, "Missing webhook secret or signature");

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch (err) {
    return error(400, `Webhook signature verification failed: ${(err as Error).message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckout(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // Events can arrive out of order or be retried late: mirror Stripe's current state, not the payload's.
      await syncSubscription(await getStripe().subscriptions.retrieve(event.data.object.id));
      break;
  }
  return Response.json({ received: true });
}
