"use client";

import { X } from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { startCheckout } from "../billing/checkout";
import { SeeAllPlans } from "../billing/plan-picker";
import { toast } from "../ui/toast";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { useCredits } from "./credit-bar";

/** Tapping the timer: skip the wait (the free trial, or Plus once the trial is used), see every plan, or keep waiting. */
export function SkipPopup({ left, onClose }: { left: number; onClose: () => void }) {
  const usage = useCredits();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const skip = async () => {
    setBusy(true);
    const err = await startCheckout(usage?.trialEligible ? { kind: "trial", returnTo: "/studio" } : { kind: "subscription", tier: "plus", returnTo: "/studio" });
    if (err) {
      toast(err, 4000);
      setBusy(false);
    }
  };
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-5"
      role="dialog"
      aria-modal
      aria-label="Skip the wait"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="skip-popup"
    >
      <div className="relative w-full max-w-[340px] rounded-[20px] border border-line bg-surface p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,.5)]">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted hover:text-ink">
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
        <h2 className="px-10 font-display text-[24px] leading-[1.05] text-ink">Don&apos;t want to wait?</h2>
        {left > 0 && (
          <>
            <p className="mt-3 text-[12.5px] font-semibold text-muted">Next free reel in</p>
            <p className="mt-1 font-mono text-[40px] font-bold leading-none tracking-[-0.03em] text-ink" aria-live="off">
              {formatCountdown(left)}
            </p>
          </>
        )}
        <button
          type="button"
          onClick={skip}
          disabled={busy}
          className="mt-5 min-h-[52px] w-full rounded-full bg-thread px-4 text-[16px] font-semibold text-paper hover:opacity-90 disabled:opacity-60"
          data-testid="skip-cta"
        >
          {busy ? "Loading..." : "Skip the wait"}
        </button>
        <SeeAllPlans returnTo="/studio" />
        <button type="button" onClick={onClose} className="w-full py-2 text-[13.5px] text-muted hover:text-ink">
          Keep waiting
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Free accounts: the countdown to their next free reel, and how many uploads are waiting in the queue for it.
 * Tap it to skip the wait. When it reaches zero the page reloads, which starts the next queued upload (src/lib/queue.ts).
 */
export function QueueTimer({ nextAt, queued }: { nextAt: string | null; queued: number }) {
  const router = useRouter();
  const left = useCountdown(nextAt);
  const fired = useRef(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!nextAt || left > 0 || fired.current) return;
    if (Date.parse(nextAt) > Date.now()) return; // the shared clock hasn't ticked yet
    fired.current = true;
    router.refresh();
  }, [left, nextAt, router]);

  const popup = open && <SkipPopup left={left} onClose={() => setOpen(false)} />;

  if (left > 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-[16px] border border-line px-4 py-3 text-left transition-colors hover:border-thread"
          aria-label={`Next free reel in ${formatCountdown(left)}. Tap to skip the wait`}
          data-testid="queue-timer"
        >
          <div>
            <div className="text-[12.5px] font-semibold text-muted">Next free reel in</div>
            {queued > 0 && (
              <div className="mt-0.5 text-[13px] text-muted">
                {queued} {queued === 1 ? "upload" : "uploads"} queued, starts then
              </div>
            )}
          </div>
          <div className="font-mono text-[26px] font-bold tabular-nums leading-none text-ink" aria-live="off">
            {formatCountdown(left)}
          </div>
        </button>
        {popup}
      </>
    );
  }
  if (queued > 0) {
    return (
      <div className="rounded-[16px] border border-line px-4 py-3 text-[13.5px] text-muted" data-testid="queue-timer">
        <span className="font-semibold text-thread">Up next:</span> your queued {queued === 1 ? "upload starts" : "uploads start"} as soon as
        the one being made finishes.
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between rounded-[16px] border border-line px-4 py-3" data-testid="queue-timer">
      <div className="text-[12.5px] font-semibold text-muted">Next free reel</div>
      <div className="font-mono text-[15px] font-bold text-ink">Ready now</div>
    </div>
  );
}
