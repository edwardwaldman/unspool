"use client";

import { ArrowRight, Check, ChevronUp, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COLOR_VAR } from "@/lib/markup";
import type { HighlightColor, Mood, ReelScript, SceneSpec, Visual } from "@/lib/schema";
import { DIAGRAM_TYPES } from "@/lib/schema";
import { DiagramStage } from "./diagrams";
import { MarkedText } from "../ui/marked-text";
import { CrowdCanvas } from "./crowd-canvas";
import { HookScene } from "./hook-scene";
import { ReelIcon } from "./icon";
import { sentenceCase, splitDots } from "./text";
import { QUIZ_WAIT_MS, type QuizState } from "./use-playback";

// The motion graphics drawn inside a reel's frame. Everything reads the reel's own --thread accent
// (set on the frame), sits on the flat tinted backdrop, and uses flat, square, bordered panels.

const ease = [0.22, 1, 0.36, 1] as const;
const TEXT_SHADOW = { textShadow: "0 2px 0 rgba(0,0,0,.45)" };
const glass = "border border-white/[0.16] bg-black/40 backdrop-blur-[2px]";

function colorOf(c: HighlightColor | undefined) {
  return COLOR_VAR[c ?? "primary"];
}

const sentence = sentenceCase;

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="text-[13px] font-semibold" style={{ color: color ?? "rgba(255,255,255,.72)" }}>
      {typeof children === "string" ? sentence(children) : children}
    </div>
  );
}

function Tile({ name, size = 28, on = true, delay = 0, box = 56 }: { name: string; size?: number; on?: boolean; delay?: number; box?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease, delay }}
      className="flex shrink-0 items-center justify-center"
      style={{ width: box, height: box, color: on ? "var(--thread)" : "rgba(255,255,255,.6)" }}
    >
      <ReelIcon name={name} size={size} strokeWidth={1.75} />
    </motion.div>
  );
}

function HookVisual({ v, pulse, progress }: { v: Extract<Visual, { type: "hook" }>; pulse: number; progress: number }) {
  return <HookScene icon={v.icon} tag={v.tag} color={colorOf(v.color)} pulse={pulse} progress={progress} />;
}

function BigWordVisual({ v }: { v: Extract<Visual, { type: "bigword" }> }) {
  const c = colorOf(v.color);
  const parts = splitDots(v.word).map(sentence);
  const subs = splitDots(v.sub);
  // "POT · SPOON" / "population · sample": a stacked pair, each word with its own line under it.
  if (parts.length > 1 && subs.length === parts.length) {
    return (
      <div className="relative flex flex-col items-stretch gap-3 px-6">
        {parts.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease, delay: i * 0.22 }}
            className={`flex items-baseline justify-between gap-5 px-5 py-3 ${glass}`}
          >
            <span className="font-hook text-[44px] font-extrabold leading-none tracking-[-0.035em]" style={{ color: c }}>
              {p}
            </span>
            <span className="text-[16px] font-medium text-white/85">{sentence(subs[i])}</span>
          </motion.div>
        ))}
      </div>
    );
  }
  const word = parts.join(" ");
  const long = word.length > 10;
  return (
    <div className="relative flex flex-col items-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative font-hook font-extrabold leading-[0.95] tracking-[-0.035em]"
        // Shrinks with the frame width (the reel root is a size container) so long words never clip on phones.
        style={{ color: c, fontSize: `min(${long ? 48 : 68}px, ${(135 / Math.max(4, word.length)).toFixed(1)}cqw)`, ...TEXT_SHADOW }}
      >
        {word}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`relative mt-5 max-w-[290px] px-4 py-1.5 text-[15px] font-medium text-white ${glass}`}
      >
        {sentence(subs.join(", "))}
      </motion.div>
    </div>
  );
}

function SplitVisual({ v }: { v: Extract<Visual, { type: "split" }> }) {
  const side = (s: typeof v.left, i: number) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, x: i === 0 ? -24 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.3, duration: 0.55, ease }}
      className={`flex flex-1 flex-col items-center px-3 py-5 text-center ${glass}`}
    >
      <Tile name={s.icon} on={i === 1} delay={i * 0.3} />
      <div className="mt-4 font-hook text-[24px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: i === 0 ? "#fff" : "var(--thread)" }}>
        {sentence(s.title)}
      </div>
      <div className="mt-1 text-[13.5px] leading-snug text-white/70">{sentence(s.sub)}</div>
    </motion.div>
  );
  return (
    <div className="relative flex w-full items-center gap-3 px-5">
      {side(v.left, 0)}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease }}
        className="absolute left-1/2 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-[3px] font-hook text-[13px] font-extrabold text-[#08110e]"
        style={{ background: "var(--thread)", borderColor: "var(--paper)" }}
      >
        {v.mode === "vs" ? "vs" : <ArrowRight size={16} strokeWidth={2.5} />}
      </motion.div>
      {side(v.right, 1)}
    </div>
  );
}

