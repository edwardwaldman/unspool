"use client";

import { COLOR_VAR, markupWords } from "@/lib/markup";
import { useMemo } from "react";

/** Burned-in TikTok-style captions: a short chunk of words, the word being said lit up in the reel's accent. */
export function Captions({ text, words, fraction }: { text: string; words: number[]; fraction: number }) {
  const list = useMemo(() => markupWords(text), [text]);
  const chunks = useMemo(() => {
    const out: number[][] = [];
    let cur: number[] = [];
    list.forEach((w, i) => {
      cur.push(i);
      const chars = cur.reduce((n, k) => n + list[k].text.length + 1, 0);
      const breakHere = /[.!?,;:—]$/.test(w.text) || cur.length >= 5 || chars >= 24;
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
    <p
      className="text-center font-hook font-extrabold leading-[1.3] tracking-[-0.015em] text-white"
      style={{ textShadow: "0 2px 0 rgba(0,0,0,.6)", fontSize: "min(30px, 7.2cqw)" }}
      aria-live="off"
    >
      {chunk.map((i) => {
        const w = list[i];
        const spoken = i <= current;
        const isNow = i === current;
        return (
          <span
            key={i}
            className="mx-[0.04em] inline-block px-[0.14em] transition-transform duration-150 ease-[cubic-bezier(.3,1.8,.5,1)]"
            style={
              isNow
                ? { background: "var(--thread)", color: "#08110e", textShadow: "none", transform: `scale(1.22) rotate(${i % 2 ? 3 : -3}deg)`, boxShadow: "3px 3px 0 #08110e" }
                : { color: w.color ? COLOR_VAR[w.color] : "#fff", opacity: spoken ? 1 : 0.72 }
            }
          >
            {w.text}
          </span>
        );
      })}
    </p>
  );
}
