"use client";

import { useEffect, useState } from "react";
import { DEAL, dealActive } from "@/lib/plans";

/** Time left until the deal's one fixed end, ticking each second. Null before mount (no hydration mismatch) and after it ends. */
function useDealLeft() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);
  if (now === null || !dealActive(now)) return null;
  return Math.max(0, Date.parse(DEAL.endsAt) - now);
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${p(h)}h ${p(m)}m` : `${p(h)}:${p(m)}:${p(sec)}`;
}

/**
 * The Black Friday offer with its real countdown. "bar" for the pricing page, "compact" inside the paywall.
 * Renders nothing outside the deal window, so it disappears by itself when the deal ends.
 */
export function DealBanner({ variant = "bar", trial = false }: { variant?: "bar" | "compact"; trial?: boolean }) {
  const left = useDealLeft();
  if (left === null) return null;
  const offer = trial ? `Start free, then ${DEAL.weekPct}% off your first month` : `${DEAL.weekPct}% off your first month, ${DEAL.yearPct}% off yearly`;
  if (variant === "compact")
    return (
      <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2 text-[12.5px] font-semibold" style={{ background: "#14141f", color: "#ffd23f" }} data-testid="deal-banner">
        <span>{DEAL.name}: {offer}</span>
        <span className="font-mono tabular-nums text-white" aria-label="Time left in the deal">{fmt(left)}</span>
      </div>
    );
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ background: "#14141f", color: "#fff" }} data-testid="deal-banner">
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#ffd23f" }}>{DEAL.name}, limited time</div>
        <div className="mt-1 text-[17px] font-semibold">{DEAL.weekPct}% off your first month on weekly plans, {DEAL.yearPct}% off your first year on yearly. Applied at checkout.</div>
      </div>
      <div className="text-right">
        <div className="text-[11px] uppercase tracking-[0.12em] text-white/60">Ends in</div>
        <div className="font-mono text-[26px] font-bold tabular-nums" style={{ color: "#ffd23f" }}>{fmt(left)}</div>
      </div>
    </div>
  );
}
