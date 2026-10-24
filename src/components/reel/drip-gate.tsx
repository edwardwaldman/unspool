"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { approxMonthly, formatCents, nextTier, type Tier } from "@/lib/plans";
import type { SpoolDTO, UsageDTO, ViewerDTO } from "@/lib/spool-types";
import { startCheckout, unlockReels, type CheckoutRequest } from "../billing/checkout";
import { shortDate } from "../billing/usage-meter";
import { formatCountdown, useCountdown } from "../ui/use-countdown";
import { PaywallSheet } from "./paywall-sheet";

const NAME: Record<Tier, string> = { free: "Free", plus: "Plus", pro: "Pro", ultra: "Ultra" };

function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-black/55 sm:items-center sm:px-4 sm:py-8"
      role="dialog"
      aria-modal
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[420px] border border-line bg-surface p-6" data-testid="unlock-sheet">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center border border-line text-muted hover:text-ink">
          <X size={18} strokeWidth={1.5} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function useCheckout(documentId: string | undefined, reel: number) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const go = async (key: string, req: CheckoutRequest) => {
    setErr(null);
    setBusy(key);
    const e = await startCheckout(req, documentId, reel);
    if (e) {
      setErr(e);
      setBusy(null);
    }
  };
  return { busy, setBusy, err, setErr, go };
}

function Price({ cents, unit = "/week" }: { cents: number; unit?: string }) {
  return (
    <span className="text-right">
      <span className="block font-mono text-[13px]">
        {formatCents(cents)}
        {unit}
      </span>
      {unit === "/week" && <span className="block text-[10.5px] text-muted">{approxMonthly(cents)}</span>}
    </span>
  );
}

/**
 * Free tier: reel 1 of each document is free, then the next reel can be unlocked every 30 minutes
 * (generated on demand), up to 5 a day. Shows the countdown, unlocks the reel when the timer is up,
 * and offers the 1-day Plus trial, an upgrade, or a top-up.
 */
