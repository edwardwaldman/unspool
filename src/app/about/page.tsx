import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage } from "@/components/shell/marketing-page";
import { formatPrice, PRICING } from "@/lib/config";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  { emoji: "📄", title: "Drop a doc", body: "Class notes, a textbook chapter, a work PDF, a contract. PDF, Word, PowerPoint, text or a photo of your notes." },
  { emoji: "🧵", title: "We unspool it", body: "Unspool reads the whole thing and plans 10 short reels that cover it in order — every definition, number, rule and deadline." },
  { emoji: "📱", title: "Swipe & absorb", body: "Each reel has a scroll-stopping hook, voiceover, word-by-word captions, animated visuals and a quick quiz." },
];

const faqs = [
  ["Is it accurate?", "Reels are written only from your document. Unspool doesn't add outside facts — if it isn't in the doc, it isn't in the reel. It's still a summary, so double-check anything high-stakes."],
  ["Who can see my files?", "Only you. Files are private to your account, never public, and never used to train AI. You can delete a document — file, scripts and audio — anytime."],
  ["What if I don't sign up?", "You can try it with no account. Anonymous uploads that are never unlocked are deleted automatically after 7 days."],
  ["How long are documents allowed to be?", "Up to about 60 pages / 40,000 words for now. Bigger files? We'll unspool the first part and tell you."],
  ["Is this legal or financial advice?", "No. For contracts and financial docs, Unspool summarizes what the document says; it isn't legal or financial advice."],
];

export default function AboutPage() {
  return (
    <MarketingPage>
      <section className="pt-10 text-center">
        <div className="font-mono text-[13px] uppercase tracking-[0.3em] text-accent">unspool.cc</div>
        <h1 className="mt-4 text-[44px] font-black leading-[1] tracking-[-0.035em] sm:text-[64px]">
          Your textbook,
          <br />
          <span className="text-accent glow-text">but it&apos;s reels.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[18px] text-soft">
          Drag in any document and Unspool turns it into 10 short, swipeable reels with viral hooks, voiceover, animated visuals and a quick quiz — so you actually absorb it.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-white px-6 py-3 text-[16px] font-extrabold text-[#0b1020]">
            Drop a doc
          </Link>
          <Link href="/s/demo" className="rounded-full bg-white/10 px-6 py-3 text-[16px] font-extrabold">
            ▶ Watch a sample
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="text-[36px]">{s.emoji}</div>
            <div className="mt-3 font-mono text-[12px] text-muted">0{i + 1}</div>
            <div className="text-[20px] font-black">{s.title}</div>
            <p className="mt-2 text-[15px] leading-relaxed text-soft">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-accent/20 to-transparent p-8">
          <div className="text-[13px] font-bold uppercase tracking-[0.2em] text-accent">For students</div>
          <h2 className="mt-2 text-[28px] font-black leading-tight">Cram the chapter in the time it takes to scroll.</h2>
          <p className="mt-3 text-[15px] text-soft">Test tips, common traps, memory hacks and a quiz in every reel. Then binge every spool in one feed the night before.</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-hlcyan/20 to-transparent p-8">
          <div className="text-[13px] font-bold uppercase tracking-[0.2em] text-hlcyan">For work</div>
          <h2 className="mt-2 text-[28px] font-black leading-tight">Read the contract in 60 seconds.</h2>
          <p className="mt-3 text-[15px] text-soft">Policies, onboarding docs, reports and contracts: what you must do, the deadlines, the money and the clauses to watch.</p>
        </div>
      </section>

      <section className="mt-20 text-center">
        <h2 className="text-[30px] font-black">Pricing</h2>
        <p className="mt-2 text-[16px] text-soft">
          Reel 1 free on every doc · {formatPrice(PRICING.documentCents)} to unlock a doc · {formatPrice(PRICING.subscriptionCents)}/mo unlimited
        </p>
        <Link href="/pricing" className="mt-4 inline-block text-[15px] font-bold text-accent">
          See pricing →
        </Link>
      </section>

      <section className="mx-auto mt-20 max-w-[720px]">
        <h2 className="text-center text-[30px] font-black">FAQ</h2>
        <div className="mt-6 divide-y divide-white/10">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="cursor-pointer list-none text-[17px] font-bold">
                {q}
                <span className="float-right text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-[15px] leading-relaxed text-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
