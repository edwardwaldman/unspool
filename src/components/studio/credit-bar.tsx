"use client";

import { Check, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatCents, TOPUP_PACKS, topupSavingsPct, type TopupPack } from "@/lib/plans";
import type { UsageDTO } from "@/lib/spool-types";
import { startCheckout } from "../billing/checkout";
import { shortDate } from "../billing/usage-meter";

const POLL_MS = 20_000;
const UNLIMITED = 100_000;

/** The account's credits, kept live: polled while the tab is visible, and refreshed on focus and after any unlock or purchase. */
export function useCredits() {
  const [usage, setUsage] = useState<UsageDTO | null>(null);
  const load = useCallback(async () => {
    const res = await fetch("/api/credits", { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return;
    const body = (await res.json().catch(() => null)) as { usage?: UsageDTO } | null;
    if (body?.usage) setUsage(body.usage);
  }, []);
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && void load();
    const first = window.setTimeout(() => void load(), 0);
    const id = window.setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    window.addEventListener("unspool:reload", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      window.removeEventListener("unspool:reload", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);
  return usage;
}

/** Spendable credits: this week's allowance left plus top-ups (free accounts: top-ups, with free reels shown beside). */
function counts(u: UsageDTO) {
  const free = u.tier === "free";
  const weekly = free ? Math.max(0, u.freePerDay - u.freeUsedToday) : u.left;
  return { free, weekly, total: (free ? 0 : weekly) + u.topup, unlimited: u.allowance >= UNLIMITED };
}

/** "47 credits" + Recharge: the live meter at the top of Studio. */
export function CreditBar({ size = "md", recharge = true }: { size?: "md" | "lg"; /** Show the Recharge button (off where the header carries it). */ recharge?: boolean }) {
  const usage = useCredits();
  const [open, setOpen] = useState(false);
  const c = usage ? counts(usage) : null;
  const big = size === "lg";
  return (
    <>
      <div className={`flex items-center gap-3 border border-line bg-surface ${big ? "px-4 py-2.5" : "px-3.5 py-2.5"}`} data-testid="credit-bar" data-tour="credit-bar">
        <Zap size={big ? 18 : 16} className="shrink-0 text-thread" aria-hidden />
        <div className="min-w-0 flex-1" aria-live="polite">
          <div className={`font-display leading-none tabular-nums text-ink ${big ? "text-[22px]" : "text-[20px] ipad:text-[24px]"}`} data-testid="credit-count">
            {!c ? <span className="text-muted">…</span> : c.unlimited ? "Unlimited" : c.total.toLocaleString("en-US")}
            {c && !c.unlimited && <span className="ml-1.5 text-[13px] font-sans text-muted">{c.total === 1 ? "credit" : "credits"} left</span>}
          </div>
          {usage && c && !c.unlimited && (
            <div className="mt-1 truncate text-[11.5px] tabular-nums text-muted ipad:text-[13px]">
              {c.free
                ? `${c.weekly} free ${c.weekly === 1 ? "reel" : "reels"} today${usage.topup ? `, ${usage.topup} top-up` : ""}`
                : `${c.weekly} this week, ${usage.topup} top-up, resets ${shortDate(usage.resetsAt)}`}
            </div>
          )}
        </div>
        {recharge && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 bg-thread px-3.5 py-2 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-90 ipad:text-[15px]"
            data-testid="recharge"
          >
            Recharge
          </button>
        )}
      </div>
      <RechargePopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Recharge on its own (the phone Studio's header, next to the account icon): opens the same top-up sheet. */
export function RechargeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-3.5 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:border-thread ipad:px-4 ipad:text-[15px]"
        data-testid="recharge"
      >
        Recharge
      </button>
      <RechargePopup open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Recharge as a centred pop-up that springs in (and fades out), closed by the ×, a tap outside or Escape. */
function RechargePopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" key="recharge">
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Recharge credits"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="relative max-h-[88dvh] w-full max-w-[400px] overflow-y-auto overscroll-contain rounded-[24px] bg-surface shadow-[0_24px_70px_rgba(0,0,0,.55)]"
          >
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-muted hover:text-ink">
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
            <RechargePanel />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** The top-up packs: the small one at full price, bigger ones cheaper per credit. */
function RechargePanel() {
  const best = TOPUP_PACKS[TOPUP_PACKS.length - 1].id;
  // Pick a pack (a radio list), then one button buys it.
  const [picked, setPicked] = useState<TopupPack["id"]>(best);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pack = TOPUP_PACKS.find((p) => p.id === picked) ?? TOPUP_PACKS[0];
  const buy = async () => {
    setBusy(true);
    setErr(null);
    const problem = await startCheckout({ kind: "topup", pack: pack.id, returnTo: "/studio" });
    if (problem) {
      setErr(problem);
      setBusy(false);
    }
  };
  return (
    <div className="w-full px-5 pb-5 pt-5" data-testid="recharge-panel">
      <h2 className="pr-12 font-display text-[24px] leading-[1.1] text-ink">Recharge credits</h2>
      <p className="mt-1.5 text-[13px] leading-snug text-muted">1 credit = 1 reel. Top-up credits never expire and are used after your weekly ones. The bigger the pack, the less each credit costs.</p>
      <div className="mt-4 space-y-2" role="radiogroup" aria-label="Credit pack">
        {TOPUP_PACKS.map((p) => {
          const save = topupSavingsPct(p);
          const on = p.id === picked;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={busy}
              onClick={() => setPicked(p.id)}
              className={`flex w-full items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-colors disabled:opacity-60 ${on ? "border-thread bg-thread/[0.07]" : "border-line hover:bg-white/[0.03]"}`}
              data-testid={`pack-${p.id}`}
            >
              {/* the selection mark: an empty ring, or a filled lime circle with a tick */}
              <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-thread bg-thread text-paper" : "border-line"}`} aria-hidden>
                {on && <Check size={13} strokeWidth={3.2} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="whitespace-nowrap font-display text-[19px] leading-none tabular-nums text-ink">{p.credits} credits</span>
                  {save > 0 && <span className="whitespace-nowrap rounded-[4px] bg-thread px-1.5 py-[1px] font-mono text-[10.5px] font-semibold text-paper">SAVE {save}%</span>}
                  {p.id === best && <span className="whitespace-nowrap font-mono text-[10.5px] text-thread">BEST VALUE</span>}
                </span>
                <span className="mt-1 block font-mono text-[11.5px] tabular-nums text-muted">
                  {(p.priceCents / p.credits).toFixed(1)}¢ per credit{save === 0 ? ", full price" : ""}
                </span>
              </span>
              <span className="shrink-0 text-[16px] font-semibold tabular-nums text-ink">{formatCents(p.priceCents)}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className="mt-4 min-h-[52px] w-full rounded-full bg-thread px-4 text-[16px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        data-testid="recharge-buy"
      >
        {busy ? "Opening checkout..." : `Buy ${pack.credits} credits for ${formatCents(pack.priceCents)}`}
      </button>
      {err && <p className="mt-3 text-center text-[13px] text-coral">{err}</p>}
    </div>
  );
}