export function DripGate({ open, onClose, spool, usage, reel }: { open: boolean; onClose: () => void; spool: SpoolDTO; usage: UsageDTO; reel: number }) {
  const left = useCountdown(spool.nextFreeUnlockAt);
  const { busy, setBusy, err, setErr, go } = useCheckout(spool.id, reel);
  const [unlocking, setUnlocking] = useState(false);
  const tried = useRef(false);
  const capped = usage.freeUsedToday >= usage.freePerDay;
  const nextReel = spool.freeReels + 1;
  const timerUp = !spool.nextFreeUnlockAt || left === 0;
  const canFree = timerUp && !capped && reel === nextReel;

  // Timer is up and they opened the next reel: unlock it (the server checks again) and generate it now.
  useEffect(() => {
    if (!open || !canFree || tried.current) return;
    tried.current = true;
    setUnlocking(true);
    unlockReels(spool.id, "free").then((r) => {
      setUnlocking(false);
      if (r.status === "ok") onClose();
      else if (r.status === "cap") setErr(`You've used today's ${usage.freePerDay} free reels.`);
      else if (r.status !== "wait") setErr(r.error ?? "Couldn't unlock this reel.");
    });
  }, [open, canFree, spool.id, onClose, setErr, usage.freePerDay]);

  if (!open) return null;
  const plus = usage.prices.plus;

  return (
    <Modal label="Next free reel" onClose={onClose}>
      {/* A free account that can still take the trial: lead with it. */}
      {usage.trialEligible && (
        <div className="mb-5 mr-10" data-testid="trial-pitch">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-thread">Free for 1 day</p>
          <h2 className="mt-1 font-display text-[28px] leading-[1.05]">Watch every reel now</h2>
          <p className="mt-2 text-[14px] leading-snug text-muted">
            Try Plus free for a day: up to 30 reels, no watermark, no waiting. Cancel before it ends and you pay nothing.
          </p>
          <button type="button" onClick={() => go("trial", { kind: "trial" })} disabled={busy !== null} className="mt-4 min-h-[52px] w-full bg-thread px-4 text-[16px] font-semibold text-paper hover:opacity-90 disabled:opacity-60" data-testid="trial-cta">
            {busy === "trial" ? "Opening checkout" : "Start my free day"}
          </button>
        </div>
      )}
      <div
        className="mr-10 px-4 py-5 text-center"
        style={{ background: "color-mix(in srgb, var(--thread) 10%, var(--paper))", border: "1px solid color-mix(in srgb, var(--thread) 45%, transparent)" }}
        data-testid="drip-countdown"
      >
        {unlocking ? (
          <p className="py-3 text-[15px] font-semibold text-thread">Unspooling your next free reel</p>
        ) : capped ? (
          <>
            <p className="text-[12.5px] font-semibold text-thread">Free reels today</p>
            <p className="mt-1 font-mono text-[40px] font-bold leading-none text-thread">
              {usage.freeUsedToday} of {usage.freePerDay}
            </p>
            <p className="mt-2 text-[12.5px] text-muted">More free reels tomorrow.</p>
          </>
        ) : left > 0 ? (
          <>
            <p className="text-[12.5px] font-semibold text-thread">Next free reel in</p>
            <p className="mt-1 font-mono text-[52px] font-bold leading-none tracking-[-0.03em] text-thread" aria-live="off">
              {formatCountdown(left)}
            </p>
          </>
        ) : (
          <>
            <p className="text-[12.5px] font-semibold text-thread">Your next free reel is ready</p>
            <p className="mt-2 text-[13px] text-muted">Open part {nextReel} to unspool it.</p>
          </>
        )}
      </div>

      <h2 className="mt-5 font-display text-[26px] leading-[1.1]">Don&apos;t want to wait?</h2>
      <p className="mt-2 text-[14px] leading-snug text-muted">
        Free gets reel 1 of every document, then 1 every {usage.freeIntervalMin} min (up to {usage.freePerDay} a day). Plus gives you{" "}
        {plus.credits} reels a week, all at once.
      </p>

      <button
        type="button"
        onClick={() => go("plus", { kind: "subscription", tier: "plus" })}
        disabled={busy !== null}
        className={`${usage.trialEligible ? "btn-secondary mt-5" : "btn-primary mt-5"} w-full justify-between px-4 py-3 text-[14.5px]`}
      >
        <span>{busy === "plus" ? "Opening checkout" : "Upgrade to Plus"}</span>
        <Price cents={plus.cents} />
      </button>
      {usage.topup > 0 ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("use");
            const r = await unlockReels(spool.id, "credits");
            setBusy(null);
            if (r.status === "ok") onClose();
            else setErr("Couldn't use your top-up credits.");
          }}
          className="mt-3 w-full text-center text-[13.5px] text-thread hover:underline"
        >
          {busy === "use" ? "Unlocking" : `Use top-up credits (${usage.topup} left)`}
        </button>
      ) : (
        <button type="button" onClick={() => go("topup", { kind: "topup" })} disabled={busy !== null} className="mt-3 w-full text-center text-[13.5px] text-thread hover:underline">
          {busy === "topup" ? "Opening checkout" : `Or top up ${usage.topupCredits} reels for ${formatCents(usage.topupCents)}`}
        </button>
      )}
      {err && (
        <p role="alert" className="mt-2 text-center text-[13px] text-coral">
          {err}
        </p>
      )}
      <button type="button" onClick={onClose} className="mt-3 w-full text-center text-[13.5px] text-muted hover:text-ink">
        I&apos;ll wait
      </button>
      {usage.trialEligible && (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-muted">
          Card required. The trial turns into Plus at {formatCents(plus.cents)}/week after 1 day unless you cancel.
        </p>
      )}
    </Modal>
  );
}

/**
 * Paid tiers out of credits (the hook): how much they've unspooled this week and what the next tier
 * gives, plus a top-up. When credits are available again it spends them on this document instead.
 */
