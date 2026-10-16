"use client";

import Link from "next/link";
import { useRef } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { buildSegments } from "@/lib/segments";
import { estimateDuration } from "@/lib/timing";
import { formatPrice, PRICING } from "@/lib/config";
import { MarkedText } from "../ui/marked-text";
import { UploadIcon, Wordmark } from "../ui/icons";
import { usePendingUpload } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";
import { MiniReel } from "./mini-reel";

const sampleReels = SAMPLE_SPOOL.reels.filter((r) => r.script);

const USE_CASES = [
  ["Students", "Mix these two up and you #lose points#.", "Textbook chapters, lecture notes, study guides."],
  ["Contracts", "This clause could cost you your ^deposit^.", "Leases, offer letters, terms you were about to skim."],
  ["Work", "You have *30 days* to do this, or it lapses.", "Policies, onboarding docs, reports."],
  ["Research", "One sentence on page 14 *changes the result*.", "Papers and long reads, without the skim guilt."],
] as const;

const FAQS = [
  ["Is it accurate?", "Reels are written only from your document. If it isn't in the doc, it isn't in the reel."],
  ["Who can see my files?", "Only you. Files are private, never used to train AI, and deletable anytime."],
  ["Do I need an account?", "No. Try it without one. Anonymous uploads are deleted after 7 days."],
  ["How long can a document be?", "About 60 pages or 40,000 words for now."],
  ["What does it cost?", `Reel 1 is free. ${formatPrice(PRICING.documentCents)} unlocks a document, or ${formatPrice(PRICING.subscriptionCents)}/month for unlimited.`],
];

function UploadButton({ big = false }: { big?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={Boolean(pending)}
        className={`btn-primary ${big ? "px-7 py-4 text-[16px]" : "px-6 py-3.5 text-[15px]"}`}
      >
        {pending ? "Opening your feed" : (<><UploadIcon size={17} /> Upload a document</>)}
      </button>
    </>
  );
}

