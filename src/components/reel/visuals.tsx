"use client";

import { motion } from "motion/react";
import { COLOR_VAR } from "@/lib/markup";
import type { HighlightColor, ReelScript, Visual } from "@/lib/schema";
import { MarkedText } from "../ui/marked-text";
import { CrowdCanvas } from "./crowd-canvas";
import type { QuizState } from "./use-playback";

const ease = [0.22, 1, 0.36, 1] as const;

function colorOf(c: HighlightColor | undefined) {
  return COLOR_VAR[c ?? "primary"];
}

function Glow({ color, size = 220, opacity = 0.35 }: { color: string; size?: number; opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent) 0%, transparent 70%)`,
        filter: "blur(8px)",
      }}
    />
  );
}

function Emoji({ children, size = 56, delay = 0 }: { children: string; size?: number; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay }}
      style={{ fontSize: size, lineHeight: 1, filter: "drop-shadow(0 0 18px rgba(120,170,255,0.35))" }}
    >
      {children}
    </motion.div>
  );
}

function HookVisual({ v }: { v: Extract<Visual, { type: "hook" }> }) {
  const c = colorOf(v.color);
  return (
    <div className="relative flex flex-col items-center gap-6">
      <Glow color={c} size={300} opacity={0.4} />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute left-1/2 top-[46px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{ borderColor: c, width: 120, height: 120 }}
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
        />
      ))}
      <Emoji size={92}>{v.emoji}</Emoji>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.5, ease }}
        className="rounded-full px-4 py-1.5 text-[13px] font-black uppercase tracking-[0.18em]"
        style={{ color: "#0b1020", background: c, boxShadow: `0 0 28px ${c}` }}
      >
        {v.tag}
      </motion.div>
    </div>
  );
}

function BigWordVisual({ v }: { v: Extract<Visual, { type: "bigword" }> }) {
  const c = colorOf(v.color);
  const long = v.word.length > 10;
  return (
    <div className="relative flex flex-col items-center px-4 text-center">
      <Glow color={c} size={320} opacity={0.28} />
      <motion.div
        initial={{ opacity: 0, scale: 0.6, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease }}
        className={`relative font-black uppercase leading-[0.95] tracking-tight ${long ? "text-[44px]" : "text-[64px]"}`}
        style={{ color: c, textShadow: `0 0 34px color-mix(in srgb, ${c} 70%, transparent)` }}
      >
        {v.word}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45, ease }}
        className="relative mt-4 max-w-[280px] text-[15px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        {v.sub}
      </motion.div>
    </div>
  );
}

function SplitVisual({ v, accent }: { v: Extract<Visual, { type: "split" }>; accent: string }) {
  const side = (s: typeof v.left, i: number) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.35, duration: 0.5, ease }}
      className="flex w-[42%] flex-col items-center text-center"
    >
      <Emoji size={54} delay={i * 0.35}>{s.emoji}</Emoji>
      <div
        className="mt-3 text-[19px] font-black uppercase leading-tight tracking-tight"
        style={{ color: i === 0 ? "var(--text)" : accent }}
      >
        {s.title}
      </div>
      <div className="mt-1.5 text-[13px] font-medium leading-snug text-muted">{s.sub}</div>
    </motion.div>
  );
  return (
    <div className="relative flex w-full items-center justify-between px-5">
      {side(v.left, 0)}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.6, ease }}
          className="h-40 w-px origin-top"
          style={{ background: `linear-gradient(transparent, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}` }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute rounded-full bg-bg0 px-2 py-1 font-mono text-[12px] font-semibold uppercase"
          style={{ color: accent, border: `1px solid ${accent}` }}
        >
          {v.mode === "vs" ? "vs" : "→"}
        </motion.div>
      </div>
      {side(v.right, 1)}
    </div>
  );
}

function FlowVisual({ v, accent, progress }: { v: Extract<Visual, { type: "flow" }>; accent: string; progress: number }) {
  const n = v.steps.length;
  const shown = Math.max(1, Math.min(n, Math.ceil((progress + 0.15) * n)));
  return (
    <div className="relative flex w-full flex-col gap-3 px-8">
      <svg className="absolute left-[60px] top-6 h-[calc(100%-48px)] w-1 overflow-visible" aria-hidden>
        <motion.line
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          stroke={accent}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: shown / n }}
          transition={{ duration: 0.6, ease }}
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
        />
      </svg>
      {v.steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 24 }}
          animate={i < shown ? { opacity: 1, x: 0 } : { opacity: 0.15, x: 0 }}
          transition={{ duration: 0.45, ease }}
          className="relative flex items-center gap-4"
        >
          <div
            className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bg1 text-[28px]"
            style={{ boxShadow: i < shown ? `0 0 0 1.5px ${accent}, 0 0 22px color-mix(in srgb, ${accent} 50%, transparent)` : undefined }}
          >
            {s.emoji}
          </div>
          <div>
            <div className="text-[18px] font-black uppercase leading-tight tracking-tight">{s.title}</div>
            <div className="text-[13px] font-medium leading-snug text-muted">{s.sub}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ListVisual({ v, accent, progress }: { v: Extract<Visual, { type: "list" }>; accent: string; progress: number }) {
  const n = v.items.length;
  const shown = Math.max(1, Math.min(n, Math.floor(progress * (n + 0.6)) + 1));
  return (
    <div className="flex w-full flex-col px-7">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 font-mono text-[12px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        {v.title}
      </motion.div>
      <div className="flex flex-col gap-2.5">
        {v.items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease }}
            className="flex items-center gap-3.5 border-b border-line pb-2.5"
          >
            <span className="w-6 font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[26px] leading-none">{it.emoji}</span>
            <span className="text-[19px] font-extrabold leading-tight tracking-tight">{it.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmojiVisual({ v, accent }: { v: Extract<Visual, { type: "emoji" }>; accent: string }) {
  return (
    <div className="relative flex w-full items-center justify-center gap-3 px-4">
      {v.items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          {i > 0 && v.arrow && (
            <motion.svg
              width="44"
              height="16"
              viewBox="0 0 44 16"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.45 - 0.15 }}
              aria-hidden
            >
              <path d="M2 8h36M32 2l7 6-7 6" stroke={accent} strokeWidth="2.2" fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${accent})` }} />
            </motion.svg>
          )}
          <div className="relative flex flex-col items-center text-center">
            <Glow color={accent} size={130} opacity={0.22} />
            <Emoji size={v.items.length > 2 ? 54 : 70} delay={i * 0.45}>{it.emoji}</Emoji>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.45 + 0.2 }}
              className="mt-3 max-w-[110px] text-[13px] font-black uppercase leading-tight tracking-[0.08em] text-soft"
            >
              {it.label}
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrowdVisual({ v, accent, progress }: { v: Extract<Visual, { type: "crowd" }>; accent: string; progress: number }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative aspect-[1.25] w-[94%]">
        <CrowdCanvas accent={accent} ratio={v.ratio} progress={progress} />
      </div>
      <div className="mt-3 flex items-center gap-5 font-mono text-[12px] uppercase tracking-wider">
        <span className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full bg-[#a9b6d6] opacity-60" /> {v.total_label}
        </span>
        <span className="flex items-center gap-2" style={{ color: accent }}>
          <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} /> {v.highlight_label}
        </span>
      </div>
    </div>
  );
}

