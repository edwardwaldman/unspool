"use client";

import { ArrowRight, Check, ChevronUp, X } from "lucide-react";
import { motion } from "motion/react";
import { COLOR_VAR } from "@/lib/markup";
import type { HighlightColor, ReelScript, Visual } from "@/lib/schema";
import { MarkedText } from "../ui/marked-text";
import { CrowdCanvas } from "./crowd-canvas";
import { ReelIcon } from "./icon";
import { QUIZ_WAIT_MS, type QuizState } from "./use-playback";

// The motion graphics drawn inside a reel's frame. Everything reads the reel's own --thread accent
// (set on the frame), sits on the tinted backdrop, and uses soft "glass" cards like video overlays.

const ease = [0.22, 1, 0.36, 1] as const;
const TEXT_SHADOW = { textShadow: "0 2px 18px rgba(0,0,0,.35)" };
const glass = "border border-white/[0.12] bg-white/[0.07] backdrop-blur-[6px]";

function colorOf(c: HighlightColor | undefined) {
  return COLOR_VAR[c ?? "primary"];
}

/** "GUARANTEED QUESTION" → "Guaranteed question" (scripts write tags and labels in caps). */
function sentence(s: string) {
  const t = s.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: color ?? "rgba(255,255,255,.72)" }}>
      {children}
    </div>
  );
}

function Tile({ name, size = 28, on = true, delay = 0, box = 56 }: { name: string; size?: number; on?: boolean; delay?: number; box?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease, delay }}
      className="flex shrink-0 items-center justify-center rounded-[16px]"
      style={{
        width: box,
        height: box,
        background: on ? "var(--thread)" : "rgba(255,255,255,.08)",
        color: on ? "#08110e" : "rgba(255,255,255,.7)",
        border: on ? "none" : "1px solid rgba(255,255,255,.12)",
      }}
    >
      <ReelIcon name={name} size={size} strokeWidth={1.75} />
    </motion.div>
  );
}

function HookVisual({ v }: { v: Extract<Visual, { type: "hook" }> }) {
  const c = colorOf(v.color);
  return (
    <div className="relative flex flex-col items-center gap-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative flex h-36 w-36 items-center justify-center rounded-full"
        style={{ background: `color-mix(in srgb, ${c} 20%, transparent)`, border: `1.5px solid color-mix(in srgb, ${c} 55%, transparent)` }}
      >
        {[0, 1].map((k) => (
          <motion.span
            key={k}
            aria-hidden
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: `color-mix(in srgb, ${c} 40%, transparent)` }}
            animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: k * 1.2 }}
          />
        ))}
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} style={{ color: c }}>
          <ReelIcon name={v.icon} size={62} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="rounded-[10px] px-3.5 py-1.5 font-hook text-[16px] font-extrabold tracking-[-0.01em] text-[#08110e]"
        style={{ background: c, boxShadow: "0 6px 24px rgba(0,0,0,.25)" }}
      >
        {sentence(v.tag)}
      </motion.div>
    </div>
  );
}

