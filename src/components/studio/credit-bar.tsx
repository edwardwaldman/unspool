"use client";

import { Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatCents, TOPUP_PACKS, topupSavingsPct, type TopupPack } from "@/lib/plans";
import type { UsageDTO } from "@/lib/spool-types";
import { startCheckout } from "../billing/checkout";
import { shortDate } from "../billing/usage-meter";
import { Sheet } from "../ui/sheet";

const POLL_MS = 20_000;
const UNLIMITED = 100_000;

/** The account's credits, kept live: polled while the tab is visible, and refreshed on focus and after any unlock or purchase. */
function useCredits() {
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
export function CreditBar({ size = "md" }: { size?: "md" | "lg" }) {
  const usage = useCredits();
  const [open, setOpen] = useState(false);
  const c = usage ? counts(usage) : null;
  const big = size === "lg";
  return (
    <>
      <div className={`flex items-center gap-3 border border-line bg-surface ${big ? "px-4 py-2.5" : "px-3.5 py-2.5"}`} data-testid="credit-bar">
        <Zap size={big ? 18 : 16} className="shrink-0 text-thread" aria-hidden />
        <div className="min-w-0 flex-1" aria-live="polite">
          <div className={`font-display leading-none tabular-nums text-ink ${big ? "text-[22px]" : "text-[20px] ipad:text-[24px]"}`} data-testid="credit-count">
            {!c ? <span className="text-muted">…</span> : c.unlimited ? "Unlimited" : c.total.toLocaleString("en-US")}
            {c && !c.unlimited && <span className="ml-1.5 text-[13px] font-sans text-muted">{c.total === 1 ? "credit" : "credits"} left</span>}
          </div>
          {usage && c && !c.unlimited && (
            <div className="mt-1 truncate text-[11.5px] tabular-nums text-muted ipad:text-[13px]">
              {c.free
                ? `${c.weekly} free ${c.weekly === 1 ? "reel" : "reels"} today${usage.topup ? ` · ${usage.topup} top-up` : ""}`
                : `${c.weekly} this week · ${usage.topup} top-up · resets ${shortDate(usage.resetsAt)}`}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 bg-thread px-3.5 py-2 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-90 ipad:text-[15px]"
          data-testid="recharge"
        >
          Recharge
        </button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} label="Recharge credits">
        <RechargePanel />
      </Sheet>
    </>
  );
}

/** The top-up packs: the small one at full price, bigger ones cheaper per credit. */
function RechargePanel() {
  const [busy, setBusy] = useState<TopupPack["id"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const best = TOPUP_PACKS[TOPUP_PACKS.length - 1].id;
  const buy = async (pack: TopupPack) => {
    setBusy(pack.id);
    setErr(null);
    const problem = await startCheckout({ kind: "topup", pack: pack.id, returnTo: "/studio" });
    if (problem) {
      setErr(problem);
      setBusy(null);
    }
  };
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-6 pt-5" data-testid="recharge-panel">
      <h2 className="font-display text-[24px] leading-[1.1] text-ink">Recharge credits</h2>
      <p className="mt-1.5 text-[13px] leading-snug text-muted">1 credit = 1 reel. Top-up credits never expire and are used after your weekly ones. The bigger the pack, the less each credit costs.</p>
      <ul className="mt-4 space-y-2">
        {TOPUP_PACKS.map((p) => {
          const save = topupSavingsPct(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void buy(p)}
                className={`flex w-full items-center gap-3 border px-4 py-3 text-left transition-colors disabled:opacity-60 ${p.id === best ? "border-thread bg-thread/[0.06]" : "border-line hover:bg-white/[0.03]"}`}
                data-testid={`pack-${p.id}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-[19px] leading-none tabular-nums text-ink">{p.credits} credits</span>
                    {save > 0 && <span className="bg-thread px-1.5 py-[1px] font-mono text-[10.5px] font-semibold text-paper">SAVE {save}%</span>}
                    {p.id === best && <span className="font-mono text-[10.5px] text-thread">BEST VALUE</span>}
                  </span>
                  <span className="mt-1 block font-mono text-[11.5px] tabular-nums text-muted">
                    {(p.priceCents / p.credits).toFixed(1)}¢ per credit{save === 0 ? " · full price" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[16px] font-semibold tabular-nums text-ink">{busy === p.id ? "Opening" : formatCents(p.priceCents)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {err && <p className="mt-3 text-center text-[13px] text-coral">{err}</p>}
    </div>
  );
}
