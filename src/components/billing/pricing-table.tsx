"use client";

import Link from "next/link";
import { useState } from "react";
import { BillingButton } from "@/components/shell/billing-button";
import { approxMonthly, formatCents, FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS, yearlySavingsPct, type Billing, type Tier } from "@/lib/plans";

// The plan table, with a Yearly / Weekly switch. Yearly is the default and shows the discounted price per week;
// switching to Weekly shows the full weekly price.

const COLS: Tier[] = ["free", "plus", "pro", "ultra"];
const yes = "Yes";
const no = "—";

const ROWS: [string, (t: Tier) => string][] = [
  ["Reels", (t) => (t === "free" ? `1 document: reel 1, then 1 every ${FREE_REEL_INTERVAL_MIN} min (up to ${FREE_REELS_PER_DAY}/day)` : `${PLANS[t].credits.toLocaleString("en-US")} reel credits a week`)],
  ["Pages per document", (t) => `Up to ${PLANS[t].maxPages}`],
  ["Every reel of a doc at once", (t) => (t === "free" ? no : yes)],
  ["Watermark on videos", (t) => (PLANS[t].watermark ? "Yes" : "None")],
  ["Share links", () => yes],
  ["Longer reels", (t) => (PLANS[t].longReels ? yes : no)],
  ["Edit any reel (\"make it simpler\")", (t) => (t === "pro" || t === "ultra" ? yes : no)],
  ["Reel style in Studio", (t) => (t === "pro" || t === "ultra" ? yes : no)],
  ["Priority queue", (t) => (PLANS[t].priority ? yes : no)],
  ["Early access to new features", (t) => (PLANS[t].earlyAccess ? yes : no)],
];

/** The headline price is always per week: on Yearly it's the yearly price spread over 52 weeks. */
function PriceCell({ tier, billing }: { tier: Tier; billing: Billing }) {
  if (tier === "free") return <div className="font-display text-[34px] leading-none">$0</div>;
  const weekly = PLANS[tier].priceCents;
  const yearlyPerWeek = Math.round(PLANS[tier].yearlyCents / 52);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-display text-[34px] leading-none">{formatCents(billing === "year" ? yearlyPerWeek : weekly)}</span>
        <span className="text-[14px] text-muted">/week</span>
        {billing === "year" && <span className="font-mono text-[13px] text-muted line-through">{formatCents(weekly)}</span>}
      </div>
      {billing === "year" ? (
        <div className="mt-1.5 text-[12.5px] text-muted">
          billed {formatCents(PLANS[tier].yearlyCents)} yearly{" "}
          <span className="whitespace-nowrap bg-thread px-1.5 py-[1px] font-mono text-[11px] font-semibold text-paper">save {yearlySavingsPct(tier)}%</span>
        </div>
      ) : (
        <div className="mt-1.5 font-mono text-[11.5px] text-muted">billed weekly · {approxMonthly(weekly)}</div>
      )}
    </div>
  );
}

function Cta({ tier, billing }: { tier: Tier; billing: Billing }) {
  if (tier === "free")
    return (
      <Link href="/" className="btn-secondary w-full py-3 text-[14px]">
        Upload a document
      </Link>
    );
  return <BillingButton key={billing} mode="subscribe" tier={tier} billing={billing} label={`Get ${PLANS[tier].name}${billing === "year" ? " yearly" : ""}`} />;
}

const MAX_SAVE = Math.max(...(["plus", "pro", "ultra"] as const).map(yearlySavingsPct));

export function PricingTable() {
  const [billing, setBilling] = useState<Billing>("year");
  return (
    <>
      <div className="mt-10 flex justify-center md:justify-start" role="tablist" aria-label="Billing">
        {(["year", "week"] as const).map((b) => (
          <button
            key={b}
            type="button"
            role="tab"
            aria-selected={billing === b}
            onClick={() => setBilling(b)}
            className={`-ml-px flex items-center gap-2 border px-5 py-2.5 text-[14px] font-medium ${billing === b ? "border-ink bg-ink text-paper" : "border-line text-muted hover:text-ink"}`}
          >
            {b === "year" ? "Yearly" : "Weekly"}
            {b === "year" && <span className={`font-mono text-[11px] font-semibold ${billing === b ? "text-paper/80" : "text-thread"}`}>save up to {MAX_SAVE}%</span>}
          </button>
        ))}
      </div>

      {/* Desktop: comparison table */}
      <section className="mt-6 hidden overflow-x-auto md:block" data-testid="tier-table">
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr>
              <th className="w-[22%] border border-line p-4 align-bottom font-normal text-muted">Plan</th>
              {COLS.map((t) => (
                <th key={t} className={`border p-4 align-top font-normal ${t === "plus" ? "border-thread" : "border-line"}`}>
                  <div className="label" style={t === "plus" ? { color: "var(--thread)" } : undefined}>
                    {PLANS[t].name}
                  </div>
                  <div className="mt-3">
                    <PriceCell tier={t} billing={billing} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, f]) => (
              <tr key={label}>
                <td className="border border-line p-4 text-muted">{label}</td>
                {COLS.map((t) => (
                  <td key={t} className="border border-line p-4 text-ink/90">
                    {f(t)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="border border-line p-4" />
              {COLS.map((t) => (
                <td key={t} className="border border-line p-4">
                  <Cta tier={t} billing={billing} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* Phones: one block per plan */}
      <section className="mt-6 md:hidden">
        {COLS.map((t) => (
          <div key={t} className={`-mt-px border p-5 ${t === "plus" ? "border-thread" : "border-line"}`}>
            <div className="label" style={t === "plus" ? { color: "var(--thread)" } : undefined}>
              {PLANS[t].name}
            </div>
            <div className="mt-3">
              <PriceCell tier={t} billing={billing} />
            </div>
            <dl className="mt-4 border-t border-line text-[14px]">
              {ROWS.map(([label, f]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-line py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right text-ink/90">{f(t)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <Cta tier={t} billing={billing} />
            </div>
          </div>
        ))}
      </section>

    </>
  );
}
