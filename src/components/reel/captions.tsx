"use client";

import { COLOR_VAR, markupWords } from "@/lib/markup";
import { useMemo } from "react";

/** TikTok-style live captions: a short chunk of words, the spoken word popping as it's said. */
export function Captions({ text, words, fraction }: { text: string; words: number[]; fraction: number }) {
  const list = useMemo(() => markupWords(text), [text]);
  const chunks = useMemo(() => {
    const out: number[][] = [];
    let cur: number[] = [];
    list.forEach((w, i) => {
      cur.push(i);
      const breakHere = /[.!?,;:—]$/.test(w.text) || cur.length >= 5;
      if (breakHere) {
        out.push(cur);
        cur = [];
      }
    });
    if (cur.length) out.push(cur);
    return out;
  }, [list]);

  let current = 0;
  for (let i = 0; i < Math.min(words.length, list.length); i++) if (words[i] <= fraction) current = i;
  const chunk = chunks.find((c) => c.includes(current)) ?? chunks[0] ?? [];

  return (
    <p className="mx-auto max-w-[330px] text-center font-hook text-[21px] font-bold leading-[1.2] tracking-[-0.01em]" aria-live="off">
      {chunk.map((i) => {
        const w = list[i];
        const spoken = i <= current;
        const isNow = i === current;
        return (
          <span
            key={i}
            className="mx-[0.18em] inline-block transition-[transform,opacity] duration-150"
            style={{
              color: w.color ? COLOR_VAR[w.color] : "var(--ink)",
              opacity: spoken ? 1 : 0.4,
              transform: isNow ? "translateY(-2px)" : "none",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </p>
  );
}
