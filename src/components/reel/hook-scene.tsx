"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COLOR_VAR, markupWords } from "@/lib/markup";
import type { HighlightColor } from "@/lib/schema";
import dynamic from "next/dynamic";
import { threadHex } from "./accent";
import { ReelIcon } from "./icon";

const Soup3D = dynamic(() => import("./soup-3d"), { ssr: false });
import { sentenceCase } from "./text";

// The opening beat of a reel: a kinetic headline that builds word by word and lands accent "hits" on
// its key words as the voiceover reaches them, and an animated hook graphic that reacts to those hits.
// Flat shapes and solid colors only; every animation is a transform or opacity change.

const INK = "#08110e";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

/** The headline's words, which of them get an accent hit, and when (as a fraction of the opening beat). */
function useHits(headline: string, beatText: string, words: number[]) {
  return useMemo(() => {
    const head = markupWords(headline);
    const beat = markupWords(beatText);
    const beatIndex = new Map<string, number>();
    beat.forEach((w, i) => {
      const k = norm(w.text);
      if (k && !beatIndex.has(k)) beatIndex.set(k, i);
    });
    const beatColor = new Map<string, HighlightColor>();
    beat.forEach((w) => w.color && beatColor.set(norm(w.text), w.color));
    return head.map((w) => {
      const k = norm(w.text);
      const color = w.color ?? beatColor.get(k);
      const i = beatIndex.get(k);
      // Spoken in the beat: hit on that word. Marked but never spoken: hit once the reveal has landed.
      const at = i !== undefined && words[i] !== undefined ? words[i] : 0.42;
      return { text: w.text, color, at: color ? at : null };
    });
  }, [headline, beatText, words]);
}

/** How many accent hits the voiceover has reached in the opening beat (drives the graphic's pulses). */
export function useHitCount(headline: string, beatText: string, words: number[], fraction: number) {
  const hits = useHits(headline, beatText, words);
  return hits.reduce((n, h) => (h.at !== null && fraction >= h.at ? n + 1 : n), 0);
}

const STAGGER = 0.045;
const START = 0.26;

/**
 * The reel's headline on its opening beat: a flat accent bar sweeps across, then each word rises out
 * of its own mask with a little overshoot; marked words get a solid accent block when they're spoken.
 */