function FlowVisual({ v, progress }: { v: Extract<Visual, { type: "flow" }>; progress: number }) {
  const n = v.steps.length;
  const shown = Math.max(1, Math.min(n, Math.ceil((progress + 0.15) * n)));
  return (
    <div className="relative flex w-full flex-col gap-2.5 px-6">
      {v.steps.map((s, i) => {
        const on = i < shown;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: on ? 1 : 0.35, x: 0 }}
            transition={{ duration: 0.45, ease, delay: i * 0.05 }}
            className={`relative flex items-center gap-4 p-3 pr-4 ${glass}`}
          >
            <Tile name={s.icon} on={on} size={24} box={50} />
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-white/55">Step {i + 1}</div>
              <div className="font-hook text-[19px] font-extrabold leading-tight tracking-[-0.01em] text-white">{sentence(s.title)}</div>
              <div className="text-[13px] leading-snug text-white/70">{sentence(s.sub)}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ListVisual({ v, progress }: { v: Extract<Visual, { type: "list" }>; progress: number }) {
  const n = v.items.length;
  const shown = Math.max(1, Math.min(n, Math.floor(progress * (n + 0.6)) + 1));
  return (
    <div className="w-full px-6">
    <div className={`flex w-full flex-col p-4 ${glass}`}>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <Label color="var(--thread)">{v.title}</Label>
        <span className="text-[12px] tabular-nums text-white/60">
          {shown} of {n}
        </span>
      </div>
      {v.items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-3.5 px-1 py-2"
        >
          <Tile name={it.icon} size={20} box={40} on={i === shown - 1} />
          <span className="text-[18px] font-semibold leading-tight tracking-[-0.01em] text-white">{sentence(it.label)}</span>
        </motion.div>
      ))}
    </div>
    </div>
  );
}

function IconsVisual({ v }: { v: Extract<Visual, { type: "icons" }> }) {
  const many = v.items.length > 2;
  return (
    <div className="relative flex w-full items-center justify-center gap-3 px-4">
      {v.items.map((it, i) => (
        <div key={i} className="relative flex items-center gap-3">
          {i > 0 && v.arrow && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.45 - 0.15 }} className="text-white/70">
              <ArrowRight size={24} strokeWidth={2} />
            </motion.div>
          )}
          <div className="flex flex-col items-center text-center">
            <Tile name={it.icon} size={many ? 34 : 44} box={many ? 76 : 96} on={i === v.items.length - 1} delay={i * 0.45} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.45 + 0.2 }}
              className="mt-3 max-w-[120px] text-[14px] font-semibold leading-tight text-white"
            >
              {sentence(it.label)}
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrowdVisual({ v, progress }: { v: Extract<Visual, { type: "crowd" }>; progress: number }) {
  const pct = Math.round(v.ratio * 100);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {/* Fits the stage either way: as wide as it can be, but never taller than the space above the captions. */}
      <div className="relative aspect-[1.25] max-h-[calc(100%-40px)] w-[94%]">
        <CrowdCanvas ratio={v.ratio} progress={progress} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="flex items-center gap-2 px-1 py-1 text-[12.5px] font-medium text-white/85">
          <span className="h-2 w-2 bg-white/50" />
          {sentence(v.total_label)}
        </span>
        <span className="flex items-center gap-2 px-1 py-1 text-[12.5px] font-semibold text-thread">
          <span className="h-2 w-2 bg-thread" />
          {sentence(v.highlight_label)}, {pct}%
        </span>
      </div>
    </div>
  );
}

function StatVisual({ v }: { v: Extract<Visual, { type: "stat" }> }) {
  const c = colorOf(v.color);
  return (
    <div className="relative flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className={`relative font-mono font-bold leading-none tracking-[-0.05em] ${v.value.length > 8 ? "text-[48px]" : "text-[76px]"}`}
        style={{ color: c, ...TEXT_SHADOW }}
      >
        {sentence(v.value)}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`relative mt-5 px-4 py-1.5 text-[14.5px] font-medium text-white ${glass}`}
      >
        {sentence(v.label)}
      </motion.div>
    </div>
  );
}

const LETTERS = ["A", "B", "C", "D"];
/** Each answer's badge colour, game-show style. */
const BADGE = ["#d3f05a", "#5fd4ff", "#ff7ac6", "#ffd25a"];
const CONFETTI = ["#d3f05a", "#5fd4ff", "#ff7ac6", "#ffd25a", "#ffffff"];

