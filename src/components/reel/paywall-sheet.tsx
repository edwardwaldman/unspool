"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, PRICING } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { GoogleIcon, LockIcon } from "../ui/icons";
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

/** "Unlock all 10 reels" → sign in (Google / magic link) → Stripe Checkout → back to the same reel. */
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
        <div className="pb-2 text-center">
          <div className="text-[22px] font-black tracking-tight">This is a demo spool</div>
          <p className="mt-2 text-[15px] text-soft">Drop your own notes, chapter or PDF and Unspool turns it into 10 reels like these.</p>
          <Link href="/" className="mt-5 block rounded-2xl bg-white py-3.5 text-[16px] font-extrabold text-[#0b1020]">
            Unspool my doc
          </Link>
        </div>
      ) : wanted && !signedIn ? (
        <div className="pb-1">
          <div className="text-[22px] font-black tracking-tight">Sign in to unlock</div>
          <p className="mt-1 text-[14px] text-muted">We&apos;ll bring you right back to reel {reel}.</p>
          {sent ? (
            <div className="mt-5 rounded-2xl bg-white/5 p-4 text-[15px] text-soft">
              Check <b className="text-ink">{email}</b> for a sign-in link. Open it on this device.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={google}
                disabled={busy !== null}
                className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white py-3.5 text-[16px] font-bold text-[#0b1020] disabled:opacity-60"
              >
                <GoogleIcon /> Continue with Google
              </button>
              <div className="my-4 flex items-center gap-3 text-[12px] uppercase tracking-widest text-muted">
                <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
              </div>
              <form onSubmit={magic} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[16px] outline-none focus:border-accent"
                />
                <button type="submit" disabled={busy !== null} className="rounded-2xl bg-accent px-4 text-[15px] font-bold text-[#0b1020] disabled:opacity-60">
                  {busy === "email" ? "…" : "Send link"}
                </button>
              </form>
            </>
          )}
          <button type="button" onClick={() => setWanted(null)} className="mt-4 w-full text-center text-[14px] text-muted">
            Back
          </button>
        </div>
      ) : (
        <div className="pb-1">
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.25em] text-accent">
            <LockIcon size={15} /> {locked.length} reels locked
          </div>
          <div className="mt-2 text-[26px] font-black leading-tight tracking-tight">Unlock all 10 reels</div>
          <p className="mt-1 text-[14px] text-muted">{spool.title ?? spool.fileName}</p>
          <div className="no-scrollbar mt-4 max-h-[132px] space-y-1.5 overflow-y-auto">
            {locked.map((r) => (
              <div key={r.id} className="flex gap-3 text-[14px]">
                <span className="w-5 font-mono text-[11px] leading-[20px] text-muted">{String(r.index).padStart(2, "0")}</span>
                <span className="font-bold text-soft">{r.title}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => choose("document")}
            disabled={busy !== null}
            className="mt-5 w-full rounded-2xl bg-white py-3.5 text-[16px] font-extrabold text-[#0b1020] disabled:opacity-60"
          >
            {busy === "document" ? "Opening checkout…" : `Unlock this doc · ${formatPrice(PRICING.documentCents)}`}
          </button>
          <button
            type="button"
            onClick={() => choose("subscription")}
            disabled={busy !== null}
            className="mt-2.5 w-full rounded-2xl border border-accent/60 bg-accent/10 py-3.5 text-[16px] font-extrabold text-accent disabled:opacity-60"
          >
            {busy === "subscription" ? "Opening checkout…" : `Unlimited docs · ${formatPrice(PRICING.subscriptionCents)}/mo`}
          </button>
          {spool.sensitive && (
            <p className="mt-3 text-center text-[12px] text-muted">Unspool summarizes; it isn&apos;t legal or financial advice.</p>
          )}
        </div>
      )}
      {err && <p className="mt-3 text-center text-[13px] text-warn">{err}</p>}
    </Sheet>
  );
}