export function KineticHeadline({ headline, beatText, words, fraction }: { headline: string; beatText: string; words: number[]; fraction: number }) {
  const reduce = useReducedMotion();
  const hits = useHits(headline, beatText, words);
  return (
    <h2
      className="relative font-hook font-extrabold leading-[1.12] tracking-[-0.025em] text-white"
      style={{ fontSize: "min(29px, 6.7cqw, 4.1cqh)" }}
      aria-label={hits.map((h) => h.text).join(" ")}
    >
      {!reduce && (
        <span aria-hidden className="pointer-events-none absolute -inset-x-5 inset-y-0 overflow-hidden">
          <motion.span
            className="absolute inset-0 block bg-thread"
            initial={{ x: "-101%" }}
            animate={{ x: ["-101%", "0%", "0%", "101%"] }}
            transition={{ duration: 0.62, times: [0, 0.38, 0.5, 1], ease: [0.7, 0, 0.3, 1] }}
          />
        </span>
      )}
      <span aria-hidden>
        {hits.map((h, i) => {
          const lit = h.at !== null && fraction >= h.at;
          const color = h.color ? COLOR_VAR[h.color] : "var(--thread)";
          return (
            <span key={i}>
              <span className="inline-block overflow-hidden px-[0.06em] pb-[0.1em] align-top [margin-bottom:-0.1em]">
                <motion.span
                  className="relative inline-block"
                  initial={reduce ? false : { y: "115%", rotate: 7, scale: 0.86 }}
                  animate={{ y: "0%", rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 26, mass: 0.7, delay: START + i * STAGGER }}
                >
                  <motion.span
                    className="relative inline-block"
                    style={{ color: h.color ? color : "#ffffff" }}
                    initial={false}
                    animate={{ scale: lit && !reduce ? [1, 1.14, 1] : 1 }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                  >
                    {h.text}
                    {/* The hit: a solid block wipes across the word, carrying the word in ink. */}
                    {h.at !== null && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 -left-[0.08em] -right-[0.08em] block whitespace-nowrap px-[0.08em]"
                        style={{ background: color, color: INK }}
                        initial={false}
                        animate={{ clipPath: lit ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
                        transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
                      >
                        {h.text}
                      </motion.span>
                    )}
                  </motion.span>
                </motion.span>
              </span>{" "}
            </span>
          );
        })}
      </span>
    </h2>
  );
}

/** A tag stamped onto the frame: drops in large and tilted, lands with a hard stop. */
function Sticker({ text, color, delay }: { text: string; color: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 1.55, rotate: -14, y: 6 }}
      animate={{ opacity: 1, scale: 1, rotate: -4, y: 0 }}
      transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.8, delay }}
      className="relative shrink-0 px-3.5 py-1.5 font-hook text-[16px] font-extrabold tracking-[-0.01em]"
      style={{ background: color, color: INK }}
    >
      {sentenceCase(text)}
    </motion.div>
  );
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/** Flat impact lines bursting out from the center: one burst per voiceover hit. */
function HitBurst({ pulse, radius }: { pulse: number; radius: number }) {
  const reduce = useReducedMotion();
  if (pulse === 0 || reduce) return null;
  return (
    <span key={pulse} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 block">
      {RAYS.map((deg, i) => (
        <span key={deg} className="absolute left-0 top-0 block" style={{ transform: `rotate(${deg + (pulse % 2) * 22}deg)` }}>
          <motion.span
            className="absolute -top-[2.5px] left-0 block h-[5px] w-[22px] origin-left"
            style={{ background: i % 2 ? "var(--thread)" : "#ffffff" }}
            initial={{ x: radius * 0.7, scaleX: 0, opacity: 1 }}
            animate={{ x: radius * 1.15, scaleX: [0, 1, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.42, ease: [0.2, 0.8, 0.3, 1] }}
          />
        </span>
      ))}
    </span>
  );
}

const PERIOD = 2.8;
// Spoon path through one loop (offsets from resting in the bowl): hover → dip → hold → lift a spoonful → back.
const SPOON = {
  x: [30, 0, 0, 16, 30],
  y: [-50, 0, 0, -60, -50],
  rotate: [30, 12, 12, 20, 30],
  times: [0, 0.32, 0.46, 0.7, 1],
};
const DROPS = [
  { dx: -26, dy: 44, r: 40 },
  { dx: -12, dy: 58, r: -30 },
  { dx: 6, dy: 52, r: 60 },
  { dx: 18, dy: 40, r: -45 },
  { dx: -4, dy: 36, r: 20 },
  { dx: 26, dy: 56, r: 90 },
];

/** A flat soup bowl: steam rising, a spoon that dips in and lifts out a spoonful, drops falling back in. */
const SALT = Array.from({ length: 12 }, (_, i) => ({ x: 70 + ((i * 37) % 100), d: (i % 6) * 0.05 + Math.floor(i / 6) * 0.12, s: 3 + (i % 3) }));

function SoupScene({ pulse, salt }: { pulse: number; salt: boolean }) {
  const reduce = useReducedMotion();
  const clip = `soup-${useId().replace(/:/g, "")}`;
  const spoonTransition = { duration: PERIOD, times: SPOON.times, repeat: Infinity, ease: "easeInOut" as const, delay: 0.95 };
  return (
    <div className="relative h-[196px] w-[240px] shrink-0" aria-hidden>
      {/* "...is it salty?": a pinch of salt falls in near the end of the line */}
      {salt &&
        !reduce &&
        SALT.map((g, i) => (
          <motion.span
            key={i}
            className="absolute block bg-white"
            style={{ left: g.x, top: 0, width: g.s, height: g.s }}
            initial={{ y: -30, opacity: 0, rotate: 0 }}
            animate={{ y: [-30, 104], opacity: [0, 1, 1, 0], rotate: 180 }}
            transition={{ duration: 0.55, delay: g.d, ease: [0.5, 0, 0.9, 0.6], opacity: { duration: 0.55, delay: g.d, times: [0, 0.15, 0.85, 1] } }}
          />
        ))}
      {/* Steam */}
      {[0, 1, 2].map((i) => (
        <motion.svg
          key={i}
          width="18"
          height="44"
          viewBox="0 0 18 44"
          className="absolute"
          style={{ left: 86 + i * 30, top: 28 }}
          initial={reduce ? { opacity: 0.6 } : { opacity: 0, y: 14 }}
          animate={reduce ? { opacity: 0.6 } : { opacity: [0, 0.95, 0], y: [14, -6, -26], x: [0, 3, -2] }}
          transition={reduce ? { duration: 0 } : { duration: 1.9, repeat: Infinity, ease: "easeOut", delay: 0.5 + i * 0.38 }}
        >
          <path d="M9 42 C2 34 16 28 9 20 C2 12 16 8 9 2" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="5" strokeLinecap="square" />
        </motion.svg>
      ))}

      {/* Spoon (behind the bowl's front, so it sinks in when it dips). Pivots on its bowl. */}
      <motion.div
        className="absolute"
        style={{ left: 130, top: 40, width: 20, height: 96, transformOrigin: "50% 88%" }}
        initial={reduce ? { x: 0, y: 0, rotate: 12 } : { opacity: 0, x: SPOON.x[0], y: SPOON.y[0], rotate: SPOON.rotate[0] }}
        animate={reduce ? { x: 0, y: 0, rotate: 12 } : { opacity: 1, x: SPOON.x, y: SPOON.y, rotate: SPOON.rotate }}
        transition={reduce ? { duration: 0 } : { ...spoonTransition, opacity: { duration: 0.25, delay: 0.8 } }}
      >
        <svg width="20" height="96" viewBox="0 0 20 96">
          <path d="M8 0 H12 L13.5 74 H6.5 Z" fill="var(--thread)" />
          <ellipse cx="10" cy="84" rx="10" ry="12" fill="var(--thread)" />
        </svg>
        {/* The spoonful */}
        {!reduce && (
          <motion.span
            className="absolute left-[4px] top-[78px] block h-[9px] w-[12px]"
            style={{ background: "var(--butter)" }}
            animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.4, 0.4, 1, 1, 0.4] }}
            transition={{ duration: PERIOD, times: [0, 0.44, 0.5, 0.7, 0.76], repeat: Infinity, delay: 0.95 }}
          />
        )}
      </motion.div>

      {/* Drops shaken off the spoon at the top of the lift */}
      {!reduce &&
        DROPS.map((d, i) => (
          <motion.span
            key={i}
            className="absolute block h-[6px] w-[6px]"
            style={{ left: 153, top: 64, background: i % 2 ? "var(--thread)" : "var(--butter)" }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 1, 1, 0],
              x: [0, 0, 0, d.dx * 0.6, d.dx],
              y: [0, 0, 0, -12, d.dy],
              rotate: [0, 0, 0, d.r * 0.5, d.r],
            }}
            transition={{ duration: PERIOD, times: [0, 0.68, 0.7, 0.8, 0.97], repeat: Infinity, ease: "easeOut", delay: 0.95 + i * 0.012 }}
          />
        ))}

      {/* Bowl: drops in, then squashes on each voiceover hit */}
      <motion.div
        className="absolute left-[20px] top-[96px] origin-bottom"
        initial={reduce ? false : { y: -150, opacity: 0, scaleY: 1.15, scaleX: 0.9 }}
        animate={{ y: 0, opacity: 1, scaleY: 1, scaleX: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 17, delay: 0.42, opacity: { duration: 0.12, delay: 0.42 } }}
      >
        <motion.div
          key={pulse}
          className="origin-bottom"
          initial={pulse && !reduce ? { scaleY: 0.8, scaleX: 1.12 } : false}
          animate={{ scaleY: 1, scaleX: 1 }}
          transition={{ type: "spring", stiffness: 640, damping: 13 }}
        >
          <svg width="200" height="96" viewBox="0 0 200 96" className="block overflow-visible">
            <defs>
              <clipPath id={clip}>
                <path d="M12 12 C16 60 50 78 100 78 C150 78 184 60 188 12 Z" />
              </clipPath>
            </defs>
            <path d="M8 10 C12 62 48 82 100 82 C152 82 188 62 192 10 Z" fill="var(--surface)" stroke="var(--thread)" strokeWidth="7" strokeLinejoin="miter" />
            {/* Soup surface, sloshing */}
            <g clipPath={`url(#${clip})`}>
              <motion.path
                d="M-40 22 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V96 H-40 Z"
                fill="var(--butter)"
                animate={reduce ? undefined : { x: [0, 40] }}
                transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
              />
            </g>
            <rect x="0" y="4" width="200" height="8" fill="var(--thread)" />
            <rect x="72" y="84" width="56" height="10" fill="var(--thread)" />
          </svg>
        </motion.div>
      </motion.div>
      <span className="absolute left-1/2 top-[134px] block">
        <HitBurst pulse={pulse} radius={104} />
      </span>
    </div>
  );
}