function StatVisual({ v }: { v: Extract<Visual, { type: "stat" }> }) {
  const c = colorOf(v.color);
  return (
    <div className="relative flex flex-col items-center text-center">
      <Glow color={c} size={320} opacity={0.3} />
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease }}
        className={`relative font-mono font-semibold leading-none tracking-tight ${v.value.length > 8 ? "text-[48px]" : "text-[72px]"}`}
        style={{ color: c, textShadow: `0 0 36px color-mix(in srgb, ${c} 70%, transparent)` }}
      >
        {v.value}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative mt-4 text-[14px] font-black uppercase tracking-[0.2em] text-soft"
      >
        {v.label}
      </motion.div>
    </div>
  );
}

const LETTERS = ["A", "B", "C", "D"];

function QuizVisual({
  quiz,
  state,
  accent,
  waitLeft,
  onAnswer,
}: {
  quiz: ReelScript["quiz"];
  state: QuizState;
  accent: string;
  waitLeft: number;
  onAnswer: (i: number) => void;
}) {
  return (
    <div className="flex w-full flex-col px-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          Quick check
        </span>
        {state.waiting && (
          <svg width="22" height="22" viewBox="0 0 22 22" aria-label="Time left to answer">
            <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" />
            <circle
              cx="11"
              cy="11"
              r="9"
              stroke={accent}
              strokeWidth="2.5"
              fill="none"
              strokeDasharray={2 * Math.PI * 9}
              strokeDashoffset={2 * Math.PI * 9 * (1 - waitLeft)}
              transform="rotate(-90 11 11)"
            />
          </svg>
        )}
      </div>
      <div className="mb-5 text-[21px] font-extrabold leading-snug tracking-tight">
        <MarkedText text={quiz.question} />
      </div>
      <div className="flex flex-col gap-2.5">
        {quiz.options.map((o, i) => {
          const correct = i === quiz.answer;
          const chosen = state.selected === i;
          const revealed = state.revealed;
          const border = revealed ? (correct ? "var(--good)" : chosen ? "var(--hl-warn)" : "var(--line)") : "rgba(255,255,255,0.22)";
          return (
            <motion.button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAnswer(i);
              }}
              disabled={revealed}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: revealed && !correct && !chosen ? 0.45 : 1, y: 0, scale: revealed && correct ? 1.03 : 1 }}
              transition={{ delay: revealed ? 0 : 0.15 + i * 0.12, duration: 0.35, ease }}
              className="flex items-center gap-3 rounded-2xl border bg-white/[0.04] px-4 py-3.5 text-left text-[16px] font-bold backdrop-blur-sm active:scale-[0.98]"
              style={{
                borderColor: border,
                boxShadow: revealed && correct ? "0 0 26px color-mix(in srgb, var(--good) 45%, transparent)" : undefined,
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px]"
                style={{
                  background: revealed && correct ? "var(--good)" : revealed && chosen ? "var(--hl-warn)" : "rgba(255,255,255,0.08)",
                  color: revealed && (correct || chosen) ? "#0b1020" : "var(--text-soft)",
                }}
              >
                {revealed && correct ? "✓" : revealed && chosen ? "✕" : LETTERS[i]}
              </span>
              <MarkedText text={o} />
            </motion.button>
          );
        })}
      </div>
      {state.revealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-[14px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: state.selected === null ? accent : state.selected === quiz.answer ? "var(--good)" : "var(--hl-warn)" }}
        >
          {state.selected === null ? "Here's the answer" : state.selected === quiz.answer ? "Nailed it" : "Not quite"}
        </motion.div>
      )}
    </div>
  );
}