function Step({ n, title, accent, body, children, flip }: { n: number; title: string; accent: string; body: string; children: React.ReactNode; flip?: boolean }) {
  return (
    <div className={`grid items-center gap-12 py-20 md:grid-cols-2 ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
      <div>
        <div className="flex h-9 w-9 items-center justify-center border border-ink font-mono text-[13px]">{n}</div>
        <h3 className="mt-6 font-display text-[40px] leading-[1.02]">
          <span className="text-thread">{accent}</span> {title}
        </h3>
        <p className="mt-4 max-w-[420px] text-[16px] leading-relaxed text-muted">{body}</p>
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

/** First-visit home: a scrolling page in the shape of a product site, with the real player as the hero. */
export function Landing() {
  const reel1 = sampleReels[0].script!;
  const plan = SAMPLE_SPOOL.reels;
  const beats = buildSegments(reel1).map((s) => ({ kind: s.kind, idx: s.beatIndex, sec: estimateDuration(s.speech) }));
  const max = Math.max(...beats.map((b) => b.sec));

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1120px] items-center gap-14 px-6 pb-20 pt-14 md:grid-cols-[1.15fr_1fr] md:pt-24">
        <div>
          <h1 className="font-display text-[52px] leading-[0.98] md:text-[76px]">
            Drop a doc.
            <br />
            <span className="text-thread">Unspool it.</span>
          </h1>
          <p className="mt-6 max-w-[460px] text-[17px] leading-relaxed text-muted">
            Any document becomes 10 short reels with voiceover, visuals and a quiz.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <UploadButton big />
            <Link href="/s/demo" className="text-[15px] text-muted hover:text-ink">
              Watch a sample →
            </Link>
          </div>
          <p className="label mt-8">Reel 1 free · No account needed</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <MiniReel width={300} />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="pt-20 text-center">
            <div className="label">How it works</div>
            <h2 className="mt-3 font-display text-[44px] leading-tight">Three steps. About a minute.</h2>
          </div>

          <Step n={1} accent="Drop" title="any document." body="Notes, a textbook chapter, a work PDF, a contract, even a photo of handwritten notes.">
            <div className="w-full max-w-[400px] border border-line bg-paper p-6">
              <div className="flex items-center gap-3">
                <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">PDF</span>
                <span className="text-[15px]">{SAMPLE_SPOOL.fileName}</span>
              </div>
              <div className="mt-5 space-y-2">
                {[92, 78, 85, 60, 88, 70].map((w, i) => (
                  <div key={i} className="h-1.5 bg-line" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="mt-5 font-mono text-[12px] text-muted">
                {SAMPLE_SPOOL.pageCount} pages · {SAMPLE_SPOOL.wordCount?.toLocaleString()} words
              </div>
            </div>
          </Step>

          <Step n={2} accent="Unspool" title="it into 10 reels." body="Unspool reads the whole thing and plans 10 reels that cover it in order, each with a hook up front." flip>
            <div className="w-full max-w-[400px] border border-line bg-paper">
              {plan.map((r) => (
                <div key={r.id} className="flex items-center gap-3 border-b border-line px-5 py-2.5 last:border-b-0">
                  <span className="w-5 font-mono text-[11px] text-muted">{String(r.index).padStart(2, "0")}</span>
                  <span className="text-[14px]">{r.title}</span>
                  <span className={`ml-auto h-1.5 w-1.5 rounded-full ${r.index <= 3 ? "bg-thread" : "bg-line"}`} />
                </div>
              ))}
            </div>
          </Step>

          <Step n={3} accent="Swipe" title="and actually remember it." body="Every beat has a visual and word-by-word captions. Each reel ends with a quick quiz.">
            <div className="w-full max-w-[400px]">
              <div className="flex h-36 items-end gap-[5px] border-b border-line">
                {beats.map((b, i) => (
                  <div key={i} className="flex-1" style={{ height: `${(b.sec / max) * 100}%`, background: b.kind === "beat" && b.idx > 0 ? "var(--ink)" : "var(--thread)" }} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[12px] text-muted">
                <span>Each bar is one beat of reel 1, by length.</span>
                <span className="label">Hook → quiz</span>
              </div>
            </div>
          </Step>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-[1120px] px-6 py-24">
        <div className="label">Use cases</div>
        <h2 className="mt-3 max-w-[560px] font-display text-[44px] leading-tight">For anything you&apos;d rather not read twice.</h2>
        <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2">
          {USE_CASES.map(([name, hook, body]) => (
            <div key={name} className="bg-paper p-8">
              <div className="label text-thread">{name}</div>
              <p className="mt-4 font-hook text-[24px] font-extrabold leading-tight">
                <MarkedText text={hook} />
              </p>
              <p className="mt-3 text-[14.5px] text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="border-y border-line bg-surface py-24">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="label">Examples</div>
          <h2 className="mt-3 font-display text-[44px] leading-tight">Reels from one set of AP Stats notes.</h2>
          <div className="no-scrollbar mt-12 flex gap-6 overflow-x-auto pb-2">
            {sampleReels.map((r) => (
              <Link key={r.id} href={`/s/demo?reel=${r.index}`} className="shrink-0">
                <MiniReel reel={r} width={240} />
                <div className="mt-3 font-mono text-[11px] text-muted">REEL {r.index}</div>
                <div className="text-[14px]">{r.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[760px] px-6 py-24">
        <h2 className="text-center font-display text-[44px] leading-tight">Questions</h2>
        <div className="mt-10 border-t border-line">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group border-b border-line py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[17px]">
                {q}
                <span className="font-mono text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line py-24 text-center">
        <h2 className="font-display text-[48px] leading-tight">
          Got a doc? <span className="text-thread">Unspool it.</span>
        </h2>
        <div className="mt-8 flex justify-center">
          <UploadButton big />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-6 py-14 sm:grid-cols-4">
          <div>
            <Wordmark size={22} />
            <p className="mt-3 text-[13px] text-muted">© {new Date().getFullYear()} Unspool</p>
          </div>
          {[
            ["Product", [["/s/demo", "Sample"], ["/pricing", "Pricing"], ["/about", "How it works"]]],
            ["Account", [["/library", "Library"], ["/profile", "Profile"], ["/login", "Sign in"]]],
            ["Legal", [["/privacy", "Privacy"], ["/terms", "Terms"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <div className="label">{title as string}</div>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {(links as string[][]).map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-muted hover:text-ink">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
