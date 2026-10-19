import type { Metadata } from "next";
import Link from "next/link";
import { BillingButton } from "@/components/shell/billing-button";
import { MarketingPage } from "@/components/shell/marketing-page";
import { approxMonthly, formatCents, FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS, TOPUP, TRIAL, yearlySavingsPct, type Tier } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing" };

const COLS: Tier[] = ["free", "plus", "pro", "ultra"];
const yes = "Yes";
const no = "—";

const ROWS: [string, (t: Tier) => string][] = [
  ["Reels", (t) => (t === "free" ? `1 reel per doc, then 1 every ${FREE_REEL_INTERVAL_MIN} min (up to ${FREE_REELS_PER_DAY}/day)` : `${PLANS[t].credits.toLocaleString("en-US")} reel credits a week`)],
  ["Pages per document", (t) => `Up to ${PLANS[t].maxPages}`],
  ["Every reel of a doc at once", (t) => (t === "free" ? no : yes)],
  ["Watermark on videos", (t) => (PLANS[t].watermark ? "Yes" : "None")],
  ["Share links", () => yes],
  ["Longer reels", (t) => (PLANS[t].longReels ? yes : no)],
  ["Priority queue", (t) => (PLANS[t].priority ? yes : no)],
  ["Early access to new features", (t) => (PLANS[t].earlyAccess ? yes : no)],
];

function PriceCell({ tier }: { tier: Tier }) {
  if (tier === "free") return <div className="font-display text-[34px] leading-none">$0</div>;
  const c = PLANS[tier].priceCents;
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-[34px] leading-none">{formatCents(c)}</span>
        <span className="text-[14px] text-muted">/week</span>
      </div>
      <div className="mt-1 font-mono text-[11.5px] text-muted">{approxMonthly(c)}</div>
      <div className="mt-3 border-t border-line pt-2 text-[13px]">
        or <span className="font-semibold text-ink">{formatCents(PLANS[tier].yearlyCents)}/year</span>{" "}
        <span className="whitespace-nowrap bg-thread px-1.5 py-[1px] font-mono text-[11px] font-semibold text-paper">save {yearlySavingsPct(tier)}%</span>
        <div className="mt-0.5 font-mono text-[11px] text-muted">≈ {formatCents(Math.round(PLANS[tier].yearlyCents / 52))}/week</div>
      </div>
    </div>
  );
}

function Cta({ tier }: { tier: Tier }) {
  if (tier === "free")
    return (
      <Link href="/" className="btn-secondary w-full py-3 text-[14px]">
        Upload a document
      </Link>
    );
  return (
    <div className="flex flex-col gap-2">
      <BillingButton mode="subscribe" tier={tier} label={`Get ${PLANS[tier].name} weekly`} />
      <BillingButton mode="subscribe" tier={tier} billing="year" secondary label={`Get ${PLANS[tier].name} yearly · save ${yearlySavingsPct(tier)}%`} />
    </div>
  );
}

export default function PricingPage() {
  return (
    <MarketingPage>
      <section className="pt-16">
        <div className="label">Pricing</div>
        <h1 className="mt-3 max-w-[640px] font-display text-[45px] leading-[0.98] sm:text-[58px]">
          Your first reel is free. <em className="text-thread">Every document.</em>
        </h1>
        <p className="mt-5 max-w-[560px] text-[16px] text-ink/80">
          Free gets reel 1 of every document, then 1 more every {FREE_REEL_INTERVAL_MIN} minutes, up to {FREE_REELS_PER_DAY} a day. Paid plans bill weekly, or yearly for less,
          in reel credits: 1 credit is 1 reel, and a document uses one credit per reel it plans. Credits reset every week, on yearly plans too.
        </p>
      </section>

      {/* Desktop: comparison table */}
      <section className="mt-12 hidden overflow-x-auto md:block" data-testid="tier-table">
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
                    <PriceCell tier={t} />
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
                  <Cta tier={t} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* Phones: one block per plan */}
      <section className="mt-10 md:hidden">
        {COLS.map((t) => (
          <div key={t} className={`-mt-px border p-5 ${t === "plus" ? "border-thread" : "border-line"}`}>
            <div className="label" style={t === "plus" ? { color: "var(--thread)" } : undefined}>
              {PLANS[t].name}
            </div>
            <div className="mt-3">
              <PriceCell tier={t} />
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
              <Cta tier={t} />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
        <div className="bg-paper p-6">
          <div className="label">Top-up</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-[34px] leading-none">{formatCents(TOPUP.priceCents)}</span>
            <span className="text-[14px] text-muted">once</span>
          </div>
          <p className="mt-2 text-[14px] text-ink/85">+{TOPUP.credits} reel credits on any plan, including Free. They never expire and are used after your weekly credits.</p>
          <div className="mt-5">
            <BillingButton mode="topup" label={`Buy ${TOPUP.credits} credits`} />
          </div>
        </div>
        <div className="bg-paper p-6">
          <div className="label">Try Plus free</div>
          <p className="mt-3 text-[14px] text-ink/85">
            {TRIAL.days}-day free trial of Plus, one per account (up to {TRIAL.maxReels} reels during the trial). Card required; it becomes Plus at{" "}
            {formatCents(PLANS.plus.priceCents)}/week unless you cancel before it ends.
          </p>
          <div className="mt-5">
            <BillingButton mode="trial" label="Start 1-day free trial" />
          </div>
        </div>
      </section>
      <p className="mt-6 text-[13px] text-muted">
        Prices in USD, billed weekly. Monthly figures are approximate (52 weeks ÷ 12). Switch plans anytime in billing; Stripe prorates the change. A reel
        that fails for good gives its credit back. Payments by Stripe; we never see your card.
      </p>
    </MarketingPage>
  );
}
