"use client";

import { Loader2 } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice, MAX_REELS, PRICING } from "@/lib/config";
import { stripMarkup } from "@/lib/markup";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { estimateDuration } from "@/lib/timing";
import { fileLabel, reelAccent, reelTint } from "../reel/accent";
import { ReelSlot, SpoolMoreSheet, type FeedItem } from "../reel/feed";
import { stageIndex, stageLine } from "../reel/loading-reel";
import { UnlockSheet } from "../reel/drip-gate";
import { ShareSheet } from "../reel/share-sheet";
import { SharedLinks } from "./shared-links";
import { joinComma, sentenceCase } from "../reel/text";
import { ChevronDown, ChevronUp, LockIcon, UploadIcon } from "../ui/icons";
import { MarkedText } from "../ui/marked-text";
import { formatCountdown, freeAtFor, useCountdown } from "../ui/use-countdown";
import { usePendingUpload, type UploadState } from "../upload/upload-store";
import { FILE_ACCEPT, useUploader } from "../upload/use-uploader";

type ReelState = "ready" | "generating" | "queued" | "failed" | "locked";

function reelState(r: ReelDTO): ReelState {
  if (r.locked) return "locked";
  if (r.status === "ready") return "ready";
  if (r.status === "generating") return "generating";
  if (r.status === "failed") return "failed";
  return "queued";
}

const STATE_LABEL: Record<ReelState, string> = { ready: "Ready", generating: "Writing", queued: "Queued", failed: "Failed", locked: "Locked" };

function docStatus(spool: SpoolDTO | null, upload: UploadState | null) {
  if (upload?.phase === "error" || spool?.status === "failed") return { label: "Failed", tone: "var(--coral)" };
  const stage = stageIndex(spool, upload);
  return [
    { label: "Uploading", tone: "var(--thread)" },
    { label: "Reading", tone: "var(--thread)" },
    { label: "Planning reels", tone: "var(--thread)" },
    { label: "Writing reels", tone: "var(--thread)" },
    { label: "Ready", tone: "var(--sage)" },
  ][stage];
}

const plain = (s: string) => s.replace(/[*#^~]/g, "");

function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function NewUploadButton() {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploader();
  const pending = usePendingUpload();
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={Boolean(pending)}
        className="mt-3 flex w-full items-center justify-center gap-2 border border-line py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted hover:bg-white/[0.03] disabled:opacity-50"
      >
        <UploadIcon size={15} /> {pending ? "Starting upload" : "New upload"}
      </button>
    </>
  );
}

const PILL_TONE: Record<ReelState, string> = {
  ready: "var(--sage)",
  generating: "var(--thread)",
  queued: "var(--muted)",
  failed: "var(--coral)",
  locked: "var(--muted)",
};

/** "Ready", "Writing", "Locked, free in 42:10" as small plain text in the state's color. */
function StateText({ state, until }: { state: ReelState; until?: string | null }) {
  const left = useCountdown(until ?? null);
  return (
    <span className="shrink-0 text-[12px] font-medium tabular-nums" style={{ color: PILL_TONE[state] }}>
      {STATE_LABEL[state]}
      {state === "locked" && left > 0 && <span className="text-thread">, free in {formatCountdown(left)}</span>}
    </span>
  );
}

/** A mini 9:16 frame for the reel list: the reel's flat tint with its hook burned in, dimmed when locked. */
function ReelThumb({ reel, state, on }: { reel: ReelDTO; state: ReelState; on: boolean }) {
  const accent = reelAccent(reel.index);
  const [first, ...rest] = plain(reel.hook).split(" ");
  return (
    <span
      className="relative block h-[78px] w-[44px] shrink-0 overflow-hidden"
      style={{ background: reelTint(accent, state === "ready" ? 26 : 14), border: `1px solid ${on ? accent : "rgba(255,255,255,.08)"}` }}
      aria-hidden
    >
      <span className={`absolute inset-x-[4px] top-[8px] line-clamp-5 font-hook text-[6.5px] font-extrabold leading-[1.25] text-white ${state === "locked" ? "opacity-40" : ""}`}>
        <span className="px-[1px] text-[#08110e]" style={{ background: accent }}>
          {first}
        </span>{" "}
        {rest.join(" ")}
      </span>
      {state === "locked" && (
        <span className="absolute bottom-[5px] left-[5px] text-white/80">
          <LockIcon size={10} strokeWidth={2.25} />
        </span>
      )}
      {(state === "generating" || state === "queued") && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={14} strokeWidth={2} className={`text-white/80 ${state === "generating" ? "animate-spin" : ""}`} />
        </span>
      )}
      {on && state === "ready" && (
        <span className="absolute bottom-[5px] left-[5px] flex h-[9px] items-end gap-[1.5px]">
          {[0, 1, 2].map((k) => (
            <span key={k} className="w-[2px] animate-pulse bg-white" style={{ height: `${[9, 5, 7][k]}px`, animationDelay: `${k * 0.2}s` }} />
          ))}
        </span>
      )}
    </span>
  );
}

