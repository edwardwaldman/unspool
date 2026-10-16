"use client";

import { ReelView } from "../reel/reel-view";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { buildSegments } from "@/lib/segments";
import { estimateDuration } from "@/lib/timing";

/** Desktop hero: one real sample doc, what it became, and the beat-by-beat shape of its first reel. */
export function HeroCard() {
  const reel = SAMPLE_SPOOL.reels[0].script!;
  const beats = buildSegments(reel).map((s) => ({ kind: s.kind, sec: estimateDuration(s.speech) }));
  const max = Math.max(...beats.map((b) => b.sec));
  const total = Math.round(beats.reduce((a, b) => a + b.sec, 0));
  return (
    <div className="w-[440px]">
      <div className="flex items-stretch gap-6 border border-ink p-8">
        <div className="min-w-0 flex-1">
        <div className="font-display text-[28px] leading-tight">{SAMPLE_SPOOL.title}</div>
        <div className="label mt-1">
          {SAMPLE_SPOOL.pageCount} pages · {SAMPLE_SPOOL.fileType.toUpperCase()}
        </div>
        <div className="mt-6 font-display text-[112px] leading-[0.85] text-thread">10</div>
        <p className="mt-4 text-[15px] text-muted">reels, each with a hook, voiceover and a quiz.</p>
        </div>
        {/* Live mini preview of reel 1 (silent, looping) */}
        <div className="relative h-[213px] w-[120px] shrink-0 overflow-hidden border border-line" aria-hidden>
          <div className="pointer-events-none absolute left-0 top-0 h-[693px] w-[390px] origin-top-left scale-[0.3077]">
            <ReelView spool={SAMPLE_SPOOL} reel={SAMPLE_SPOOL.reels[0]} active total={10} chrome={{ bottomInset: 0 }} onMore={() => undefined} preview />
          </div>
        </div>
      </div>
      <h2 className="mt-10 font-display text-[40px] leading-[1.02]">
        What if your notes <span className="text-thread">explained themselves</span>?
      </h2>
      <div className="mt-8 flex h-28 items-end gap-[5px]">
        {beats.map((b, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ height: `${(b.sec / max) * 100}%`, background: b.kind === "beat" && i > 0 ? "var(--ink)" : "var(--thread)" }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between gap-4 text-[12px] text-muted">
        <span>Every bar is one beat of reel 1, by length. {total}s total.</span>
        <span className="label whitespace-nowrap">Hook → quiz</span>
      </div>
    </div>
  );
}