/**
 * Shrinks its child to fit the box it is given (never grows it): a long question with long answers stays inside
 * the frame instead of running under the account row and the rail.
 */
function FitBox({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      const h = i.scrollHeight, room = o.clientHeight;
      setScale(h > room && h > 0 ? Math.max(0.55, room / h) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className="flex h-full w-full items-end">
      <div ref={inner} className="w-full origin-bottom" style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}>
        {children}
      </div>
    </div>
  );
}

/** The quiz, as a game-show card inside the frame: sticker, countdown ring, colour-coded answers, a reaction. */
export function QuizCard({
  quiz,
  state,
  waitLeft,
  onAnswer,
}: {
  quiz: ReelScript["quiz"];
  state: QuizState;
  waitLeft: number;
  onAnswer: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  const right = state.revealed && state.selected === quiz.answer;
  const wrong = state.revealed && state.selected !== null && state.selected !== quiz.answer;
  const verdict = state.selected === null ? "⏰ Time's up" : right ? "🎉 Correct!" : "😬 Not quite";
  const verdictColor = state.selected === null ? "rgba(255,255,255,.8)" : right ? "var(--sage)" : "var(--coral)";
  const secs = Math.ceil((waitLeft * QUIZ_WAIT_MS) / 1000);
  const urgent = state.waiting && secs <= 3;
  const R = 15, C = 2 * Math.PI * R;
  return (
    <FitBox>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9, rotate: -1.5 }}
        animate={wrong && !reduce ? { opacity: 1, y: 0, scale: 1, rotate: 0, x: [0, -10, 9, -6, 4, 0] } : { opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={wrong ? { duration: 0.45 } : { type: "spring", stiffness: 260, damping: 20 }}
        className="relative w-full overflow-visible border bg-black/55 p-4 backdrop-blur-md"
        style={{ borderColor: right ? "var(--sage)" : wrong ? "var(--coral)" : "rgba(255,255,255,.16)", boxShadow: right ? "0 0 40px color-mix(in srgb, var(--sage) 45%, transparent)" : wrong ? "0 0 40px color-mix(in srgb, var(--coral) 40%, transparent)" : "0 18px 50px rgba(0,0,0,.45)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti on a right answer */}
        {right && !reduce && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
            {Array.from({ length: 22 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute block h-2.5 w-1.5"
                style={{ left: `${(i * 47) % 100}%`, background: CONFETTI[i % CONFETTI.length] }}
                initial={{ y: 0, opacity: 1, rotate: 0 }}
                animate={{ y: [0, -60 - (i % 5) * 14, 260], x: ((i % 7) - 3) * 14, opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 420 }}
                transition={{ duration: 1.5 + (i % 4) * 0.15, ease: "easeOut" }}
              />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -4 }}
            transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.1 }}
            className="inline-block bg-thread px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.08em] text-paper"
          >
            ⚡ Quick check
          </motion.span>
          {state.waiting ? (
            <motion.span
              className="relative flex h-10 w-10 items-center justify-center"
              animate={urgent && !reduce ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={urgent ? { duration: 0.5, repeat: Infinity } : undefined}
              aria-label="Time left to answer"
            >
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r={R} fill="none" stroke={urgent ? "var(--coral)" : "var(--thread)"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - waitLeft)} />
              </svg>
              <span className="relative text-[14px] font-black tabular-nums" style={{ color: urgent ? "var(--coral)" : "#fff" }}>{secs}</span>
            </motion.span>
          ) : state.revealed ? (
            <motion.span initial={{ opacity: 0, scale: 0.4, rotate: 8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 12 }} className="text-[15px] font-black" style={{ color: verdictColor }}>
              {verdict}
            </motion.span>
          ) : null}
        </div>
        <div className="mt-3 text-[18px] font-bold leading-snug tracking-[-0.01em] text-white">
          <MarkedText text={quiz.question} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {quiz.options.map((o, i) => {
            const correct = i === quiz.answer;
            const chosen = state.selected === i;
            const revealed = state.revealed;
            const tone = revealed && correct ? "var(--sage)" : revealed && chosen ? "var(--coral)" : null;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer(i);
                }}
                disabled={revealed}
                initial={{ opacity: 0, x: i % 2 ? 40 : -40, scale: 0.9 }}
                animate={{ opacity: revealed && !correct && !chosen ? 0.4 : 1, x: 0, scale: revealed && correct ? [1, 1.05, 1] : 1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ delay: revealed ? 0 : 0.2 + i * 0.1, type: "spring", stiffness: 300, damping: 22 }}
                className="flex items-center gap-3 border px-3 py-2.5 text-left text-[15px] font-semibold text-white transition-colors enabled:hover:bg-white/[0.12]"
                style={{
                  borderColor: tone ?? "rgba(255,255,255,.16)",
                  background: tone ? `color-mix(in srgb, ${tone} 22%, transparent)` : "rgba(255,255,255,.04)",
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black"
                  style={{ background: tone ?? BADGE[i % BADGE.length], color: "#0b0f0d" }}
                >
                  {revealed && correct ? <Check size={15} strokeWidth={3.2} /> : revealed && chosen ? <X size={15} strokeWidth={3.2} /> : LETTERS[i]}
                </span>
                <MarkedText text={o} />
              </motion.button>
            );
          })}
        </div>
        {state.revealed && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-3 text-[14px] leading-snug text-white/85">
            {right && <span className="mr-1.5 font-black text-sage">+1 🧠</span>}
            <MarkedText text={quiz.explain} />
          </motion.p>
        )}
      </motion.div>
    </FitBox>
  );
}

function OutroVisual({ outro, last }: { outro: ReelScript["outro"]; last: boolean }) {
  return (
    <div className="relative flex flex-col items-center px-6 text-center">
      <span className="text-[14px] font-medium text-white/75">{last ? "End of document" : "Up next"}</span>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55, ease }}
        className="relative mt-4 max-w-[320px] font-hook text-[38px] font-extrabold leading-[1.02] tracking-[-0.03em] text-thread"
        style={TEXT_SHADOW}
      >
        {sentence(outro.next_title)}
      </motion.div>
      {!last && (
        <div className="relative mt-10 flex flex-col items-center text-white">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], y: [3, -3, 3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: (1 - i) * 0.2 }}
              className="-mt-2"
            >
              <ChevronUp size={28} strokeWidth={2} />
            </motion.div>
          ))}
          <div className="mt-2 text-[13px] font-medium text-white/75">Swipe for the next reel</div>
        </div>
      )}
    </div>
  );
}