function BigWordVisual({ v }: { v: Extract<Visual, { type: "bigword" }> }) {
  const c = colorOf(v.color);
  const long = v.word.length > 10;
  return (
    <div className="relative flex flex-col items-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease }}
        className="relative font-hook font-extrabold uppercase leading-[0.95] tracking-[-0.035em]"
        // Shrinks with the frame width (the reel root is a size container) so long words never clip on phones.
        style={{ color: c, fontSize: `min(${long ? 46 : 66}px, ${(125 / Math.max(4, v.word.length)).toFixed(1)}cqw)`, ...TEXT_SHADOW }}
      >
        {v.word}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`relative mt-5 max-w-[290px] rounded-full px-4 py-1.5 text-[15px] font-medium text-white ${glass}`}
      >
        {sentence(v.sub)}
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
      className={`flex flex-1 flex-col items-center rounded-[20px] px-3 py-5 text-center ${glass}`}
    >
      <Tile name={s.icon} on={i === 1} delay={i * 0.3} />
      <div className="mt-4 font-hook text-[24px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: i === 0 ? "#fff" : "var(--thread)" }}>
        {s.title}
      </div>
      <div className="mt-1 text-[13.5px] leading-snug text-white/70">{s.sub}</div>
    </motion.div>
  );
  return (
    <div className="relative flex w-full items-center gap-3 px-5">
      {side(v.left, 0)}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease }}
        className="absolute left-1/2 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] font-hook text-[12px] font-extrabold uppercase text-[#08110e]"
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
            className={`relative flex items-center gap-4 rounded-[18px] p-3 pr-4 ${glass}`}
          >
            <Tile name={s.icon} on={on} size={24} box={50} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Step {i + 1}</div>
              <div className="font-hook text-[19px] font-extrabold leading-tight tracking-[-0.01em] text-white">{sentence(s.title)}</div>
              <div className="text-[13px] leading-snug text-white/70">{s.sub}</div>
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
    <div className={`flex w-full flex-col rounded-[22px] p-4 ${glass}`}>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <Label color="var(--thread)">{v.title}</Label>
        <span className="font-mono text-[11px] text-white/60">
          {shown}/{n}
        </span>
      </div>
      {v.items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-3.5 rounded-[14px] px-1 py-2"
        >
          <Tile name={it.icon} size={20} box={40} on={i === shown - 1} />
          <span className="text-[18px] font-semibold leading-tight tracking-[-0.01em] text-white">{it.label}</span>
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
      <div className="relative aspect-[1.25] w-[94%]">
        <CrowdCanvas ratio={v.ratio} progress={progress} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-medium text-white/85 ${glass}`}>
          <span className="h-2 w-2 rounded-full bg-white/50" />
          {sentence(v.total_label)}
        </span>
        <span className="flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold text-[#08110e]" style={{ background: "var(--thread)" }}>
          <span className="h-2 w-2 rounded-full bg-[#08110e]" />
          {sentence(v.highlight_label)} · {pct}%
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
        {v.value}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`relative mt-5 rounded-full px-4 py-1.5 text-[14.5px] font-medium text-white ${glass}`}
      >
        {sentence(v.label)}
      </motion.div>
    </div>
  );
}

const LETTERS = ["A", "B", "C", "D"];

/** The quiz, as an overlay card inside the frame: question, tappable answers, and a ring timing the wait. */
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
  const verdict = state.selected === null ? "Time's up" : state.selected === quiz.answer ? "Correct" : "Not quite";
  const verdictColor = state.selected === null ? "rgba(255,255,255,.7)" : state.selected === quiz.answer ? "var(--sage)" : "var(--coral)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease }}
      className="w-full rounded-[24px] border border-white/[0.14] bg-black/40 p-5 backdrop-blur-[14px]"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#08110e]" style={{ background: "var(--thread)" }}>
          Quick check
        </span>
        {state.waiting ? (
          <span className="relative h-7 w-7" aria-label="Time left to answer">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--thread)" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={`${waitLeft} 1`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-white">{Math.ceil((waitLeft * QUIZ_WAIT_MS) / 1000)}</span>
          </span>
        ) : state.revealed ? (
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-[13px] font-bold" style={{ color: verdictColor }}>
            {verdict}
          </motion.span>
        ) : null}
      </div>
      <div className="mt-4 text-[19px] font-semibold leading-snug tracking-[-0.01em] text-white">
        <MarkedText text={quiz.question} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: revealed && !correct && !chosen ? 0.45 : 1, y: 0 }}
              transition={{ delay: revealed ? 0 : 0.15 + i * 0.08, duration: 0.35, ease }}
              className="flex items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left text-[15.5px] font-medium text-white transition-colors enabled:hover:bg-white/[0.14]"
              style={{
                borderColor: tone ?? "rgba(255,255,255,.14)",
                background: tone ? `color-mix(in srgb, ${tone} 18%, transparent)` : "rgba(255,255,255,.07)",
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11.5px] font-bold"
                style={{ background: tone ?? "rgba(255,255,255,.12)", color: tone ? "#08110e" : "#fff" }}
              >
                {revealed && correct ? <Check size={15} strokeWidth={3} /> : revealed && chosen ? <X size={15} strokeWidth={3} /> : LETTERS[i]}
              </span>
              <MarkedText text={o} />
            </motion.button>
          );
        })}
      </div>
      {state.revealed && (
        <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 text-[14.5px] leading-snug text-white/85">
          <MarkedText text={quiz.explain} />
        </motion.p>
      )}
    </motion.div>
  );
}

function OutroVisual({ outro, last }: { outro: ReelScript["outro"]; last: boolean }) {
  return (
    <div className="relative flex flex-col items-center px-6 text-center">
      <span className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/85 ${glass}`}>
        {last ? "End of document" : "Up next"}
      </span>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55, ease }}
        className="relative mt-5 max-w-[320px] font-hook text-[36px] font-extrabold uppercase leading-[1] tracking-[-0.03em] text-thread"
        style={TEXT_SHADOW}
      >
        {outro.next_title}
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
};

/** One beat's motion graphic. The quiz is not part of the stage: it's an interactive overlay (QuizCard). */
export function VisualStage({ visual, script, progress, last }: StageProps) {
  switch (visual.type) {
    case "hook":
      return <HookVisual v={visual} />;
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
    case "quiz":
      return null;
    case "outro":
      return <OutroVisual outro={script.outro} last={last} />;
  }
}
