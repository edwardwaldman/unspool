"use client";

import type { Billing, Tier } from "@/lib/plans";

export type CheckoutRequest =
  | { kind: "subscription"; tier: Exclude<Tier, "free">; billing?: Billing }
  | { kind: "trial" }
  | { kind: "topup" };

/** Open Stripe Checkout (or the billing portal for a plan switch). Returns an error message, or null after redirecting. */
export async function startCheckout(req: CheckoutRequest, documentId?: string, reel?: number): Promise<string | null> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...req, documentId, reel }),
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string; code?: string };
  if (res.ok && body.url) {
    window.location.href = body.url;
    return null;
  }
  if (body.code === "auth") return "Sign in first.";
  return body.error ?? "Couldn't open checkout.";
}

/** Ask the server to unlock more reels of a document, then tell open spools to refetch. */
export async function unlockReels(documentId: string, mode: "free" | "credits") {
  const res = await fetch(`/api/documents/${documentId}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  const body = (await res.json().catch(() => ({}))) as { status?: string; granted?: number; error?: string };
  window.dispatchEvent(new Event("unspool:reload"));
  return res.ok ? body : { status: "error", granted: 0, error: body.error };
}

/** Intent carried through sign-in in ?checkout=. */
export function checkoutFromIntent(intent: string | null): CheckoutRequest | null {
  if (intent === "trial") return { kind: "trial" };
  if (intent === "topup") return { kind: "topup" };
  if (intent === "plus" || intent === "pro" || intent === "ultra") return { kind: "subscription", tier: intent };
  const yearly = /^(plus|pro|ultra)_year$/.exec(intent ?? "")?.[1];
  if (yearly === "plus" || yearly === "pro" || yearly === "ultra") return { kind: "subscription", tier: yearly, billing: "year" };
  if (intent === "sub") return { kind: "subscription", tier: "plus" };
  return null;
}
