"use client";

import { DocToReel } from "./doc-to-reel";

/** Desktop hero beside the upload column: what Unspool does, shown rather than told. */
export function HeroCard() {
  return (
    <div className="w-[520px]">
      <div className="label">What it does</div>
      <h2 className="mt-3 font-display text-[40px] leading-[1.02]">
        One document in. <span className="text-thread">Ten reels out.</span>
      </h2>
      <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-muted">
        Each section of your doc becomes a short reel with a hook, voiceover, visuals and a quiz.
      </p>
      <div className="mt-10">
        <DocToReel />
      </div>
    </div>
  );
}
