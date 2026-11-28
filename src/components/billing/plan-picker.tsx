"use client";

import { useState } from "react";
import { PAID_TIERS, PLANS, approxMonthly, formatCents, priceFor, yearlySavingsPct, type Billing, type Tier } from "@/lib/plans";
import { track } from "../analytics/track";
import { Sheet } from "../ui/sheet";
import { toast } from "../ui/toast";
import { startCheckout } from "./checkout";

const PERKS: Record<Exclude<Tier, "free">, string> = {
  plus: "reel style, no watermark, up to 60 pages",
  pro: "priority, longer reels, up to 150 pages",
  ultra: "everything in Pro, up to 300 pages, early features",
};

/**
 * Every paid plan in one sheet: weekly or yearly, Plus / Pro / Ultra, each straight to Stripe checkout.
 * Opened from "See all plans" next to the one-tap trial button, so the default path stays one tap.
 */
/** The small "See all plans" link that opens the picker, for under a one-tap trial button. */
export function SeeAllPlans({ returnTo }: { returnTo?: "/studio" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          track("plans_opened");
          setOpen(true);
        }}
        className="mt-2 w-full py-2 text-center text-[13.5px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
        data-testid="see-all-plans"
      >
        See all plans
      </button>
      <PlanPicker open={open} onClose={() => setOpen(false)} returnTo={returnTo} />
    </>
  );
}

export function PlanPicker({ open, onClose, returnTo }: { open: boolean; onClose: () => void; returnTo?: "/studio" }) {
  const [billing, setBilling] = useState<Billing>("week");
  const [busy, setBusy] = useState<Tier | null>(null);
  const pick = async (tier: Exclude<Tier, "free">) => {
    setBusy(tier);
    track("plan_picked", `${tier} ${billing}`);
    const err = await startCheckout({ kind: "subscription", tier, billing, returnTo });
    if (err) {
      toast(err, 4000);
      setBusy(null);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} label="All plans" z={90}>
      <div className="max-h-[78dvh] overflow-y-auto px-5 pb-6 pt-2" data-testid="plan-picker">
        <div className="font-display text-[22px] text-ink">Pick a plan</div>
        <div className="mt-3 inline-flex rounded-full border border-line p-1" role="tablist" aria-label="Billing">
          {(["week", "year"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={billing === b}
              onClick={() => setBilling(b)}
              className={`rounded-full px-4 py-1.5 text-[13.5px] font-semibold ${billing === b ? "bg-ink text-paper" : "text-muted"}`}
            >
              {b === "week" ? "Weekly" : `Yearly (save up to ${Math.max(...PAID_TIERS.map(yearlySavingsPct))}%)`}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-2.5">
          {PAID_TIERS.map((tier) => {
            const p = PLANS[tier];
            const cents = priceFor(tier, billing);
            return (
              <li key={tier}>
                <button
                  type="button"
                  onClick={() => pick(tier)}
                  disabled={busy !== null}
                  className="flex w-full items-center gap-3 rounded-[18px] border border-line px-4 py-4 text-left transition-colors hover:border-thread disabled:opacity-60"
                  data-testid={`plan-${tier}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-semibold text-ink">{p.name}</span>
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted">
                      {p.credits} reels a week, {PERKS[tier]}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[17px] font-bold text-ink">{busy === tier ? "…" : formatCents(cents)}</div>
                    <div className="text-[11.5px] text-muted">{billing === "week" ? `/week (${approxMonthly(cents)})` : "/year"}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[12px] text-muted">Cancel any time from Plan & billing. Secure checkout by Stripe.</p>
      </div>
    </Sheet>
  );
}