export function UpgradeSheet({ open, onClose, spool, usage, reel }: { open: boolean; onClose: () => void; spool: SpoolDTO | null; usage: UsageDTO; reel: number }) {
  const { busy, setBusy, err, setErr, go } = useCheckout(spool?.id, reel);
  if (!open) return null;
  const next = nextTier(usage.tier);
  const cur = usage.tier === "free" ? null : usage.prices[usage.tier];
  const nxt = next ? usage.prices[next] : null;
  const times = cur && nxt ? Math.round(nxt.credits / Math.max(1, usage.allowance || cur.credits)) : null;
  const available = usage.left + usage.topup;
  const locked = spool?.reels.filter((r) => r.locked).length ?? 0;

  return (
    <Modal label="Out of credits" onClose={onClose}>
      <p className="text-[13px] font-semibold text-thread">{NAME[usage.tier]}{usage.trialing ? " trial" : ""}</p>
      <h2 className="mt-2.5 mr-10 font-display text-[26px] leading-[1.1]" data-testid="upgrade-headline">
        You&apos;ve unspooled {usage.used} reels this week.
        {next && times ? ` ${NAME[next]} gives you ${times}× more.` : ""}
      </h2>
      <p className="mt-2 text-[14px] leading-snug text-muted">
        {available > 0
          ? `You have ${available} credits available.`
          : `Your credits reset ${shortDate(usage.resetsAt)}.`}
        {locked > 0 ? ` ${locked} ${locked === 1 ? "reel" : "reels"} of this document are locked.` : ""}
      </p>

      {next && nxt && cur && (
        <div className="mt-5 grid grid-cols-2 border-l border-t border-line text-[13px]" data-testid="tier-compare">
          {[
            [NAME[usage.tier], cur],
            [NAME[next], nxt],
          ].map(([name, p], i) => (
            <div key={i} className={`border-b border-r border-line p-3 ${i === 1 ? "bg-paper" : ""}`}>
              <div className={`text-[12.5px] font-semibold ${i === 1 ? "text-thread" : "text-muted"}`}>{name as string}</div>
              <div className="mt-1 font-mono text-[20px] font-bold text-ink">{(p as { credits: number }).credits.toLocaleString("en-US")}</div>
              <div className="text-[11.5px] text-muted">reels a week</div>
              <div className="mt-2 font-mono text-[12.5px]">{formatCents((p as { cents: number }).cents)}/week</div>
              <div className="text-[10.5px] text-muted">{approxMonthly((p as { cents: number }).cents)}</div>
            </div>
          ))}
        </div>
      )}

      {available > 0 && spool && locked > 0 ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("use");
            const r = await unlockReels(spool.id, "credits");
            setBusy(null);
            if (r.status === "ok") onClose();
            else setErr("Couldn't unlock with credits.");
          }}
          className="btn-primary mt-5 w-full py-3.5 text-[15px]"
        >
          {busy === "use" ? "Unlocking" : `Unlock ${Math.min(locked, available)} reels with credits`}
        </button>
      ) : next ? (
        <button type="button" onClick={() => go("up", { kind: "subscription", tier: next })} disabled={busy !== null} className="btn-primary mt-5 w-full py-3.5 text-[15px]">
          {busy === "up" ? "Opening" : `Upgrade to ${NAME[next]}`}
        </button>
      ) : null}
      <button type="button" onClick={() => go("topup", { kind: "topup" })} disabled={busy !== null} className="btn-secondary -mt-px w-full justify-between px-4 py-3 text-[14.5px]">
        <span>{busy === "topup" ? "Opening checkout" : `Top up ${usage.topupCredits} reels`}</span>
        <span className="font-mono text-[13px] text-muted">{formatCents(usage.topupCents)} once</span>
      </button>
      {err && (
        <p role="alert" className="mt-2 text-center text-[13px] text-coral">
          {err}
        </p>
      )}
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">Plan changes are prorated by Stripe. Top-up credits never expire.</p>
    </Modal>
  );
}

/** What a locked reel opens: sign-in (signed out or demo), the free drip gate, or the upgrade sheet. */
export function UnlockSheet({ open, onClose, spool, viewer, reel }: { open: boolean; onClose: () => void; spool: SpoolDTO; viewer: ViewerDTO | null; reel: number }) {
  const usage = viewer?.usage;
  if (spool.demo || !viewer?.signedIn || !usage) return <PaywallSheet open={open} onClose={onClose} spool={spool} viewer={viewer} reel={reel} />;
  if (usage.tier === "free") return <DripGate key={`${spool.nextFreeUnlockAt}-${reel}`} open={open} onClose={onClose} spool={spool} usage={usage} reel={reel} />;
  return <UpgradeSheet open={open} onClose={onClose} spool={spool} usage={usage} reel={reel} />;
}
