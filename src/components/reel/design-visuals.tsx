"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Visual } from "@/lib/schema";

// Flat, full-frame visuals for design, language and other abstract topics, where a 3D object would only be a
// stand-in: real colour swatches, a before/after comparison, and a type or quote specimen. Each animates in on
// its own (dealt, slammed, typed) so the beat moves even with nothing else on screen.

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const SPRING = { type: "spring" as const, stiffness: 320, damping: 20 };

/** Readable text on a colour: dark on light swatches, white on dark ones. */
function ink(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#0b0f0d" : "#ffffff";
}

export function SwatchVisual({ v }: { v: Extract<Visual, { type: "swatch" }> }) {
  const reduce = useReducedMotion();
  const hero = v.focus >= 0 ? v.colors[v.focus] : null;
  const deal = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 40, rotate: (i % 2 ? 6 : -6), scale: 0.7 }, animate: { opacity: 1, y: 0, rotate: 0, scale: 1 }, transition: { ...SPRING, delay: 0.08 + i * 0.11 } };
  return (
    <div className="flex w-full flex-col items-center px-[6cqw]" data-testid="swatch">
      {v.title && (
        <motion.div initial={reduce ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-[5cqw] text-center font-display leading-[1.05] text-white" style={{ fontSize: "min(34px, 8.5cqw)", textShadow: "0 3px 12px rgba(0,0,0,.35)" }}>
          {v.title}
        </motion.div>
      )}
      {hero ? (
        <>
          {/* The colour this beat is about: a big tile that wipes up into place */}
          <motion.div
            initial={reduce ? false : { clipPath: "inset(100% 0 0 0)", scale: 0.92 }}
            animate={{ clipPath: "inset(0% 0 0 0)", scale: 1 }}
            transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
            className="relative w-full"
            style={{ aspectRatio: "1 / 0.78", background: hero.hex, boxShadow: "0 24px 60px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.14)", borderRadius: 18 }}
          >
            <div className="absolute inset-x-[6cqw] bottom-[6cqw]" style={{ color: ink(hero.hex) }}>
              <motion.div initial={reduce ? false : { y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, ...SPRING }} className="font-display leading-none" style={{ fontSize: "min(54px, 13cqw)" }}>
                {hero.name}
              </motion.div>
              <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.55 }} className="mt-[2cqw] font-mono" style={{ fontSize: "min(20px, 5cqw)" }}>
                {hero.hex.toUpperCase()}
                {hero.note ? ` · ${hero.note}` : ""}
              </motion.div>
            </div>
          </motion.div>
          {v.colors.length > 1 && (
            <div className="mt-[4cqw] flex w-full justify-center gap-[2cqw]">
              {v.colors.map((c, i) => (
                <motion.div key={i} {...deal(i)} className="flex-1" style={{ maxWidth: "12cqw", aspectRatio: "1", background: c.hex, borderRadius: 8, opacity: i === v.focus ? 1 : 0.45, outline: i === v.focus ? "3px solid #fff" : "1px solid rgba(255,255,255,.15)", outlineOffset: 2 }} />
              ))}
            </div>
          )}
        </>
      ) : (
        // Every colour, dealt onto the screen one after another
        <div className={`grid w-full gap-[2.5cqw] ${v.colors.length <= 3 ? "grid-cols-1" : v.colors.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
          {v.colors.map((c, i) => (
            <motion.div key={i} {...deal(i)} className="relative overflow-hidden" style={{ background: c.hex, borderRadius: 12, aspectRatio: v.colors.length <= 3 ? "3.2 / 1" : "1 / 1.05", boxShadow: "0 10px 26px rgba(0,0,0,.35), inset 0 0 0 1.5px rgba(255,255,255,.14)" }}>
              <div className="absolute inset-x-[3cqw] bottom-[2.5cqw]" style={{ color: ink(c.hex) }}>
                <div className="font-display leading-none" style={{ fontSize: v.colors.length <= 3 ? "min(30px, 7.5cqw)" : "min(17px, 4.3cqw)" }}>
                  {c.name}
                </div>
                <div className="mt-[1cqw] font-mono opacity-80" style={{ fontSize: v.colors.length <= 3 ? "min(15px, 3.8cqw)" : "min(11px, 2.8cqw)" }}>
                  {c.hex.toUpperCase()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompareVisual({ v, progress }: { v: Extract<Visual, { type: "compare" }>; progress: number }) {
  const reduce = useReducedMotion();
  const showGood = progress >= 0.42;
  const card = (good: boolean) => {
    const side = good ? v.good : v.bad;
    const col = good ? "#3fd27e" : "#ff5a52";
    return (
      <div className="w-full p-[5cqw]" style={{ background: "rgba(10,14,12,.78)", border: `3px solid ${col}`, borderRadius: 18, boxShadow: good && !reduce ? `0 0 40px ${col}55` : "0 14px 34px rgba(0,0,0,.4)" }}>
        <div className="flex items-center gap-[3cqw]">
          <span className="flex shrink-0 items-center justify-center rounded-full font-display text-[#0b0f0d]" style={{ width: "10cqw", height: "10cqw", background: col, fontSize: "min(26px, 6.5cqw)" }}>
            {good ? "✓" : "✗"}
          </span>
          <span className="font-display leading-none" style={{ color: col, fontSize: "min(30px, 7.5cqw)" }}>
            {side.title}
          </span>
        </div>
        <ul className="mt-[3.5cqw] space-y-[2cqw]">
          {side.points.map((p, i) => (
            <li key={i} className="relative font-hook font-bold leading-snug text-white" style={{ fontSize: "min(20px, 5cqw)" }}>
              {p}
              {/* The "don't" side gets crossed out as the voice moves on */}
              {!good && (
                <motion.span aria-hidden className="absolute left-0 top-1/2 h-[3px] origin-left" style={{ background: col, width: "100%" }} initial={{ scaleX: 0 }} animate={{ scaleX: progress > 0.25 + i * 0.06 ? 1 : 0 }} transition={{ duration: 0.3 }} />
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return (
    <div className="flex w-full flex-col gap-[4cqw] px-[6cqw]" data-testid="compare">
      <motion.div initial={reduce ? false : { x: -30, opacity: 0 }} animate={reduce ? undefined : { x: [-30, 0, -6, 6, -3, 0], opacity: 1 }} transition={{ duration: 0.6 }}>
        {card(false)}
      </motion.div>
      <motion.div initial={false} animate={showGood ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }} transition={SPRING}>
        {card(true)}
      </motion.div>
    </div>
  );
}

const FAMILY: Record<Extract<Visual, { type: "specimen" }>["style"], string> = {
  display: "var(--font-display)",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "var(--font-ui)",
  mono: "var(--font-numeric), ui-monospace, monospace",
  handwritten: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive",
};

export function SpecimenVisual({ v, progress }: { v: Extract<Visual, { type: "specimen" }>; progress: number }) {
  const reduce = useReducedMotion();
  // The sample types itself on over the first half of the line, with a blinking caret.
  const shown = reduce ? v.text.length : Math.ceil(v.text.length * clamp(progress / 0.45));
  const typing = shown < v.text.length;
  return (
    <div className="flex w-full flex-col items-center px-[7cqw] text-center" data-testid="specimen">
      <motion.span initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING} className="font-hook font-extrabold uppercase tracking-[0.12em]" style={{ background: "var(--thread)", color: "#0b0f0d", padding: "0.35em 0.8em", fontSize: "min(14px, 3.6cqw)" }}>
        {v.label}
      </motion.span>
      <div className="mt-[6cqw] leading-[1.05] text-white" style={{ fontFamily: FAMILY[v.style], fontSize: v.text.length > 24 ? "min(40px, 10cqw)" : "min(60px, 15cqw)", fontWeight: v.style === "display" ? 800 : 600, textShadow: "0 4px 18px rgba(0,0,0,.4)" }}>
        {v.text.slice(0, shown)}
        <span aria-hidden className="ml-[0.05em] inline-block w-[0.06em] translate-y-[0.1em] bg-[var(--thread)]" style={{ height: "0.9em", opacity: typing || Math.floor(progress * 8) % 2 ? 1 : 0 }} />
      </div>
      {v.note && (
        <motion.div initial={false} animate={progress > 0.5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} className="mt-[5cqw] font-hook font-bold text-white/80" style={{ fontSize: "min(18px, 4.6cqw)" }}>
          {v.note}
        </motion.div>
      )}
    </div>
  );
}
