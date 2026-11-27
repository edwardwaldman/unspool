import type { Metadata } from "next";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { GoHero, type GoCopy } from "@/components/go/go-hero";
import { Wordmark } from "@/components/ui/icons";
import { TeamsFlow } from "@/components/go/teams-flow";
import { Toaster } from "@/components/ui/toast";
import { ResumeStashedUpload } from "@/components/upload/use-uploader";

// The landing page for the corporate-training ads (link it as /teams?utm_source=tiktok-teams).
// Same one-job hero as /go, worded for training managers, plus a few sections below it for the people who open it on a
// laptop and want to know what they'd be buying. Kept out of search: it exists for ad clicks.
export const metadata: Metadata = {
  title: "Turn training docs into TikToks your team will watch",
  description: "Upload a handbook, SOP or policy PDF. Get short TikTok-style videos with a voiceover, captions and a quiz. Your first reel is free.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

const TEAMS_COPY: GoCopy = {
  headline: <>Turn training docs into <span className="text-thread">TikToks.</span></>,
  subline: "Upload a handbook, SOP or policy PDF. Get short videos with a voiceover, captions and a quiz.",
  docTitle: "Handbook.pdf",
  topics: [
    "Workplace fire safety",
    "Spotting a phishing email",
    "Our expense policy",
    "Data privacy basics for staff",
    "Forklift pre-use checks",
    "Handling a customer complaint",
    "Lifting safely at work",
    "Information security for new hires",
  ],
  ticks: ["First reel free", "No card needed", "Your files stay private"],
  reels: ["/go/phish", "/go/lift", "/go/fire"],
  plus: { label: "Upload a training PDF", sub: "a handbook, SOP, policy or slides" },
  // "unspool Teams", the way Google writes "Google Docs": the wordmark, then the product name in the plain UI sans,
  // regular weight, in the Unspool lime
  brand: (
    <span className="inline-flex items-baseline gap-[7px]" aria-label="unspool Teams">
      <Wordmark size={24} />
      <span className="font-sans text-[23px] font-normal leading-none tracking-[-0.01em] text-thread">Teams</span>
    </span>
  ),
};

const USES = [
  ["Safety procedures", "Fire safety, lifting, equipment checks"],
  ["Security awareness", "Phishing, passwords, data handling"],
  ["HR policies", "Handbooks, expenses, leave, conduct"],
  ["Onboarding", "The first-week reading new hires skip"],
  ["Process SOPs", "Step-by-step how-tos for the floor or the desk"],
  ["Compliance refreshers", "The yearly policy re-read, in minutes"],
];
const IN_A_REEL = ["A hook that says why it matters", "Voiceover and word-by-word captions", "A visual for every beat", "A quiz question at the end", "A share link anyone can open", "Your document stays private"];

function FlowArrow() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" className="shrink-0 rotate-90 text-thread lg:rotate-0" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Below the hero: what a training manager on a laptop wants to know. Stacks on phones, rows on desktop. */
function TeamsSections() {
  return (
    <div className="mt-20 w-full max-w-[1160px] lg:mt-24 lg:px-10">
      <section aria-labelledby="how-m" className="border-t border-line pt-14 lg:hidden">
        <h2 id="how-m" className="max-w-[640px] font-headline text-[30px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[40px]">
          From a PDF nobody reads to reels people finish.
        </h2>
        {/* The real flow, drawn: a handbook page, the reels it becomes, the quiz each one ends on */}
        <div className="mt-12 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <figure className="flex w-full max-w-[260px] flex-col items-center">
            <div className="w-full rotate-[-2deg] rounded-[6px] bg-[#f4f1e8] p-5 text-[#2a2a2a] shadow-[0_18px_40px_rgba(0,0,0,0.45)]" aria-hidden>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8577]">Employee handbook · p. 34</div>
              <div className="mt-2 text-[15px] font-semibold leading-tight">4.2 Fire safety and extinguisher use</div>
              {[100, 92, 97, 84, 95, 70, 98, 88, 60].map((w, k) => (
                <div key={k} className="mt-2 h-[6px] rounded-full bg-[#cfcabd]" style={{ width: `${w}%` }} />
              ))}
            </div>
            <figcaption className="mt-5 text-center text-[14.5px] text-muted">Your handbook, SOP or slides</figcaption>
          </figure>
          <FlowArrow />
          <figure className="flex flex-col items-center">
            <div className="flex items-end" aria-hidden>
              {["/go/phish.jpg", "/go/fire.jpg", "/go/lift.jpg"].map((src, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" width={132} height={235}
                  className={`h-[235px] w-[132px] rounded-[14px] border border-line object-cover shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${k === 1 ? "z-10 -mx-3 -translate-y-3" : k === 0 ? "rotate-[-6deg]" : "rotate-[6deg]"}`} />
              ))}
            </div>
            <figcaption className="mt-5 max-w-[300px] text-center text-[14.5px] text-muted">One short reel per key idea, with a voiceover and captions</figcaption>
          </figure>
          <FlowArrow />
          <figure className="flex w-full max-w-[260px] flex-col items-center">
            <div className="w-full rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)]" aria-hidden>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-thread">Quiz</div>
              <div className="mt-2 text-[15px] font-semibold leading-snug">What does P.A.S.S. stand for?</div>
              <div className="mt-3 rounded-[10px] bg-paper px-3 py-2 text-[13px] text-muted">Point, alarm, spray, step</div>
              <div className="mt-2 flex items-center justify-between rounded-[10px] bg-thread px-3 py-2 text-[13px] font-semibold text-paper">Pull, aim, squeeze, sweep <span>✓</span></div>
            </div>
            <figcaption className="mt-5 text-center text-[14.5px] text-muted">A quick quiz at the end of every reel</figcaption>
          </figure>
        </div>
      </section>

      <div className="hidden lg:block">
        <TeamsFlow />
      </div>

      <section aria-labelledby="uses" className="mt-20">
        <h2 id="uses" className="max-w-[640px] font-headline text-[30px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[40px]">
          The training everyone is supposed to have read.
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USES.map(([t, d]) => (
            <li key={t} className="border border-line bg-surface p-6">
              <div className="text-[17px] font-semibold">{t}</div>
              <div className="mt-1.5 text-[14.5px] text-muted">{d}</div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="inside" className="mt-20 grid gap-10 border border-line p-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:p-12">
        <div>
          <h2 id="inside" className="font-headline text-[28px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[36px]">Built for a phone, made from your document.</h2>
          <p className="mt-4 max-w-[460px] text-[15.5px] leading-relaxed text-muted">
            Start with one document. The first reel is free and needs no card; plans for more reels are on the{" "}
            <Link href="/pricing" className="text-ink underline underline-offset-4">pricing page</Link>.
          </p>
          <a href="#" className="mt-7 inline-flex min-h-[50px] items-center bg-thread px-6 text-[16px] font-semibold text-paper hover:opacity-90">
            Upload a training PDF
          </a>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {IN_A_REEL.map((x) => (
            <li key={x} className="flex items-start gap-3 text-[15px]">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-thread text-[12px] font-bold text-paper" aria-hidden>✓</span>
              {x}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <>
      <GoHero copy={TEAMS_COPY}>
        <TeamsSections />
      </GoHero>
      <AuthModal />
      <ResumeStashedUpload />
      <Toaster />
    </>
  );
}
