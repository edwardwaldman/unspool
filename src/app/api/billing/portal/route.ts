import { siteUrl } from "@/lib/config";
import { error, json } from "@/lib/http";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripeConfigured()) return error(503, "Payments aren't set up yet.");
  const viewer = await getViewer();
  if (!viewer.userId) return error(401, "Sign in first.", { code: "auth" });
  if (!viewer.profile?.stripe_customer_id) return error(400, "No billing account yet.");
  const session = await getStripe().billingPortal.sessions.create({
    customer: viewer.profile.stripe_customer_id,
    return_url: `${siteUrl(new URL(req.url).origin)}/profile`,
  });
  return json({ url: session.url });
}
