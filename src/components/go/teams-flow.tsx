"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

// The three sections of the handbook page and the reels they become (same order: the highlight, the pill, the reel).
const IDEAS = [
  { line: "4.1 Spotting a phishing email", pill: "Check the sender", reel: "/go/phish.jpg" },
  { line: "4.2 Using a fire extinguisher", pill: "P.A.S.S.", reel: "/go/fire.jpg" },
  { line: "4.3 Lifting safely", pill: "Bend your knees", reel: "/go/lift.jpg" },
];
const PAGE_X = -390, QUIZ_X = 390;
const FAN = [{ x: -135, rot: -6, y: 6 }, { x: 0, rot: 0, y: -10 }, { x: 135, rot: 6, y: 6 }];
// where each section heading sits on the page (px from the page's centre), for the pills to lift off from
const LINE_Y = [-62, 18, 98];
// beats, as fractions of the scroll track
const T = { highlight: 0.05, slide: 0.25, lift: 0.34, reel: 0.44, quiz: 0.66, answer: 0.8 };

/** A section heading on the page, swept by a lime highlighter at its moment. */
function PageSection({ p, i }: { p: MotionValue<number>; i: number }) {
  const t = T.highlight + i * 0.07;
  const sweep = useTransform(p, [t, t + 0.06], ["0%", "calc(100% + 8px)"]);
  return (
    <div className="mt-4">
      <div className="relative inline-block">
        <motion.span style={{ width: sweep }} className="absolute inset-y-[-2px] left-[-4px] rounded-[3px] bg-[#d3f05a]/70" />
        <span className="relative text-[13.5px] font-semibold">{IDEAS[i].line}</span>
      </div>
      {[94, 82, 88].map((w, k) => <div key={k} className="mt-[7px] h-[5px] rounded-full bg-[#cfcabd]" style={{ width: `${w - i * 4}%` }} />)}
    </div>
  );
}

/** The highlighted idea lifts off the page as a pill, flies to its spot, and turns into the reel. */
function IdeaToReel({ p, i, pageX }: { p: MotionValue<number>; i: number; pageX: MotionValue<number> }) {
  const t0 = T.lift + i * 0.04, t1 = T.reel + i * 0.05;
  const k = useTransform(p, [t0, t1], [0, 1]);
  const fromX = useTransform(pageX, (x) => x - 20);
  const x = useTransform([k, fromX] as MotionValue<number>[], ([kk, fx]: number[]) => fx + (FAN[i].x - fx) * kk);
  const y = useTransform(k, [0, 1], [LINE_Y[i], FAN[i].y]);
  const pillO = useTransform(p, [t0 - 0.01, t0 + 0.02, t1 - 0.02, t1 + 0.01], [0, 1, 1, 0]);
  const reelO = useTransform(p, [t1 - 0.02, t1 + 0.02], [0, 1]);
  const reelS = useTransform(p, [t1 - 0.02, t1 + 0.06], [0.5, 1]);
  const rotate = useTransform(p, [t1, t1 + 0.06], [0, FAN[i].rot]);
  return (
    <motion.div style={{ x, y, zIndex: i === 1 ? 3 : 2 }} className="absolute left-1/2 top-1/2">
      <motion.span style={{ opacity: pillO }} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#d3f05a] px-3.5 py-1.5 text-[13px] font-semibold text-[#0f1d18] shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
        {IDEAS[i].pill}
      </motion.span>
      <motion.img src={IDEAS[i].reel} alt="" width={150} height={267} style={{ opacity: reelO, scale: reelS, rotate }}
        className="absolute -ml-[75px] -mt-[133px] h-[267px] w-[150px] max-w-none rounded-[14px] border border-line object-cover shadow-[0_18px_40px_rgba(0,0,0,0.45)]" />
    </motion.div>
  );
}

