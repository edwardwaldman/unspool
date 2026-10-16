"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, PRICING } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { openAuth } from "../auth/auth-store";
import { Sheet } from "../ui/sheet";

export type CheckoutKind = "document" | "subscription";

export async function startCheckout(kind: CheckoutKind, documentId: string, reel: number): Promise<string | null> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, documentId, reel }),
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (res.ok && body.url) {
    window.location.href = body.url;
    return null;
  }
  return body.error ?? "Couldn't open checkout.";
}

/** "Unlock all 10 reels" → sign in (Google / magic link / password) → Stripe Checkout → back to the same reel. */
export function PaywallSheet({
  open,
  onClose,
  spool,
  viewer,
  reel,
}: {
  open: boolean;
  onClose: () => void;
  spool: SpoolDTO;
  viewer: ViewerDTO | null;
  reel: number;
}) {
  const [busy, setBusy] = useState<CheckoutKind | "email" | "google" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [wanted, setWanted] = useState<CheckoutKind | null>(null);

  const locked = spool.reels.filter((r) => r.locked);
  const signedIn = Boolean(viewer?.signedIn);

  const nextPath = (kind: CheckoutKind) => `/s/${spool.id}?reel=${reel}&checkout=${kind === "document" ? "doc" : "sub"}`;
  const callback = (kind: CheckoutKind) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath(kind))}`;

  const choose = async (kind: CheckoutKind) => {
    setErr(null);
    if (spool.demo) return;
    if (!signedIn) {
      setWanted(kind);
      return;
    }
    setBusy(kind);
    const e = await startCheckout(kind, spool.id, reel);
    if (e) {
      setErr(e);
      setBusy(null);
    }
  };

  const google = async () => {
    if (!wanted) return;
    setBusy("google");
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(wanted) } });
    if (error) {
      setErr(error.message);
      setBusy(null);
    }
  };

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wanted || !email.trim()) return;
    setBusy("email");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback(wanted) },
    });
    setBusy(null);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <Sheet open={open} onClose={onClose} label="Unlock all reels">
      {spool.demo ? (
        <div className="pb-1">
          <div className="label">Sample spool</div>
          <h2 className="mt-2 font-display text-[34px] leading-[1.05]">This one is a demo.</h2>
          <p className="mt-2 text-[15px] text-muted">Drop your own notes, chapter or PDF and get 10 reels like these.</p>
          <Link href="/" className="btn-primary mt-6 w-full py-3.5 text-[15px]">
            Unspool a document
          </Link>
        </div>
      ) : wanted && !signedIn ? (
        <div className="pb-1">
          <div className="label">Step 1 of 2</div>
          <h2 className="mt-2 font-display text-[34px] leading-[1.05]">Sign in to unlock.</h2>
          <p className="mt-2 text-[14px] text-muted">You&apos;ll come back to reel {reel}.</p>
          {sent ? (
            <div className="mt-6 border border-line p-4 text-[14.5px] text-ink/85">
              Sign-in link sent to <span className="text-ink">{email}</span>. Open it on this device.
            </div>
          ) : (
            <>
              <button type="button" onClick={google} disabled={busy !== null} className="btn-primary mt-6 w-full py-3.5 text-[15px]">
                Continue with Google
              </button>
              <div className="label my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" /> or <div className="h-px flex-1 bg-line" />
              </div>
              <form onSubmit={magic} className="flex">
                <input
                  type="email"
                  required
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field min-w-0 flex-1 px-4 py-3 text-[16px]"
                />
                <button type="submit" disabled={busy !== null} className="btn-secondary -ml-px px-4 text-[14px]">
                  {busy === "email" ? "Sending" : "Email link"}
                </button>
              </form>
            </>
          )}
          {!sent && (
            <button
              type="button"
              onClick={() => {
                const kind = wanted;
                openAuth("login", {
                  next: nextPath(kind),
                  onDone: () => {
                    setBusy(kind);
                    startCheckout(kind, spool.id, reel).then((e) => {
                      if (e) {
                        setErr(e);
                        setBusy(null);
                      }
                    });
                  },
                });
              }}
              className="mt-4 w-full text-center text-[13.5px] text-thread hover:underline"
            >
              Use email and password instead
            </button>
          )}
          <button type="button" onClick={() => setWanted(null)} className="mt-5 w-full text-center text-[13.5px] text-muted">
            Back
          </button>
        </div>
      ) : (
        <div className="pb-1">
          <div className="label">{spool.title ?? spool.fileName}</div>
          <h2 className="mt-2 font-display text-[36px] leading-[1.02]">Unlock all 10 reels.</h2>
          <div className="mt-5 flex items-baseline justify-between border-b border-line pb-2">
            <span className="label">Locked</span>
            <span className="font-mono text-[11px] text-muted">{locked.length} of 10</span>
          </div>
          <div className="no-scrollbar max-h-[150px] overflow-y-auto">
            {locked.map((r) => (
              <div key={r.id} className="flex gap-3 border-b border-line py-2 text-[13.5px]">
                <span className="w-5 font-mono text-[10.5px] leading-[20px] text-muted">{String(r.index).padStart(2, "0")}</span>
                <span className="text-ink/90">{r.title}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => choose("document")} disabled={busy !== null} className="btn-primary mt-6 w-full justify-between px-5 py-3.5 text-[15px]">
            <span>{busy === "document" ? "Opening checkout" : "Unlock this document"}</span>
            <span className="font-mono text-[13px]">{formatPrice(PRICING.documentCents)}</span>
          </button>
          <button type="button" onClick={() => choose("subscription")} disabled={busy !== null} className="btn-secondary -mt-px w-full justify-between px-5 py-3.5 text-[15px]">
            <span>{busy === "subscription" ? "Opening checkout" : "Unlimited documents"}</span>
            <span className="font-mono text-[13px] text-muted">{formatPrice(PRICING.subscriptionCents)}/mo</span>
          </button>
          <p className="mt-4 text-center text-[12.5px] text-muted">
            One-time payment per document. Unlimited renews monthly; cancel anytime.
          </p>
          {spool.sensitive && <p className="label mt-2 text-center">A summary, not legal or financial advice</p>}
        </div>
      )}
      {err && <p className="mt-3 text-center text-[13px] text-coral">{err}</p>}
    </Sheet>
  );
}
