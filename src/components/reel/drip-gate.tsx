"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatPrice, PRICING } from "@/lib/config";
import type { SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { PaywallSheet, startCheckout, type CheckoutKind } from "./paywall-sheet";

const PREMIUM_CHECKS = ["All reels of every document, no waiting", "Unlimited documents", "Cancel any time"];

/**
 * The free-trial gate: reel 1 is free, then one more every hour. Shown when the viewer reaches a reel
 * that hasn't dripped open yet: a live countdown to the next free reel on top, then the offer to skip
 * the wait (Premium, or just this document).
 */
export function DripGate({
  open,
  onClose,
  spool,
  reel,
}: {
  open: boolean;
  onClose: () => void;
  spool: SpoolDTO;
  reel: number;
}) {
  const left = useCountdown(spool.nextFreeUnlockAt);
  const [busy, setBusy] = useState<CheckoutKind | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const elapsed = useRef(false);

  // The wait is over: the spool refetches on its own (useSpool) and the reel unblurs; get out of the way.
  useEffect(() => {
    if (!open || left > 0 || !spool.nextFreeUnlockAt || elapsed.current) return;
    elapsed.current = true;
    onClose();
  }, [open, left, spool.nextFreeUnlockAt, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const go = async (kind: CheckoutKind) => {
    setErr(null);
    setBusy(kind);
    const e = await startCheckout(kind, spool.id, reel);
    if (e) {
      setErr(e);
      setBusy(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Next free reel"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[420px] border border-line border-t-2 border-t-thread bg-surface p-6">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} strokeWidth={1.5} />
        </button>

        {left > 0 && (
          <div className="mr-6 border-2 border-thread bg-paper px-4 py-4 text-center" data-testid="drip-countdown">
            <p className="label !text-thread">Next free reel in</p>
            <p className="mt-1 font-mono text-[52px] font-bold leading-none tracking-[-0.03em] text-thread" aria-live="off">
              {formatCountdown(left)}
            </p>
          </div>
        )}

        <p className="label mt-5 !text-thread">Premium</p>
        <h2 className="mt-1.5 font-display text-[26px] leading-[1.1]">Don&apos;t want to wait? Unlock them all now.</h2>
        <p className="mt-2 text-[14px] leading-snug text-muted">Free accounts get reel 1, then one more every hour.</p>

        <p className="mt-5 font-mono leading-none">
          <span className="text-[34px] font-bold tracking-[-0.03em] text-ink">{formatPrice(PRICING.subscriptionCents)}</span>
          <span className="text-[14px] text-muted"> / month</span>
        </p>
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {PREMIUM_CHECKS.map((c) => (
            <li key={c} className="flex items-start gap-2.5 text-[14px] leading-snug text-ink">
              <Check size={15} strokeWidth={2.5} className="mt-[2px] shrink-0 text-sage" aria-hidden />
              {c}
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => go("subscription")} disabled={busy !== null} className="mt-5 min-h-[48px] w-full bg-thread px-4 text-[15px] font-semibold text-paper hover:opacity-90 disabled:opacity-60">
          {busy === "subscription" ? "Opening checkout" : "Upgrade to Premium"}
        </button>
        <button type="button" onClick={() => go("document")} disabled={busy !== null} className="btn-secondary -mt-px w-full justify-between px-4 py-3 text-[14.5px]">
          <span>{busy === "document" ? "Opening checkout" : "Unlock this doc"}</span>
          <span className="font-mono text-[13px] text-muted">{formatPrice(PRICING.documentCents)}</span>
        </button>
        {err && (
          <p role="alert" className="mt-2 text-center text-[13px] text-coral">
            {err}
          </p>
        )}
        <button type="button" onClick={onClose} className="mt-4 w-full text-center text-[13.5px] text-muted hover:text-ink">
          I&apos;ll wait
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">Premium renews monthly until you cancel. One-time payment per document.</p>
      </div>
    </div>,
    document.body,
  );
}

/** What a locked reel opens: the free-trial countdown gate while reels are still dripping, else the paywall. */
export function UnlockSheet({
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
  if (spool.nextFreeUnlockAt && !spool.demo && viewer?.signedIn) return <DripGate key={spool.nextFreeUnlockAt} open={open} onClose={onClose} spool={spool} reel={reel} />;
  return <PaywallSheet open={open} onClose={onClose} spool={spool} viewer={viewer} reel={reel} />;
}