/** Any other hook icon: pops in, bobs, and kicks on each voiceover hit. */
function IconScene({ icon, color, pulse }: { icon: string; color: string; pulse: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.4, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.4 }}
      className="relative flex h-40 w-40 shrink-0 items-center justify-center"
      aria-hidden
    >
      <span className="absolute inset-3 border-[3px]" style={{ borderColor: color }} />
      <motion.div
        key={pulse}
        initial={pulse && !reduce ? { scale: 1.22, rotate: -6 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
        style={{ color }}
      >
        <ReelIcon name={icon} size={76} strokeWidth={1.75} />
      </motion.div>
      <span className="absolute left-1/2 top-1/2">
        <HitBurst pulse={pulse} radius={84} />
      </span>
    </motion.div>
  );
}

/** Scale for the scene so it fills the space it has (between the headline and the rail), within limits. */
function useFit(natural: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { height, width } = el.getBoundingClientRect();
      setScale(Math.max(0.35, Math.min(1.3, (height - 64) / natural, (width - 40) / 240)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [natural]);
  return [ref, scale] as const;
}

/** The opening beat's graphic: the tag stamped above, the animated scene below. */
export function HookScene({ icon, tag, color, pulse, progress }: { icon: string; tag: string; color: string; pulse: number; progress: number }) {
  const reduce = useReducedMotion();
  const soup = icon === "soup" || icon === "cooking-pot";
  const natural = soup ? 196 : 160;
  const [ref, scale] = useFit(natural);
  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center gap-5"
      initial={false}
      // A small jolt when the sticker lands.
      animate={reduce ? undefined : { y: [0, 0, 5, -2, 0] }}
      transition={{ duration: 0.34, times: [0, 0.01, 0.35, 0.7, 1], delay: 1.08 }}
    >
      <Sticker text={tag} color={color} delay={0.95} />
      <div className="relative flex justify-center" style={{ height: natural * scale, width: 240 * scale }}>
        <div className="absolute left-1/2 top-0 origin-top" style={{ transform: `translateX(-50%) scale(${scale})` }}>
          {soup ? <SoupStage pulse={pulse} salt={progress > 0.8} /> : <IconScene icon={icon} color={color} pulse={pulse} />}
        </div>
      </div>
    </motion.div>
  );
}

/** The soup hook in real 3D (three.js); the flat SVG version stays for reduced motion. */
function SoupStage({ pulse, salt }: { pulse: number; salt: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [accent, setAccent] = useState("#d3f05a");
  useEffect(() => setAccent(threadHex(ref.current)), []);
  if (reduce) return <SoupScene pulse={pulse} salt={salt} />;
  return (
    <div ref={ref} className="h-[196px] w-[240px]" aria-hidden>
      <Soup3D accent={accent} pulse={pulse} salt={salt} />
    </div>
  );
}
