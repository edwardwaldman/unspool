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
    <p className="caption-shadow mx-auto max-w-[330px] text-center text-[22px] font-extrabold leading-[1.18] tracking-tight" aria-live="off">
      {chunk.map((i) => {
        const w = list[i];
        const spoken = i <= current;
        const isNow = i === current;
        return (
          <span
            key={i}
            className="mx-[0.18em] inline-block transition-[transform,opacity] duration-150"
            style={{
              color: w.color ? COLOR_VAR[w.color] : "var(--text)",
              opacity: spoken ? 1 : 0.55,
              transform: isNow ? "scale(1.07) translateY(-1px)" : "scale(1)",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </p>
  );
}
