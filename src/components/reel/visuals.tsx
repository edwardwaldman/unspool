"use client";

import { ArrowRight, Check, ChevronUp, X } from "lucide-react";
import { motion } from "motion/react";
import { COLOR_VAR } from "@/lib/markup";
import type { HighlightColor, ReelScript, Visual } from "@/lib/schema";
import { MarkedText } from "../ui/marked-text";
import { CrowdCanvas } from "./crowd-canvas";
import { ReelIcon } from "./icon";
import type { QuizState } from "./use-playback";

const ease = [0.22, 1, 0.36, 1] as const;

function colorOf(c: HighlightColor | undefined) {
  return COLOR_VAR[c ?? "primary"];
}

/** Halos removed: the design uses flat color only (no gradients or glow fields). */
function Halo(props: { color?: string; size?: number }) {
  void props;
  return null;
}

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="font-sans text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: color ?? "var(--muted)" }}>
      {children}
    </div>
  );
}

function Icon({ name, size = 44, delay = 0, color = "var(--thread)" }: { name: string; size?: number; delay?: number; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay }}
      style={{ color }}
    >
      <ReelIcon name={name} size={size} />
    </motion.div>
  );
}

function HookVisual({ v }: { v: Extract<Visual, { type: "hook" }> }) {
  const c = colorOf(v.color);
  return (
    <div className="relative flex flex-col items-center gap-7">
      <Halo color={c} size={280} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative flex h-32 w-32 items-center justify-center rounded-full border"
        style={{ borderColor: `color-mix(in srgb, ${c} 45%, transparent)` }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-[-14px] rounded-full border"
          style={{ borderColor: `color-mix(in srgb, ${c} 18%, transparent)` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <Icon name={v.icon} size={52} color={c} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease }}
        className="relative border px-3.5 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.22em]"
        style={{ borderColor: c, color: c }}
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
    <div className="relative flex flex-col items-center px-5 text-center">
      <Halo color={c} size={300} />
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease }}
        className={`relative font-hook font-extrabold uppercase leading-[0.95] tracking-[-0.03em] ${long ? "text-[44px]" : "text-[62px]"}`}
        style={{ color: c }}
      >
        {v.word}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative mt-5 max-w-[280px]"
      >
        <Label>{v.sub}</Label>
      </motion.div>
    </div>
  );
}

function SplitVisual({ v }: { v: Extract<Visual, { type: "split" }> }) {
  const side = (s: typeof v.left, i: number) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.3, duration: 0.55, ease }}
      className="flex w-[42%] flex-col items-center text-center"
    >
      <Icon name={s.icon} size={40} delay={i * 0.3} color={i === 0 ? "var(--ink)" : "var(--thread)"} />
      <div
        className="mt-4 font-hook text-[20px] font-extrabold uppercase leading-tight tracking-[-0.01em]"
        style={{ color: i === 0 ? "var(--ink)" : "var(--thread)" }}
      >
        {s.title}
      </div>
      <div className="mt-1.5 text-[13px] leading-snug text-muted">{s.sub}</div>
    </motion.div>
  );
  return (
    <div className="relative flex w-full items-center justify-between px-5">
      <Halo size={240} />
      {side(v.left, 0)}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.6, ease }}
          className="h-40 w-px origin-top bg-line"
        />
        <div className="absolute top-1/2 -translate-y-1/2 border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] uppercase text-muted">
          {v.mode === "vs" ? "vs" : <ArrowRight size={12} strokeWidth={1.5} />}
        </div>
      </div>
      {side(v.right, 1)}
    </div>
  );
}