function Arrow({ p, at, x }: { p: MotionValue<number>; at: number; x: number }) {
  const opacity = useTransform(p, [at, at + 0.05], [0, 1]);
  const ax = useTransform(p, [at, at + 0.05], [x - 14, x]);
  return (
    <motion.svg style={{ opacity, x: ax }} width="40" height="40" viewBox="0 0 24 24" className="absolute left-1/2 top-1/2 -ml-[20px] -mt-[20px] text-thread" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

/** The progress rail under the stage: three steps that light up as the flow reaches them. */
function Rail({ p }: { p: MotionValue<number> }) {
  const fill = useTransform(p, [0.05, T.answer + 0.04], ["0%", "100%"]);
  const steps: [string, number][] = [["Your document", 0.04], ["Short reels", T.reel], ["A quiz on each", T.quiz]];
  return (
    <div className="relative mx-auto mt-4 w-full max-w-[760px]">
      <div className="absolute left-[16.6%] right-[16.6%] top-[7px] h-[2px] bg-line">
        <motion.div style={{ width: fill }} className="h-full bg-thread" />
      </div>
      <div className="relative grid grid-cols-3">
        {steps.map(([label, at]) => <RailStep key={label} p={p} at={at} label={label} />)}
      </div>
    </div>
  );
}
function RailStep({ p, at, label }: { p: MotionValue<number>; at: number; label: string }) {
  const on = useTransform(p, [at, at + 0.03], [0, 1]);
  const color = useTransform(on, [0, 1], ["#7f8f86", "#e9efe4"]);
  return (
    <div className="flex flex-col items-center">
      <span className="relative h-4 w-4 rounded-full border-2 border-line bg-paper">
        <motion.span style={{ opacity: on }} className="absolute inset-[-2px] rounded-full bg-thread" />
      </span>
      <motion.span style={{ color }} className="mt-2.5 text-[15px] font-medium">{label}</motion.span>
    </div>
  );
}

/**
 * Desktop "How it works" for /teams, scroll-scrubbed like the main site's demo (plays forward on the way down, rewinds
 * on the way up): the key ideas on a handbook page get highlighted, lift off as pills, turn into the reels, then the
 * quiz arrives and its right answer lights up. A rail underneath tracks the three steps.
 */
export function TeamsFlow() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.5 });

  const pageIn = useTransform(p, [0, 0.04], [0, 1]);
  const pageY = useTransform(p, [0, 0.04], [24, 0]);
  const pageX = useTransform(p, [T.slide, T.slide + 0.1], [0, PAGE_X]);
  const pageDim = useTransform(p, [T.slide, T.slide + 0.1], [1, 0.55]);
  const quizX = useTransform(p, [T.quiz, T.quiz + 0.1], [QUIZ_X + 120, QUIZ_X]);
  const quizO = useTransform(p, [T.quiz, T.quiz + 0.06], [0, 1]);
  const answer = useTransform(p, [T.answer, T.answer + 0.05], [0, 1]);
  const answerText = useTransform(answer, [0, 1], ["#e9efe4", "#0f1d18"]);

  return (
    <section ref={track} aria-labelledby="how" className="relative border-t border-line" style={{ height: "340vh" }}>
      <div className="sticky top-0 flex h-[100vh] flex-col justify-center overflow-hidden">
        <h2 id="how" className="mx-auto max-w-[640px] text-center font-headline text-[40px] font-bold leading-[1.05] tracking-[-0.02em]">
          From a PDF nobody reads to reels people finish.
        </h2>
        <div className="relative mt-4 h-[440px] w-full" aria-hidden>
          <motion.div style={{ x: pageX, y: pageY, opacity: pageIn }} className="absolute left-1/2 top-1/2 -ml-[140px] -mt-[180px] h-[360px] w-[280px]">
            <motion.div style={{ opacity: pageDim }} className="h-full w-full rotate-[-1.5deg] rounded-[6px] bg-[#f4f1e8] px-6 py-5 text-[#2a2a2a] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8577]">Employee handbook · p. 34</div>
              <div className="mt-1.5 text-[17px] font-bold leading-tight">4. Safety at work</div>
              {IDEAS.map((_, i) => <PageSection key={i} p={p} i={i} />)}
            </motion.div>
          </motion.div>
          {IDEAS.map((_, i) => <IdeaToReel key={i} p={p} i={i} pageX={pageX} />)}
          <Arrow p={p} at={T.reel + 0.08} x={-236} />
          <Arrow p={p} at={T.quiz - 0.02} x={236} />
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
        </div>
        <Rail p={p} />
      </div>
    </section>
  );
}