function OutroVisual({ outro, accent, last }: { outro: ReelScript["outro"]; accent: string; last: boolean }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <Glow color={accent} size={300} opacity={0.25} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative font-mono text-[12px] font-semibold uppercase tracking-[0.3em] text-muted"
      >
        {last ? "You finished" : "Up next"}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease }}
        className="relative mt-3 max-w-[300px] text-[34px] font-black uppercase leading-[1.02] tracking-tight"
        style={{ color: accent, textShadow: `0 0 30px color-mix(in srgb, ${accent} 60%, transparent)` }}
      >
        {outro.next_title}
      </motion.div>
      {!last && (
        <div className="relative mt-10 flex flex-col items-center gap-1" style={{ color: accent }}>
          {[0, 1, 2].map((i) => (
            <motion.svg
              key={i}
              width="28"
              height="14"
              viewBox="0 0 28 14"
              animate={{ opacity: [0.15, 1, 0.15], y: [4, -4, 4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: (2 - i) * 0.18 }}
              aria-hidden
            >
              <path d="M2 12 14 2l12 10" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </motion.svg>
          ))}
          <div className="mt-2 text-[13px] font-extrabold uppercase tracking-[0.2em] text-soft">Keep scrolling</div>
        </div>
      )}
    </div>
  );
}

export type StageProps = {
  visual: Visual | { type: "quiz" } | { type: "outro" };
  script: ReelScript;
  accent: string;
  progress: number;
  quiz: QuizState;
  quizWaitLeft: number;
  onAnswer: (i: number) => void;
  last: boolean;
};

export function VisualStage({ visual, script, accent, progress, quiz, quizWaitLeft, onAnswer, last }: StageProps) {
  switch (visual.type) {
    case "hook":
      return <HookVisual v={visual} />;
    case "bigword":
      return <BigWordVisual v={visual} />;
    case "split":
      return <SplitVisual v={visual} accent={accent} />;
    case "flow":
      return <FlowVisual v={visual} accent={accent} progress={progress} />;
    case "list":
      return <ListVisual v={visual} accent={accent} progress={progress} />;
    case "emoji":
      return <EmojiVisual v={visual} accent={accent} />;
    case "crowd":
      return <CrowdVisual v={visual} accent={accent} progress={progress} />;
    case "stat":
      return <StatVisual v={visual} />;
    case "quiz":
      return <QuizVisual quiz={script.quiz} state={quiz} accent={accent} waitLeft={quizWaitLeft} onAnswer={onAnswer} />;
    case "outro":
      return <OutroVisual outro={script.outro} accent={accent} last={last} />;
  }
}
