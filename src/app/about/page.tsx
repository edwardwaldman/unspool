import type { Metadata } from "next";
import Link from "next/link";
import { HowSteps } from "@/components/shell/how-steps";
import { MarketingPage } from "@/components/shell/marketing-page";
import { formatCents, FREE_REEL_INTERVAL_MIN, FREE_REELS_PER_DAY, PLANS, TOPUP } from "@/lib/plans";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { buildSegments } from "@/lib/segments";
import { estimateDuration } from "@/lib/timing";

export const metadata: Metadata = { title: "How it works" };

const steps: [string, string][] = [
  ["Drop a doc", "Class notes, a textbook chapter, a work PDF, a contract. PDF, Word, PowerPoint, text, or a photo of your notes."],
  ["We read all of it", "Unspool plans one reel per key idea, in order, covering the whole document: every definition, number, rule and deadline."],
  ["Swipe through", "Each reel has a hook, voiceover, word-by-word captions, a visual for every beat and a quick quiz."],
];

const faqs = [
  ["Is it accurate?", "Reels are written only from your document. If it isn't in the doc, it isn't in the reel. It is still a summary, so check anything high-stakes against the original."],
  ["Who can see my files?", "Only you. Files are private, never public and never used to train AI. Delete a document and its file, scripts and audio go with it."],
  ["Do I need an account?", "Yes, a free one. Pick your file, sign up with your email, and your first reel is ready in minutes."],
  [
    "How long can a document be?",
    `Up to ${PLANS.free.maxPages} pages on Free, ${PLANS.plus.maxPages} on Plus, ${PLANS.pro.maxPages} on Pro and ${PLANS.ultra.maxPages} on Ultra. Longer files are cut at that point, and we tell you.`,
  ],
  [
    "What's free?",
    `Your first reel of every document is free. Then 1 more every ${FREE_REEL_INTERVAL_MIN} minutes, up to ${FREE_REELS_PER_DAY} free reels a day. Paid plans bill weekly in reel credits (1 credit = 1 reel), and a ${formatCents(TOPUP.priceCents)} top-up adds ${TOPUP.credits} credits that never expire.`,
  ],
  ["Is this legal or financial advice?", "No. For contracts and financial documents, Unspool summarizes what the document says."],
];

/** Anatomy of the sample reel: real segment timings from its script. */
function ReelAnatomy() {
  const script = SAMPLE_SPOOL.reels[0].script!;
  const segs = buildSegments(script).map((s) => ({
    kind: s.kind === "beat" ? (s.beatIndex === 0 ? "Hook" : "Body") : s.kind === "quiz" || s.kind === "explain" ? "Quiz" : "Outro",
    seconds: estimateDuration(s.speech),
  }));
  const total = segs.reduce((a, s) => a + s.seconds, 0);
  const groups = ["Hook", "Body", "Quiz", "Outro"].map((k) => ({
    k,
    seconds: segs.filter((s) => s.kind === k).reduce((a, s) => a + s.seconds, 0),
    count: segs.filter((s) => s.kind === k).length,
  }));
  return (
    <div className="border border-line p-6">
      <div className="flex items-baseline justify-between">
        <span className="label">Anatomy of one reel</span>
        <span className="font-mono text-[12px] text-muted">{Math.round(total)}s · {segs.length} beats</span>
      </div>
      <div className="mt-2 text-[15px]">&ldquo;{script.title}&rdquo;, from the sample spool</div>
      <div className="mt-6 flex h-8 w-full gap-px">
        {segs.map((s, i) => (
          <div
            key={i}
            style={{
              width: `${(s.seconds / total) * 100}%`,
              background: s.kind === "Hook" || s.kind === "Quiz" ? "var(--thread)" : "var(--border)",
              opacity: s.kind === "Quiz" ? 0.55 : 1,
            }}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 border-t border-line">
        {groups.map((g, i) => (
          <div key={g.k} className={`pt-3 ${i > 0 ? "border-l border-line pl-3" : ""}`}>
            <div className="label">{g.k}</div>
            <div className="mt-1 font-mono text-[14px]">{Math.round(g.seconds)}s</div>
            <div className="font-mono text-[11px] text-muted">{g.count} {g.count === 1 ? "beat" : "beats"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <MarketingPage>
      <section className="grid gap-12 pt-16 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <div className="label">How it works</div>
          <h1 className="mt-3 font-display text-[48px] leading-[0.95] sm:text-[64px]">
            Your textbook,
            <br />
            <em className="text-thread">but it&apos;s reels.</em>
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-ink/80">
            Drop in any document. Unspool turns it into short reels with a hook, voiceover, visuals and a quiz, so you actually remember it.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/" className="btn-primary px-6 py-3 text-[15px]">
              Upload a document
            </Link>
            <Link href="/s/demo" className="btn-secondary px-6 py-3 text-[15px]">
              Watch a sample
            </Link>
          </div>
        </div>
        <ReelAnatomy />
      </section>

      <HowSteps steps={steps} />

      <section className="mt-16 grid border-y border-line md:grid-cols-2">
        <div className="py-10 md:pr-10">
          <div className="label">For students</div>
          <h2 className="mt-3 font-display text-[36px] leading-[1.05]">Cram the chapter in the time it takes to scroll.</h2>
          <p className="mt-3 text-[15px] text-ink/75">Test tips, common traps, memory hacks and a quiz in every reel. Then review every spool in one feed the night before.</p>
        </div>
        <div className="border-t border-line py-10 md:border-l md:border-t-0 md:pl-10">
          <div className="label">For work</div>
          <h2 className="mt-3 font-display text-[36px] leading-[1.05]">Read the contract in sixty seconds.</h2>
          <p className="mt-3 text-[15px] text-ink/75">Policies, onboarding docs, reports and contracts: what you have to do, the deadlines, the money and the clauses to watch.</p>
        </div>
      </section>

      <section className="mt-16 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="label">Pricing</div>
          <p className="mt-2 font-display text-[30px] leading-tight">
            Your first reel is free · then 1 every {FREE_REEL_INTERVAL_MIN} min · Plus from {formatCents(PLANS.plus.priceCents)}/week
          </p>
        </div>
        <Link href="/pricing" className="text-[14px] text-thread underline underline-offset-4">
          See pricing
        </Link>
      </section>

      <section id="questions" className="mt-20 max-w-[760px]">
        <div className="label">Questions</div>
        <div className="mt-4 border-t border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group border-b border-line py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[17px]">
                {q}
                <span className="font-mono text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink/75">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
