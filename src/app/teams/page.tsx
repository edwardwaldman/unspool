import type { Metadata } from "next";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { GoHero, type GoCopy } from "@/components/go/go-hero";
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
};

const STEPS = [
  { n: "1", title: "Upload the document you already have", body: "A handbook, SOP, policy or slide deck: PDF, Word, PowerPoint, plain text, or a photo of a page. Or type a topic and we research it." },
  { n: "2", title: "Get one short reel per key idea", body: "Each reel has a hook, a voiceover, word-by-word captions and a visual for every beat, sized for a phone." },
  { n: "3", title: "Every reel ends in a quick quiz", body: "Your team has to pull the answer from memory, not just watch, so the key point is recalled rather than skimmed." },
];
const USES = [
  ["Safety procedures", "Fire safety, lifting, equipment checks"],
  ["Security awareness", "Phishing, passwords, data handling"],
  ["HR policies", "Handbooks, expenses, leave, conduct"],
  ["Onboarding", "The first-week reading new hires skip"],
  ["Process SOPs", "Step-by-step how-tos for the floor or the desk"],
  ["Compliance refreshers", "The yearly policy re-read, in minutes"],
];
const IN_A_REEL = ["A hook that says why it matters", "Voiceover and word-by-word captions", "A visual for every beat", "A quiz question at the end", "A share link anyone can open", "Your document stays private"];

/** Below the hero: what a training manager on a laptop wants to know. Stacks on phones, three columns on desktop. */
function TeamsSections() {
  return (
    <div className="mt-20 w-full max-w-[1160px] lg:mt-10">
      <section aria-labelledby="how" className="border-t border-line pt-14">
        <div className="label">How it works</div>
        <h2 id="how" className="mt-3 max-w-[640px] font-headline text-[30px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[40px]">
          From a PDF nobody reads to reels people finish.
        </h2>
        <ol className="mt-10 grid gap-px border border-line bg-line lg:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-paper p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-thread font-headline text-[18px] font-bold text-paper">{s.n}</div>
              <h3 className="mt-5 text-[19px] font-semibold leading-snug">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="uses" className="mt-20">
        <div className="label">What teams turn into reels</div>
        <h2 id="uses" className="mt-3 max-w-[640px] font-headline text-[30px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[40px]">
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
          <div className="label">In every reel</div>
          <h2 id="inside" className="mt-3 font-headline text-[28px] font-bold leading-[1.05] tracking-[-0.02em] lg:text-[36px]">Built for a phone, made from your document.</h2>
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
