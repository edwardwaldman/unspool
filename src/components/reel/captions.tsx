"use client";

import { COLOR_VAR, markupWords } from "@/lib/markup";
import { useMemo } from "react";
import type { ReelStyle } from "@/lib/reel-style";

/**
 * Burned-in TikTok-style captions: a short chunk of words, the word being said lit up in the reel's accent.
 * `variant` (Pro reel style): "spotlight" (the default, as in the ads) shows spoken words white, the ones still
 * coming dim and every marked key term yellow; "pop" boxes and tilts the current word, "clean" just colors it,
 * "karaoke" fills every spoken word with the accent.
 */
/** The default (spotlight) look, as in hand-made study reels: bold white, every marked key word yellow. */
const KEY_YELLOW = "#ffd84d";

export function Captions({ text, words, fraction, variant = "spotlight" }: { text: string; words: number[]; fraction: number; variant?: ReelStyle["captions"] }) {
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
      className={`text-center font-hook leading-[1.3] tracking-[-0.015em] text-white ${variant === "clean" ? "font-bold" : "font-extrabold"}`}
      style={{ textShadow: variant === "clean" ? "0 1px 3px rgba(0,0,0,.7)" : variant === "spotlight" ? "0 2px 0 rgba(0,0,0,.55), 0 3px 10px rgba(0,0,0,.6)" : "0 2px 0 rgba(0,0,0,.6)", fontSize: variant === "spotlight" ? "min(32px, 7.8cqw, 4.2cqh)" : "min(30px, 7.2cqw, 3.9cqh)" }}
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
              variant === "spotlight"
                ? { color: w.color ? KEY_YELLOW : "#fff", opacity: spoken ? 1 : 0.38, transform: isNow ? "scale(1.08)" : undefined }
                : variant === "clean"
                ? { color: isNow ? "var(--thread)" : w.color ? COLOR_VAR[w.color] : "#fff", opacity: spoken ? 1 : 0.72 }
                : variant === "karaoke"
                  ? { color: spoken ? "var(--thread)" : "#fff", opacity: spoken ? 1 : 0.85, transform: isNow ? "scale(1.06)" : undefined }
                  : isNow
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
