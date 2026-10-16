import { formatPrice, PRICING } from "@/lib/config";
import { ProcessDemo } from "./process-demo";

const STEPS = [
  ["01", "Drop anything", "Notes, a textbook chapter, a work PDF, a contract or a photo of handwritten pages."],
  ["02", "Get 10 reels", "Each section becomes a short reel with a hook, voiceover, captions and a visual for every beat."],
  ["03", "Remember it", "Every reel ends with a quick quiz, so you know it stuck before the test or the meeting."],
] as const;

const FACTS = [
  ["10", "reels per document"],
  ["~60s", "per reel"],
  ["1", "quiz in every reel"],
  ["Free", "first reel, every doc"],
] as const;

/** Second screen under the hero: how it works and the numbers, nothing else. */
export function InfoSlide() {
  return (
    <section className="flex min-h-[80dvh] flex-col justify-center border-t border-line px-6 py-20">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="label">How it works</div>
        <div className="mt-8">
          <ProcessDemo />
        </div>
        <div className="mt-14 grid border-t border-line md:grid-cols-3">
          {STEPS.map(([n, title, body], i) => (
            <div key={n} className={`py-8 md:pr-8 ${i > 0 ? "border-t border-line md:border-l md:border-t-0 md:pl-8" : ""}`}>
              <div className="font-mono text-[12px] text-thread">{n}</div>
              <h2 className="mt-3 font-display text-[30px] leading-tight">{title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 border-y border-line md:grid-cols-4">
          {FACTS.map(([n, label], i) => (
            <div key={label} className={`py-6 ${i % 2 === 1 ? "border-l border-line pl-6" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-6" : ""}`}>
              <div className="font-mono text-[28px] text-ink">{n}</div>
              <div className="label mt-1">{label}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-muted">
          {formatPrice(PRICING.documentCents)} unlocks all 10 reels for a document, or {formatPrice(PRICING.subscriptionCents)}/month for unlimited.
        </p>
      </div>
    </section>
  );
}
