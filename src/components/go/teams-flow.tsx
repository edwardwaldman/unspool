"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

const REELS = ["/go/phish.jpg", "/go/fire.jpg", "/go/lift.jpg"];
const FAN = [
  { x: -135, rot: -6, y: 0 },
  { x: 0, rot: 0, y: -14 },
  { x: 135, rot: 6, y: 0 },
];

/** A reel card that flies out of the handbook page and settles into the fan. */
function FlyingReel({ p, src, i }: { p: MotionValue<number>; src: string; i: number }) {
  const t0 = 0.3 + i * 0.05, t1 = t0 + 0.22;
  const x = useTransform(p, [t0, t1], [-390, FAN[i].x]);
  const y = useTransform(p, [t0, t1], [40, FAN[i].y]);
  const rotate = useTransform(p, [t0, t1], [-12, FAN[i].rot]);
  const scale = useTransform(p, [t0, t1], [0.35, 1]);
  const opacity = useTransform(p, [t0, t0 + 0.06], [0, 1]);
  return (
    <motion.img src={src} alt="" width={150} height={267} style={{ x, y, rotate, scale, opacity, zIndex: i === 1 ? 2 : 1 }}
      className="absolute left-1/2 top-1/2 -ml-[75px] -mt-[133px] h-[267px] w-[150px] rounded-[14px] border border-line object-cover shadow-[0_18px_40px_rgba(0,0,0,0.45)]" />
  );
}

function Caption({ p, at, children, x }: { p: MotionValue<number>; at: number; children: string; x: number }) {
  const opacity = useTransform(p, [at, at + 0.06], [0, 1]);
  const y = useTransform(p, [at, at + 0.06], [10, 0]);
  return (
    <motion.p style={{ opacity, y, x }} className="absolute left-1/2 top-[calc(50%+185px)] w-[300px] -translate-x-1/2 text-center text-[15px] leading-snug text-muted">
      {children}
    </motion.p>
  );
}

function Arrow({ p, at, x }: { p: MotionValue<number>; at: number; x: number }) {
  const opacity = useTransform(p, [at, at + 0.05], [0, 1]);
  const ax = useTransform(p, [at, at + 0.05], [x - 14, x]);
  return (
    <motion.svg style={{ opacity, x: ax }} width="44" height="44" viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 -ml-[22px] -mt-[22px] text-thread" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/**
 * Desktop "How it works" for /teams, scroll-scrubbed like the main site's demo: a tall track with a pinned stage.
 * Scrolling plays the flow (and rewinds it on the way back up): the handbook page is read, the reels fly out of it and
 * fan open, then the quiz card arrives and its right answer lights up.
 */
export function TeamsFlow() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.6 });

  // the handbook page: big and centred, a highlighter scans it, then it steps left
  const docX = useTransform(p, [0.12, 0.3], [0, -390]);
  const docScale = useTransform(p, [0.12, 0.3], [1.22, 1]);
  const scan = useTransform(p, [0.02, 0.2], [0, 100]);
  const scanTop = useTransform(scan, (v) => `${18 + v * 0.62}%`);
  // the quiz card arrives from the right; its answer lights up
  const quizX = useTransform(p, [0.6, 0.74], [520, 390]);
  const quizO = useTransform(p, [0.6, 0.68], [0, 1]);
  const answer = useTransform(p, [0.8, 0.86], [0, 1]);
  const answerText = useTransform(answer, [0, 1], ["#e9efe4", "#0f1d18"]);

  return (
    <section ref={track} aria-labelledby="how" className="relative border-t border-line" style={{ height: "320vh" }}>
      <div className="sticky top-0 flex h-[100vh] flex-col justify-center overflow-hidden">
        <h2 id="how" className="max-w-[640px] font-headline text-[40px] font-bold leading-[1.05] tracking-[-0.02em]">
          From a PDF nobody reads to reels people finish.
        </h2>
        <div className="relative mt-6 h-[480px] w-full" aria-hidden>
          <motion.div style={{ x: docX, scale: docScale }} className="absolute left-1/2 top-1/2 -ml-[130px] -mt-[165px] h-[330px] w-[260px]">
            <div className="relative h-full w-full rotate-[-2deg] overflow-hidden rounded-[6px] bg-[#f4f1e8] p-5 text-[#2a2a2a] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8577]">Employee handbook · p. 34</div>
              <div className="mt-2 text-[15px] font-semibold leading-tight">4.2 Fire safety and extinguisher use</div>
              {[100, 92, 97, 84, 95, 70, 98, 88, 60].map((w, k) => (
                <div key={k} className="mt-[11px] h-[6px] rounded-full bg-[#cfcabd]" style={{ width: `${w}%` }} />
              ))}
              <motion.div style={{ top: scanTop }} className="absolute inset-x-3 h-[16px] rounded-[3px] bg-[#d3f05a]/55 mix-blend-multiply" />
            </div>
          </motion.div>
          {REELS.map((src, i) => <FlyingReel key={src} p={p} src={src} i={i} />)}
          <Arrow p={p} at={0.52} x={-236} />
          <Arrow p={p} at={0.58} x={236} />
          <motion.div style={{ x: quizX, opacity: quizO }} className="absolute left-1/2 top-1/2 -ml-[130px] -mt-[100px] w-[260px] rounded-[18px] border border-line bg-surface p-5 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-thread">Quiz</div>
            <div className="mt-2 text-[15px] font-semibold leading-snug">What does P.A.S.S. stand for?</div>
            <div className="mt-3 rounded-[10px] bg-paper px-3 py-2 text-[13px] text-muted">Point, alarm, spray, step</div>
            <div className="relative mt-2 overflow-hidden rounded-[10px] bg-paper px-3 py-2 text-[13px] font-semibold">
              <motion.div style={{ opacity: answer }} className="absolute inset-0 bg-thread" />
              <span className="relative flex items-center justify-between">
                <motion.span style={{ color: answerText }}>Pull, aim, squeeze, sweep</motion.span>
                <motion.span style={{ opacity: answer, color: "#0f1d18" }}>✓</motion.span>
              </span>
            </div>
          </motion.div>
          <Caption p={p} at={0.04} x={-390}>Your handbook, SOP or slides</Caption>
          <Caption p={p} at={0.5} x={0}>One short reel per key idea, with a voiceover and captions</Caption>
          <Caption p={p} at={0.74} x={390}>A quick quiz at the end of every reel</Caption>
        </div>
      </div>
    </section>
  );
}