/** A collapsible card section in the details panel. */
function Section({ title, meta, children, defaultOpen = true }: { title: string; meta?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[14px] font-semibold text-ink"
      >
        {title}
        <span className="flex items-center gap-2 text-[12px] font-normal text-muted">
          {meta}
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

/** Quiz preview for the details panel: pick an answer, see why. */
function QuizPreview({ quiz }: { quiz: NonNullable<ReelDTO["script"]>["quiz"] }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div>
      <p className="text-[14.5px] leading-snug text-ink">{plain(quiz.question)}</p>
      <div className="mt-3 space-y-1.5">
        {quiz.options.map((o, i) => {
          const shown = picked !== null;
          const right = i === quiz.answer;
          const color = shown && right ? "var(--sage)" : shown && i === picked ? "var(--coral)" : undefined;
          return (
            <button
              key={i}
              type="button"
              disabled={shown}
              onClick={() => setPicked(i)}
              className="flex w-full items-center gap-3 border border-line px-3 py-2.5 text-left text-[13.5px] transition-colors enabled:hover:border-muted enabled:hover:bg-white/[0.03]"
              style={color ? { borderColor: color, color, background: `color-mix(in srgb, ${color} 10%, transparent)` } : undefined}
            >
              <span
                className="w-3 shrink-0 text-[12px] font-bold"
                style={{ color: color ?? "var(--muted)" }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {plain(o)}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="mt-3 text-[13.5px] leading-snug text-ink/85">
          <span className="font-semibold" style={{ color: picked === quiz.answer ? "var(--sage)" : "var(--coral)" }}>
            {picked === quiz.answer ? "Correct. " : "Not quite. "}
          </span>
          <MarkedText text={quiz.explain} />
        </p>
      )}
    </div>
  );
}

/** The reel's script as a transcript, with each beat's start time. */
function Transcript({ reel }: { reel: ReelDTO }) {
  const script = reel.script!;
  const lengths = script.beats.map((b, i) => reel.audio?.[`b${i}`]?.duration ?? estimateDuration(stripMarkup(b.say)));
  const rows = script.beats.map((b, i) => ({ start: lengths.slice(0, i).reduce((x, y) => x + y, 0), say: b.say }));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="flex gap-3 text-[13.5px] leading-[1.5] text-ink/85">
          <span className="w-9 shrink-0 pt-[1px] text-[12px] tabular-nums text-muted">{clock(r.start)}</span>
          <span>
            <MarkedText text={r.say} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** "This reel turns free in 1:47:12" for a locked reel further down the drip. */
function ReelFreeIn({ at }: { at: string | null }) {
  const left = useCountdown(at);
  if (!left) return null;
  return (
    <p className="text-[13.5px] text-muted">
      This reel turns free in <span className="tabular-nums text-ink">{formatCountdown(left)}</span>
    </p>
  );
}

/** Live countdown to the next free reel. */
function NextFreeTimer({ until }: { until: string }) {
  const left = useCountdown(until);
  if (!left) return null;
  return (
    <span className="shrink-0 text-[14px] font-semibold tabular-nums text-thread" title="Next free reel">
      {formatCountdown(left)}
    </span>
  );
}

function UnlockCta({ spool, onUnlock }: { spool: SpoolDTO; onUnlock: () => void }) {
  const locked = spool.reels.filter((r) => r.locked).length;
  if (!locked) return null;
  return (
    <div className="border border-line bg-surface p-4">
      <div>
        <div>
          <div className="text-[14.5px] font-semibold text-ink">
            {locked} {locked === 1 ? "reel" : "reels"} locked
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            {spool.nextFreeUnlockAt ? "One more turns free every hour, or skip the wait." : "Unlock the rest of this document to keep going."}
          </p>
        </div>
      </div>
      {spool.nextFreeUnlockAt && (
        <p className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
          <span className="text-muted">Next free reel in</span>
          <NextFreeTimer until={spool.nextFreeUnlockAt} />
        </p>
      )}
      <button
        type="button"
        onClick={onUnlock}
        className="mt-3 flex w-full items-center justify-between bg-thread px-4 py-3 text-[14px] font-semibold text-paper transition-opacity hover:opacity-90"
      >
        <span>Unlock all reels</span>
        <span className="text-[13px] tabular-nums">{formatPrice(PRICING.documentCents)}</span>
      </button>
      <p className="mt-2 text-center text-[11.5px] text-muted">One-time payment for this document.</p>
    </div>
  );
}

/** Right-hand panel: what the active reel covers, its transcript, its quiz, or the unlock pitch. */
function Details({ spool, reel, onUnlock, onRetry }: { spool: SpoolDTO | null; reel: ReelDTO | null; onUnlock: () => void; onRetry: () => void }) {
  if (!spool || !reel) {
    return (
      <div>
        <div className="text-[13px] font-medium text-muted">Up next</div>
        <p className="mt-2 text-[14px] leading-snug text-muted">Your reel titles appear here as soon as the plan is ready. Reel 1 starts playing on its own.</p>
        <div className="mt-5 space-y-2.5">
          <div className="shimmer h-3 w-[80%]" />
          <div className="shimmer h-3 w-[64%]" />
          <div className="shimmer h-3 w-[72%]" />
        </div>
      </div>
    );
  }
  const state = reelState(reel);
  const script = reel.script;
  return (
    <div className="space-y-4" style={{ "--thread": reelAccent(reel.index) } as React.CSSProperties}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted">About this reel</span>
          <StateText state={state} />
        </div>
        <h2 className="mt-3 font-display text-[24px] leading-[1.1]">{sentenceCase(reel.title)}</h2>
        <div className="mt-1.5 text-[12.5px] text-muted">
          Part {reel.index} of {spool.reels.length}
          {script ? `, ${script.beats.length} beats and a quick check` : ""}
        </div>
        <p className="mt-3 text-[14.5px] leading-snug text-ink/80">{plain(reel.hook)}</p>
      </div>

      {script ? (
        <>
          <div className="border-l-2 border-thread py-1 pl-4">
            <div className="text-[13px] font-semibold text-thread">Key point</div>
            <p className="mt-1.5 text-[14.5px] leading-snug text-ink">
              <MarkedText text={script.summary} />
            </p>
          </div>
          <Section title="Transcript" meta={`${script.beats.length} lines`}>
            <Transcript reel={reel} />
          </Section>
          <Section title="Quick check" meta={`${script.quiz.options.length} options`}>
            <QuizPreview key={reel.id} quiz={script.quiz} />
          </Section>
        </>
      ) : state === "locked" ? (
        <div className="space-y-3">
          <ReelFreeIn at={freeAtFor(reel.index, spool.freeReels, spool.nextFreeUnlockAt)} />
          <p className="text-[13.5px] leading-snug text-muted">The script, voiceover and quiz for this reel open when it&apos;s unlocked.</p>
          <UnlockCta spool={spool} onUnlock={onUnlock} />
        </div>
      ) : state === "failed" ? (
        <div className="border border-line p-4">
          <p className="text-[14px] text-coral">{reel.error ?? "This reel didn't come out right."}</p>
          <button type="button" onClick={onRetry} className="mt-3 bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper">
            Retry
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[14px] leading-snug text-muted">{state === "generating" ? "Writing this reel now." : "Queued."} It plays here the moment it&apos;s ready.</p>
          <div className="mt-4 space-y-2.5">
            <div className="shimmer h-3 w-[78%]" />
            <div className="shimmer h-3 w-[60%]" />
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center border border-line bg-paper text-ink transition-colors hover:border-muted disabled:opacity-25 disabled:hover:border-line"
    >
      {children}
    </button>
  );
}

/** A far-off reel on the track: its tint and hook, no player (cheap to render while gliding past). */
function SlidePreview({ reel }: { reel: ReelDTO | null }) {
  if (!reel) return <div className="h-full w-full bg-black" />;
  const accent = reelAccent(reel.index);
  return (
    <div className="relative h-full w-full overflow-hidden bg-black" aria-hidden>
      <div className="absolute inset-0" style={{ background: `color-mix(in srgb, ${accent} 9%, transparent)` }} />
      <p className={`absolute inset-x-5 top-[62px] font-hook text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white ${reel.locked ? "opacity-40" : ""}`}>
        {plain(reel.hook)}
      </p>
    </div>
  );
}

const rubber = (p: number, last: number) => (p < 0 ? p * 0.3 : p > last ? last + (p - last) * 0.3 : p);

/**
 * The player frame as a vertical track, like Reels/TikTok: every reel is stacked one frame-height
 * apart and changing `index` glides the whole track, so the current reel scrolls out the top and the
 * next one comes in from below (and back). Wheel/trackpad snaps one reel per gesture; touch or mouse
 * drag follows the finger with a rubber band at the ends and snaps on release. Only the reels next to
 * the active one (and the one we're leaving) get a real slot; the rest are static previews.
 */
function ReelTrack({
  items,
  index,
  onStep,
  className,
  children,
}: {
  items: FeedItem[];
  index: number;
  onStep: (i: number) => void;
  className: string;
  children: (item: FeedItem, i: number) => React.ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const pos = useMotionValue(index);
  const y = useTransform(pos, (p) => `${-p * 100}%`);
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(index);
  const last = items.length - 1;
  const latest = useRef({ index, last, onStep });
  useEffect(() => {
    latest.current = { index, last, onStep };
  });

  const glide = useCallback(
    (to: number) => {
      const d = Math.abs(pos.get() - to);
      const done = () => setSettled(to);
      return reduce
        ? animate(pos, to, { duration: 0.12, ease: "easeOut", onComplete: done })
        : // ~450ms for one reel; longer jumps run through the reels in between, a little faster each.
          animate(pos, to, { type: "spring", visualDuration: Math.min(0.45 + 0.06 * Math.max(0, d - 1), 0.75), bounce: 0, onComplete: done });
    },
    [pos, reduce],
  );

  useEffect(() => {
    const a = glide(index);
    return () => a.stop();
  }, [index, glide]);

  // Wheel / trackpad: accumulate, step one reel, then hold until the gesture (and its inertia) ends.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const w = { acc: 0, locked: false, lockedAt: 0, lastAbs: 0, gap: 0 };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1);
      const abs = Math.abs(d);
      const now = performance.now();
      window.clearTimeout(w.gap);
      w.gap = window.setTimeout(() => Object.assign(w, { locked: false, acc: 0, lastAbs: 0 }), 160);
      if (w.locked) {
        // A new flick mid-inertia shows up as a sharp rise in delta; anything else is the tail.
        const fresh = now - w.lockedAt > 450 && abs > 12 && abs > w.lastAbs * 1.6;
        w.lastAbs = abs;
        if (!fresh) return;
        w.locked = false;
        w.acc = 0;
      }
      w.lastAbs = abs;
      if (w.acc && Math.sign(w.acc) !== Math.sign(d)) w.acc = 0;
      w.acc += d;
      if (Math.abs(w.acc) < 40) return;
      const { index: i, last: n, onStep: step } = latest.current;
      const to = Math.max(0, Math.min(n, i + Math.sign(w.acc)));
      Object.assign(w, { acc: 0, locked: true, lockedAt: now });
      if (to !== i) step(to);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(w.gap);
    };
  }, []);

  // Touch / pen / mouse drag.
  const drag = useRef<{ id: number; x0: number; y0: number; p0: number; h: number; moved: boolean } | null>(null);
  const swallowClickUntil = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !frame.current) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: pos.get(), h: frame.current.clientHeight, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(e.clientX - d.x0)) return;
      d.moved = true;
      pos.stop();
      d.p0 = pos.get();
      d.y0 = e.clientY;
      frame.current?.setPointerCapture(e.pointerId);
    }
    pos.set(rubber(Math.max(index - 1, Math.min(index + 1, d.p0 - (e.clientY - d.y0) / d.h)), last));
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    swallowClickUntil.current = performance.now() + 350;
    const off = pos.get() - index;
    const v = pos.getVelocity(); // reels per second
    const dir = Math.abs(v) > 1.2 ? Math.sign(v) : Math.abs(off) > 0.2 ? Math.sign(off) : 0;
    const to = Math.max(0, Math.min(last, index + dir));
    if (to !== index) onStep(to);
    else glide(index);
  };

  return (
    <div
      ref={frame}
      className={`${className} touch-none`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(e) => {
        // The click that ends a drag shouldn't pause the reel or open the paywall.
        if (performance.now() < swallowClickUntil.current) {
          e.stopPropagation();
          e.preventDefault();
          swallowClickUntil.current = 0;
        }
      }}
      data-testid="reel-track"
    >
      <motion.div className="absolute inset-0 will-change-transform" style={{ y }}>
        {items.map((it, i) => {
          const live = Math.abs(i - index) <= 1 || i === settled;
          return (
            <section
              key={it.key}
              className="absolute inset-x-0 h-full overflow-hidden"
              style={{ top: `${i * 100}%` }}
              aria-label={it.reel?.title ?? "Loading reel"}
              aria-hidden={i !== index}
              inert={i !== index}
              data-active={i === index ? "true" : undefined}
            >
              {live ? children(it, i) : <SlidePreview reel={it.reel} />}
            </section>
          );
        })}
      </motion.div>
    </div>
  );
}

/**
 * Desktop document view: the document and its reels on the left, the active reel playing in a phone-
 * sized frame in the middle, and what that reel covers (transcript, quiz, unlock) on the right. Same
 * reels and player as the mobile feed; this is just a wider frame around them.
 */
export function Workbench({
  items,
  viewer,
  initialIndex = 0,
  onIndexChange,
  upload,
  onRetry,
  onDeleted,
}: {
  items: FeedItem[];
  viewer: ViewerDTO | null;
  initialIndex?: number;
  onIndexChange?: (i: number) => void;
  upload?: UploadState | null;
  onRetry?: (spool: SpoolDTO | null) => void;
  onDeleted?: (spool: SpoolDTO) => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [paywall, setPaywall] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareRev, setShareRev] = useState(0);

  const spool = items[0]?.spool ?? null;
  const reels = spool?.reels ?? [];
  const cur = Math.max(0, Math.min(index, items.length - 1));
  const item = items[cur];
  const reel = item?.reel ?? null;
  const lockedCount = reels.filter((r) => r.locked).length;
  const ready = reels.filter((r) => r.status === "ready").length;
  const writing = reels.filter((r) => r.status === "generating").length;
  const status = docStatus(spool, upload ?? null);
  const ext = spool?.fileType ?? upload?.fileName?.split(".").pop() ?? "";

  const paywallTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(paywallTimer.current), []);
  const select = useCallback(
    (i: number, opts: { paywall?: boolean } = {}) => {
      if (i < 0 || i >= items.length) return;
      window.clearTimeout(paywallTimer.current);
      setIndex((from) => {
        // A locked reel's paywall waits for the track to land on it instead of covering the scroll.
        if (opts.paywall && items[i]?.reel?.locked) paywallTimer.current = window.setTimeout(() => setPaywall(true), Math.min(650, 300 + 70 * Math.abs(i - from)));
        return i;
      });
      onIndexChange?.(i);
    },
    [items, onIndexChange],
  );

  // Arrow keys / j k step through the reels.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paywall || moreOpen || shareOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        select(cur + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        select(cur - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, select, paywall, moreOpen, shareOpen]);

  const firstLocked = reels.find((r) => r.locked)?.index ?? 2;
  const closePaywall = useCallback(() => setPaywall(false), []);
  const listed = reels.length ? reels : null;
  const totalReels = reels.length || spool?.totalReels || 0;

  return (
    <div className="flex h-full w-full min-h-0">
      {/* Left: the document and its reels */}
      <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-r border-line">
        <div className="px-5 pb-4 pt-5">
          <div className="text-[12.5px] text-muted" data-testid="doc-meta">
            {joinComma([
              ext ? fileLabel(ext) : null,
              spool?.pageCount ? `${spool.pageCount} ${spool.pageCount === 1 ? "page" : "pages"}` : null,
              spool?.wordCount ? `${spool.wordCount.toLocaleString("en-US")} words` : null,
              spool?.truncated ? "trimmed" : null,
            ]) || "Document"}
          </div>
          <h1 className="mt-2 line-clamp-3 font-display text-[22px] leading-[1.1] text-ink">{spool?.title ?? spool?.fileName ?? upload?.fileName ?? "Your document"}</h1>
          {spool?.title && <div className="mt-1.5 truncate text-[12.5px] text-muted">{spool.fileName}</div>}
          <div className="mt-4 h-px bg-line" />
          <div className="mt-3 flex items-baseline justify-between text-[13px]">
            <span className="font-medium" style={{ color: status.tone }}>
              {status.label}
            </span>
            {totalReels > 0 && stageIndex(spool, upload ?? null) >= 3 && (
              <span className="tabular-nums text-muted">
                {ready} of {totalReels} ready
              </span>
            )}
          </div>
          <div className="mt-2 flex h-[2px] overflow-hidden bg-line" role="progressbar" aria-valuenow={ready} aria-valuemax={totalReels || 1} aria-label="Reels ready">
            <div className="h-full bg-thread transition-[width] duration-500" style={{ width: `${totalReels ? (ready / totalReels) * 100 : 4}%` }} />
            {writing > 0 && totalReels > 0 && (
              <div className="h-full animate-pulse" style={{ width: `${(writing / totalReels) * 100}%`, background: "color-mix(in srgb, var(--thread) 40%, var(--border))" }} />
            )}
          </div>
          {(stageIndex(spool, upload ?? null) < 3 || upload?.phase === "error" || spool?.status === "failed") && (
            <p className="mt-2 text-[12px] text-muted" aria-live="polite">
              {upload?.phase === "error" ? upload.error : spool?.status === "failed" ? spool.error : stageLine(spool, upload ?? null)}
            </p>
          )}
          <NewUploadButton />
        </div>

        <div className="flex items-baseline justify-between border-t border-line px-5 pb-2 pt-4">
          <span className="text-[13px] font-medium text-ink">Reels</span>
          {listed && <span className="text-[12px] tabular-nums text-muted">{lockedCount ? `${spool?.freeReels ?? 1} free, ${lockedCount} locked` : "All unlocked"}</span>}
        </div>
        <ol className="space-y-0.5 px-2.5 pb-4" aria-label="Reels">
          {listed
            ? listed.map((r, i) => {
                const state = reelState(r);
                const on = i === cur;
                const nextDrip = state === "locked" && spool?.nextFreeUnlockAt && r.index === spool.freeReels + 1 ? spool.nextFreeUnlockAt : null;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => select(i, { paywall: true })}
                      aria-current={on ? "true" : undefined}
                      className={`flex w-full items-center gap-3 p-2 text-left transition-colors ${on ? "bg-surface" : "hover:bg-white/[0.03]"}`}
                    >
                      <ReelThumb reel={r} state={state} on={on} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted">Part {r.index}</span>
                          <StateText state={state} until={nextDrip} />
                        </span>
                        <span className={`mt-0.5 block truncate text-[13.5px] font-semibold ${state === "locked" ? "text-ink/70" : "text-ink"}`}>{sentenceCase(r.title)}</span>
                        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted">{plain(r.hook)}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            : Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 p-2">
                  <span className="h-[78px] w-[44px] shrink-0 bg-white/[0.05]" />
                  <span className="flex-1 space-y-1.5">
                    <span className="shimmer block h-2.5" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                    <span className="shimmer block h-2 w-[40%]" />
                  </span>
                </li>
              ))}
        </ol>
        {spool && lockedCount > 0 && (
          <div className="sticky bottom-0 mt-auto bg-paper px-4 pb-4 pt-2">
            <UnlockCta spool={spool} onUnlock={() => setPaywall(true)} />
          </div>
        )}
      </aside>

      {/* Center: the player */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto xl:overflow-hidden">
        <div className="relative flex min-h-[calc(100dvh-64px)] flex-1 items-center justify-center overflow-hidden px-6 py-6">
          <div className="relative flex items-center gap-4 pl-14">
            <ReelTrack
              items={items}
              index={cur}
              onStep={select}
              className="relative aspect-[9/16] h-[calc(100dvh-112px)] max-h-[920px] min-h-[520px] shrink-0 overflow-hidden border border-line bg-black"
            >
              {(it, i) => (
                <ReelSlot
                  item={it}
                  upload={i === 0 ? upload ?? null : null}
                  active={i === cur && !paywall && !moreOpen && !shareOpen}
                  total={reels.length || MAX_REELS}
                  bottomInset={0}
                  onRetry={() => onRetry?.(it.spool)}
                  onUnlock={() => setPaywall(true)}
                  onMore={() => setMoreOpen(true)}
                  onShare={() => setShareOpen(true)}
                  onEnded={() => {
                    if (i + 1 < items.length) setTimeout(() => select(i + 1, { paywall: true }), 900);
                  }}
                />
              )}
            </ReelTrack>
            <nav className="flex w-10 flex-col items-center gap-2.5" aria-label="Switch reel">
              <NavButton label="Previous reel (↑)" disabled={cur === 0} onClick={() => select(cur - 1)}>
                <ChevronUp size={20} strokeWidth={2} />
              </NavButton>
              <span className="whitespace-nowrap py-1 text-[11.5px] tabular-nums text-muted" aria-label={`Reel ${cur + 1} of ${items.length}`}>
                {cur + 1} of {items.length}
              </span>
              <NavButton label="Next reel (↓)" disabled={cur >= items.length - 1} onClick={() => select(cur + 1)}>
                <ChevronDown size={20} strokeWidth={2} />
              </NavButton>
            </nav>
          </div>
          <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-[11.5px] text-muted/80 [@media(min-height:760px)]:flex">
            Scroll, drag or press
            <kbd className="border border-line px-1.5 py-px text-[10px]">↑</kbd>
            <kbd className="border border-line px-1.5 py-px text-[10px]">↓</kbd>
            to switch reels. Click the video to pause,
            <kbd className="border border-line px-1.5 py-px text-[10px]">M</kbd>
            to mute.
          </p>
        </div>
        {/* Below the player on narrower desktops */}
        <div className="border-t border-line px-8 py-8 xl:hidden">
          <div className="mx-auto max-w-[560px]">
            <Details spool={spool} reel={reel} onUnlock={() => setPaywall(true)} onRetry={() => onRetry?.(spool)} />
          </div>
        </div>
      </div>

      {/* Right: details for the active reel (wide desktops) */}
      <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-line p-5 xl:block">
        <Details spool={spool} reel={reel} onUnlock={() => setPaywall(true)} onRetry={() => onRetry?.(spool)} />
        {spool && reel && viewer?.signedIn && !spool.demo && !reel.locked && reel.status === "ready" && (
          <SharedLinks key={`${reel.id}-${shareRev}`} reelId={reel.id} onShare={() => setShareOpen(true)} />
        )}
      </aside>

      {spool && (
        <UnlockSheet open={paywall} onClose={closePaywall} spool={spool} viewer={viewer} reel={reel?.locked ? reel.index : firstLocked} />
      )}
      {spool && reel && (
        <ShareSheet
          open={shareOpen}
          onClose={() => {
            setShareOpen(false);
            setShareRev((n) => n + 1);
          }}
          spool={spool}
          reel={reel}
          viewer={viewer}
        />
      )}
      {spool && <SpoolMoreSheet spool={spool} open={moreOpen} onClose={() => setMoreOpen(false)} onDeleted={onDeleted} />}
    </div>
  );
}