export type StageProps = {
  visual: Visual | { type: "quiz" } | { type: "outro" };
  script: ReelScript;
  progress: number;
  last: boolean;
  /** Voiceover hits reached so far in the opening beat (the hook graphic pulses on each). */
  pulse?: number;
  /** The beat's 3D story scene from the script, when it has one (drawn by Scene3D; the flat stage ignores it). */
  scene?: SceneSpec;
  /** The beat's background mood, when the script sets one. */
  mood?: Mood;
};

/** One beat's motion graphic, centred and as large as the space allows, popping in and floating gently (as in the ads). The quiz is an interactive overlay (QuizCard), not part of the stage. */
export function VisualStage(props: StageProps) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const b = box.current, c = content.current;
    if (!b || !c) return;
    // Fit the graphic to the space it has (up to 125%), so it fills the frame but never spills onto the captions or title.
    const measure = () => setFit(Math.min(1.25, (b.clientHeight - 16) / Math.max(1, c.offsetHeight), (b.clientWidth - 16) / Math.max(1, c.offsetWidth)));
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  const inner = <StageInner {...props} />;
  if (props.visual.type === "quiz" || props.visual.type === "hook" || DIAGRAM_TYPES.has(props.visual.type)) return inner;
  return (
    <div ref={box} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <motion.div
        className="relative"
        style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }}
        initial={reduce ? false : { scale: 0.82, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1, y: [0, -6, 0] }}
        transition={{ scale: { type: "spring", stiffness: 260, damping: 18 }, opacity: { duration: 0.25 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      >
        <div ref={content} style={{ transform: `scale(${fit})` }}>
          {inner}
        </div>
      </motion.div>
    </div>
  );
}

function StageInner({ visual, script, progress, last, pulse = 0 }: StageProps) {
  switch (visual.type) {
    case "hook":
      return <HookVisual v={visual} pulse={pulse} progress={progress} />;
    case "bigword":
      return <BigWordVisual v={visual} />;
    case "split":
      return <SplitVisual v={visual} />;
    case "flow":
      return <FlowVisual v={visual} progress={progress} />;
    case "list":
      return <ListVisual v={visual} progress={progress} />;
    case "icons":
      return <IconsVisual v={visual} />;
    case "crowd":
      return <CrowdVisual v={visual} progress={progress} />;
    case "stat":
      return <StatVisual v={visual} />;
    case "graph":
    case "equation":
    case "emoji":
      return <DiagramStage visual={visual} progress={progress} />;
    case "quiz":
      return null;
    case "outro":
      return <OutroVisual outro={script.outro} last={last} />;
  }
}
