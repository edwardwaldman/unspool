import type { Metadata } from "next";
import Link from "next/link";
import { BillingButton } from "@/components/shell/billing-button";
import { MarketingPage } from "@/components/shell/marketing-page";
import { formatPrice, LIMITS, PRICING } from "@/lib/config";

export const metadata: Metadata = { title: "Pricing" };

const check = "mr-2 text-good";

export default function PricingPage() {
  return (
    <MarketingPage>
      <section className="pt-10 text-center">
        <h1 className="text-[40px] font-black leading-tight tracking-[-0.03em] sm:text-[52px]">Simple pricing</h1>
        <p className="mx-auto mt-3 max-w-[520px] text-[17px] text-soft">
          Every document gets reel 1 and all 10 titles free. Unlock the rest when it clicks.
        </p>
      </section>
      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <div className="text-[15px] font-bold text-muted">Free</div>
          <div className="mt-2 text-[40px] font-black">$0</div>
          <ul className="mt-5 space-y-2.5 text-[15px] text-soft">
            <li><span className={check}>✓</span>Reel 1 of every document</li>
            <li><span className={check}>✓</span>All 10 titles &amp; hooks</li>
            <li><span className={check}>✓</span>{LIMITS.freeUploadsPerDay} uploads a day</li>
            <li><span className={check}>✓</span>No sign-up to try</li>
          </ul>
          <Link href="/" className="mt-7 block rounded-2xl bg-white/10 py-3.5 text-center font-extrabold">
            Drop a doc
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <div className="text-[15px] font-bold text-muted">Per document</div>
          <div className="mt-2 text-[40px] font-black">{formatPrice(PRICING.documentCents)}</div>
          <ul className="mt-5 space-y-2.5 text-[15px] text-soft">
            <li><span className={check}>✓</span>All 10 reels for one doc</li>
            <li><span className={check}>✓</span>Voiceover, visuals &amp; quizzes</li>
            <li><span className={check}>✓</span>Yours to rewatch anytime</li>
          </ul>
          <p className="mt-7 text-center text-[13px] text-muted">Unlock from inside any spool.</p>
        </div>
        <div className="rounded-3xl border border-accent/50 bg-accent/[0.07] p-7 shadow-[0_0_60px_rgba(77,159,255,0.15)]">
          <div className="text-[15px] font-bold text-accent">Unlimited</div>
          <div className="mt-2 text-[40px] font-black">
            {formatPrice(PRICING.subscriptionCents)}
            <span className="text-[17px] font-semibold text-muted">/mo</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-[15px] text-soft">
            <li><span className={check}>✓</span>Unlimited documents</li>
            <li><span className={check}>✓</span>Every reel unlocked</li>
            <li><span className={check}>✓</span>&quot;All spools&quot; review feed before tests</li>
            <li><span className={check}>✓</span>Cancel anytime</li>
          </ul>
          <div className="mt-7">
            <BillingButton mode="subscribe" />
          </div>
        </div>
      </section>
      <p className="mt-8 text-center text-[13px] text-muted">Prices in USD. Payments are handled securely by Stripe.</p>
    </MarketingPage>
  );
}
