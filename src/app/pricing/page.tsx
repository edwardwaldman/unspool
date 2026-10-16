import type { Metadata } from "next";
import Link from "next/link";
import { BillingButton } from "@/components/shell/billing-button";
import { MarketingPage } from "@/components/shell/marketing-page";
import { formatPrice, LIMITS, PRICING } from "@/lib/config";

export const metadata: Metadata = { title: "Pricing" };

function Plan({
  name,
  price,
  unit,
  note,
  items,
  featured,
  children,
}: {
  name: string;
  price: string;
  unit?: string;
  note: string;
  items: string[];
  featured?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col border p-7 ${featured ? "border-thread" : "border-line"} -ml-px -mt-px`}>
      <div className="label" style={featured ? { color: "var(--thread)" } : undefined}>
        {name}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-[42px] leading-none">{price}</span>
        {unit && <span className="text-[15px] text-muted">{unit}</span>}
      </div>
      <div className="mt-2 font-mono text-[12px] text-muted">{note}</div>
      <ul className="mt-6 border-t border-line text-[14.5px]">
        {items.map((i) => (
          <li key={i} className="border-b border-line py-2.5 text-ink/85">
            {i}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-7">{children}</div>
    </div>
  );
}

export default function PricingPage() {
  const perReel = formatPrice(Math.round(PRICING.documentCents / 10));
  return (
    <MarketingPage>
      <section className="pt-16">
        <div className="label">Pricing</div>
        <h1 className="mt-3 max-w-[640px] font-display text-[45px] leading-[0.98] sm:text-[58px]">
          Reel one is free. <em className="text-thread">Every time.</em>
        </h1>
        <p className="mt-5 max-w-[520px] text-[16px] text-ink/80">
          See the first reel and all ten titles for any document before you pay anything.
        </p>
      </section>
      <section className="mt-14 grid pl-px pt-px md:grid-cols-3">
        <Plan
          name="Free"
          price="$0"
          note={`${LIMITS.freeUploadsPerDay} documents a day`}
          items={["Reel 1 of every document", "All 10 titles and hooks", "No account needed"]}
        >
          <Link href="/" className="btn-secondary w-full py-3 text-[14px]">
            Upload a document
          </Link>
        </Plan>
        <Plan
          name="One document"
          price={formatPrice(PRICING.documentCents)}
          note={`${perReel} per reel`}
          items={["All 10 reels for that document", "Voiceover, visuals and quizzes", "Rewatch anytime"]}
        >
          <p className="text-[13px] text-muted">Unlock from inside any spool.</p>
        </Plan>
        <Plan
          name="Unlimited"
          price={formatPrice(PRICING.subscriptionCents)}
          unit="/month"
          note="Cancel anytime"
          items={["Unlimited documents", "Every reel unlocked", "One review feed across all your docs"]}
          featured
        >
          <BillingButton mode="subscribe" />
        </Plan>
      </section>
      <p className="mt-6 text-[13px] text-muted">Prices in USD. Payments by Stripe; we never see your card.</p>
    </MarketingPage>
  );
}