function FlowVisual({ v, progress }: { v: Extract<Visual, { type: "flow" }>; progress: number }) {
  const n = v.steps.length;
  const shown = Math.max(1, Math.min(n, Math.ceil((progress + 0.15) * n)));
  return (
    <div className="relative flex w-full flex-col px-8">
      <div aria-hidden className="absolute bottom-7 left-[59px] top-7 w-px bg-line">
        <motion.div
          className="w-px bg-thread"
          initial={{ height: 0 }}
          animate={{ height: `${((shown - 1) / Math.max(1, n - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease }}
        />
      </div>
      {v.steps.map((s, i) => {
        const on = i < shown;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: on ? 1 : 0.25, x: 0 }}
            transition={{ duration: 0.45, ease }}
            className="relative flex items-center gap-4 py-2.5"
          >
            <div
              className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center border bg-paper"
              style={{ borderColor: on ? "var(--thread)" : "var(--border)", color: on ? "var(--thread)" : "var(--muted)" }}
            >
              <ReelIcon name={s.icon} size={24} strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-mono text-[10.5px] text-muted">{String(i + 1).padStart(2, "0")}</div>
              <div className="font-hook text-[18px] font-extrabold uppercase leading-tight">{s.title}</div>
              <div className="text-[13px] leading-snug text-muted">{s.sub}</div>
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
    <div className="flex w-full flex-col px-7">
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
        <Label color="var(--thread)">{v.title}</Label>
        <span className="font-mono text-[11px] text-muted">
          {shown}/{n}
        </span>
      </div>
      {v.items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-4 border-b border-line py-3"
        >
          <span className="w-5 font-mono text-[12px] text-muted">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-thread">
            <ReelIcon name={it.icon} size={20} strokeWidth={1.5} />
          </span>
          <span className="text-[18px] font-semibold leading-tight tracking-[-0.01em]">{it.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function IconsVisual({ v }: { v: Extract<Visual, { type: "icons" }> }) {
  return (
    <div className="relative flex w-full items-center justify-center gap-4 px-4">
      <Halo size={260} />
      {v.items.map((it, i) => (
        <div key={i} className="relative flex items-center gap-4">
          {i > 0 && v.arrow && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.45 - 0.15 }} className="text-muted">
              <ArrowRight size={22} strokeWidth={1.25} />
            </motion.div>
          )}
          <div className="flex flex-col items-center text-center">
            <Icon name={it.icon} size={v.items.length > 2 ? 46 : 60} delay={i * 0.45} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.45 + 0.2 }} className="mt-4 max-w-[110px]">
              <Label color="var(--ink)">{it.label}</Label>
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
      <div className="mt-2 flex items-center gap-6">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          <Label>{v.total_label}</Label>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-thread" />
          <Label color="var(--thread)">{v.highlight_label}</Label>
          <span className="font-mono text-[11px] text-thread">{pct}%</span>
        </span>
      </div>
    </div>
  );
}

function StatVisual({ v }: { v: Extract<Visual, { type: "stat" }> }) {
  const c = colorOf(v.color);
  return (
    <div className="relative flex flex-col items-center text-center">
      <Halo color={c} size={280} />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className={`relative font-mono font-medium leading-none tracking-[-0.04em] ${v.value.length > 8 ? "text-[46px]" : "text-[68px]"}`}
        style={{ color: c }}
      >
        {v.value}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative mt-5 border-t border-line pt-3">
        <Label color="var(--ink)">{v.label}</Label>
      </motion.div>
    </div>
  );
}

const LETTERS = ["A", "B", "C", "D"];

function QuizVisual({
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
  const result = state.selected === null ? "Answer" : state.selected === quiz.answer ? "Correct" : "Not quite";
  return (
    <div className="flex w-full flex-col px-6">
      <div className="mb-3 flex items-center justify-between">
        <Label color="var(--thread)">Quick check</Label>
        {state.waiting && (
          <div className="h-px w-16 bg-line" aria-label="Time left to answer">
            <div className="h-px bg-thread" style={{ width: `${waitLeft * 100}%` }} />
          </div>
        )}
      </div>
      <div className="mb-5 text-[20px] font-semibold leading-snug tracking-[-0.01em]">
        <MarkedText text={quiz.question} />
      </div>
      <div className="flex flex-col">
        {quiz.options.map((o, i) => {
          const correct = i === quiz.answer;
          const chosen = state.selected === i;
          const revealed = state.revealed;
          const tone = revealed ? (correct ? "var(--sage)" : chosen ? "var(--coral)" : "var(--border)") : "var(--border)";
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
              animate={{ opacity: revealed && !correct && !chosen ? 0.4 : 1, y: 0 }}
              transition={{ delay: revealed ? 0 : 0.15 + i * 0.1, duration: 0.35, ease }}
              className="-mt-px flex items-center gap-3.5 border bg-paper/60 px-4 py-3.5 text-left text-[16px] font-medium hover:bg-surface"
              style={{ borderColor: tone, position: "relative", zIndex: revealed && (correct || chosen) ? 1 : 0 }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[11px]"
                style={{
                  borderColor: revealed && (correct || chosen) ? tone : "var(--border)",
                  color: revealed && (correct || chosen) ? tone : "var(--muted)",
                }}
              >
                {revealed && correct ? <Check size={13} strokeWidth={2} /> : revealed && chosen ? <X size={13} strokeWidth={2} /> : LETTERS[i]}
              </span>
              <MarkedText text={o} />
            </motion.button>
          );
        })}
      </div>
      {state.revealed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
          <Label
            color={state.selected === null ? "var(--muted)" : state.selected === quiz.answer ? "var(--sage)" : "var(--coral)"}
          >
            {result}
          </Label>
        </motion.div>
      )}
    </div>
  );
}

function OutroVisual({ outro, last }: { outro: ReelScript["outro"]; last: boolean }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <Halo size={260} />
      <Label>{last ? "End of document" : "Up next"}</Label>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55, ease }}
        className="relative mt-4 max-w-[300px] font-hook text-[34px] font-extrabold uppercase leading-[1] tracking-[-0.02em] text-thread"
      >
        {outro.next_title}
      </motion.div>
      {!last && (
        <div className="relative mt-10 flex flex-col items-center text-thread">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], y: [3, -3, 3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: (1 - i) * 0.2 }}
              className="-mt-2"
            >
              <ChevronUp size={26} strokeWidth={1.25} />
            </motion.div>
          ))}
          <div className="mt-3">
            <Label>Keep scrolling</Label>
          </div>
        </div>
      )}
    </div>
  );
}

export type StageProps = {
  visual: Visual | { type: "quiz" } | { type: "outro" };
  script: ReelScript;
  progress: number;
  quiz: QuizState;
  quizWaitLeft: number;
  onAnswer: (i: number) => void;
  last: boolean;
};

export function VisualStage({ visual, script, progress, quiz, quizWaitLeft, onAnswer, last }: StageProps) {
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
      return <QuizVisual quiz={script.quiz} state={quiz} waitLeft={quizWaitLeft} onAnswer={onAnswer} />;
    case "outro":
      return <OutroVisual outro={script.outro} last={last} />;
  }
}
