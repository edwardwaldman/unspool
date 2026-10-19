import type { Metadata } from "next";
import { BillingButton } from "@/components/shell/billing-button";
import { MarketingPage } from "@/components/shell/marketing-page";
import { PricingTable } from "@/components/billing/pricing-table";
import { formatCents, FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS, TOPUP, TRIAL } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing" };


export default function PricingPage() {
  return (
    <MarketingPage>
      <section className="pt-16">
        <div className="label">Pricing</div>
        <h1 className="mt-3 max-w-[640px] font-display text-[45px] leading-[0.98] sm:text-[58px]">
          Plans for every <em className="text-thread">reading list.</em>
        </h1>
        <p className="mt-5 max-w-[560px] text-[16px] text-ink/80">
          Free gets 1 document: its first reel, then 1 more every {FREE_REEL_INTERVAL_MIN} minutes, up to {FREE_REELS_PER_DAY} a day. Paid plans bill weekly, or yearly for less,
          in reel credits: 1 credit is 1 reel, and a document uses one credit per reel it plans. Credits reset every week, on yearly plans too.
        </p>
      </section>

      <PricingTable />

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
