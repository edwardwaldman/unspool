import { error, json } from "@/lib/http";
import { fulfillCheckout, getStripe, stripeConfigured } from "@/lib/stripe";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** Fast path after redirect back from Checkout, so the user doesn't wait on the webhook. */
export async function POST(req: Request) {
  if (!stripeConfigured()) return error(503, "Payments aren't set up yet.");
  const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId?.startsWith("cs_")) return error(400, "Invalid session");
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in first");
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if ((session.metadata?.user_id ?? session.client_reference_id) !== viewer.userId) return error(403, "Not your session");
  const result = await fulfillCheckout(session);
  return json(result);
}
