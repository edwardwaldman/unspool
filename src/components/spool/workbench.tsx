"use client";

import { Lightbulb, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice, MAX_REELS, PRICING } from "@/lib/config";
import { stripMarkup } from "@/lib/markup";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { estimateDuration } from "@/lib/timing";
import { fileLabel, fileTone, reelAccent, reelTint } from "../reel/accent";
import { ReelSlot, SpoolMoreSheet, type FeedItem } from "../reel/feed";
import { stageIndex, stageLine } from "../reel/loading-reel";
import { UnlockSheet } from "../reel/drip-gate";
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-line py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted hover:bg-white/[0.03] disabled:opacity-50"
      >
        <UploadIcon size={15} /> {pending ? "Starting upload" : "New upload"}
      </button>
    </>
  );
}

function FileBadge({ ext, size = 44 }: { ext: string; size?: number }) {
  const tone = fileTone(ext);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[12px] font-mono text-[10.5px] font-bold"
      style={{ width: size, height: size, color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)` }}
      aria-hidden
    >
      {fileLabel(ext)}
    </div>
  );
}

const PILL_TONE: Record<ReelState, string> = {
  ready: "var(--sage)",
  generating: "var(--thread)",
  queued: "var(--muted)",
  failed: "var(--coral)",
  locked: "var(--muted)",
};

/** READY / WRITING / LOCKED (+ drip timer) pill. */
function StatePill({ state, until }: { state: ReelState; until?: string | null }) {
  const left = useCountdown(until ?? null);
  const tone = PILL_TONE[state];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: tone, background: `color-mix(in srgb, ${tone} 13%, transparent)` }}
    >
      {state === "locked" && <LockIcon size={10} strokeWidth={2.25} />}
      {state === "generating" && <Loader2 size={10} strokeWidth={2.5} className="animate-spin" />}
      {STATE_LABEL[state]}
      {state === "locked" && left > 0 && <span className="font-mono normal-case tracking-normal text-thread">· {formatCountdown(left)}</span>}
    </span>
  );
}

/** A mini 9:16 frame for the reel list: the reel's tint with its hook burned in, blurred when locked. */
function ReelThumb({ reel, state, on }: { reel: ReelDTO; state: ReelState; on: boolean }) {
  const accent = reelAccent(reel.index);
  const [first, ...rest] = plain(reel.hook).split(" ");
  return (
    <span
      className="relative block h-[78px] w-[44px] shrink-0 overflow-hidden rounded-[8px]"
      style={{ background: reelTint(accent, state === "ready" ? 26 : 14), boxShadow: on ? `0 0 0 2px var(--paper), 0 0 0 3.5px ${accent}` : "inset 0 0 0 1px rgba(255,255,255,.08)" }}
      aria-hidden
    >
      <span className={`absolute inset-x-[4px] top-[8px] line-clamp-5 font-hook text-[6.5px] font-extrabold leading-[1.25] text-white ${state === "locked" ? "blur-[1.5px] opacity-60" : ""}`}>
        <span className="rounded-[2px] px-[1px] text-[#08110e]" style={{ background: accent }}>
          {first}
        </span>{" "}
        {rest.join(" ")}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      {state === "locked" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white">
            <LockIcon size={10} strokeWidth={2.25} />
          </span>
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
            <span key={k} className="w-[2px] animate-pulse rounded-full bg-white" style={{ height: `${[9, 5, 7][k]}px`, animationDelay: `${k * 0.2}s` }} />
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
    <section className="rounded-[16px] border border-line">
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
              className="flex w-full items-center gap-3 rounded-[12px] border border-line px-3 py-2.5 text-left text-[13.5px] transition-colors enabled:hover:border-muted enabled:hover:bg-white/[0.03]"
              style={color ? { borderColor: color, color, background: `color-mix(in srgb, ${color} 10%, transparent)` } : undefined}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-bold"
                style={{ background: color ?? "rgba(255,255,255,.07)", color: color ? "var(--paper)" : "var(--muted)" }}
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
          <span className="w-9 shrink-0 pt-[2px] font-mono text-[11px] text-muted">{clock(r.start)}</span>
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
      This reel turns free in <span className="font-mono text-ink">{formatCountdown(left)}</span>
    </p>
  );
}

/** Live countdown to the next free reel. */
function NextFreeTimer({ until }: { until: string }) {
  const left = useCountdown(until);
  if (!left) return null;
  return (
    <span className="shrink-0 font-mono text-[14px] font-semibold text-thread" title="Next free reel">
      {formatCountdown(left)}
    </span>
  );
}

function UnlockCta({ spool, onUnlock }: { spool: SpoolDTO; onUnlock: () => void }) {
  const locked = spool.reels.filter((r) => r.locked).length;
  if (!locked) return null;
  return (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-thread text-paper">
          <LockIcon size={16} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold text-ink">
            {locked} {locked === 1 ? "reel" : "reels"} locked
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
            {spool.nextFreeUnlockAt ? "One more turns free every hour, or skip the wait." : "Unlock the rest of this document to keep going."}
          </p>
        </div>
      </div>
      {spool.nextFreeUnlockAt && (
        <p className="mt-3 flex items-center justify-between rounded-[10px] bg-white/[0.04] px-3 py-2 text-[12.5px]">
          <span className="text-muted">Next free reel in</span>
          <NextFreeTimer until={spool.nextFreeUnlockAt} />
        </p>
      )}
      <button
        type="button"
        onClick={onUnlock}
        className="mt-3 flex w-full items-center justify-between rounded-[12px] bg-thread px-4 py-3 text-[14px] font-semibold text-paper transition-opacity hover:opacity-90"
      >
        <span>Unlock all reels</span>
        <span className="font-mono text-[12.5px]">{formatPrice(PRICING.documentCents)}</span>
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
          <div className="shimmer h-3 w-[80%] rounded-full" />
          <div className="shimmer h-3 w-[64%] rounded-full" />
          <div className="shimmer h-3 w-[72%] rounded-full" />
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
          <StatePill state={state} />
        </div>
        <h2 className="mt-3 font-display text-[24px] leading-[1.1]">{reel.title}</h2>
        <div className="mt-1.5 text-[12.5px] text-muted">
          Part {reel.index} of {spool.reels.length}
          {script ? ` · ${script.beats.length} beats + quick check` : ""}
        </div>
        <p className="mt-3 text-[14.5px] leading-snug text-ink/80">{plain(reel.hook)}</p>
      </div>

      {script ? (
        <>
          <div className="rounded-[16px] p-4" style={{ background: "color-mix(in srgb, var(--thread) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--thread) 28%, transparent)" }}>
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-thread">
              <Lightbulb size={14} strokeWidth={2} /> Key point
            </div>
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
        <div className="rounded-[16px] border border-line p-4">
          <p className="text-[14px] text-coral">{reel.error ?? "This reel didn't come out right."}</p>
          <button type="button" onClick={onRetry} className="mt-3 rounded-[12px] bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper">
            Retry
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[14px] leading-snug text-muted">{state === "generating" ? "Writing this reel now." : "Queued."} It plays here the moment it&apos;s ready.</p>
          <div className="mt-4 space-y-2.5">
            <div className="shimmer h-3 w-[78%] rounded-full" />
            <div className="shimmer h-3 w-[60%] rounded-full" />
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
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-ink transition-colors hover:bg-white/[0.14] disabled:opacity-25 disabled:hover:bg-white/[0.07]"
    >
      {children}
    </button>
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
  const lastWheel = useRef(0);

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
  const accent = reelAccent(reel?.index ?? 1);

  const select = useCallback(
    (i: number, opts: { paywall?: boolean } = {}) => {
      if (i < 0 || i >= items.length) return;
      setIndex(i);
      onIndexChange?.(i);
      if (opts.paywall && items[i]?.reel?.locked) setPaywall(true);
    },
    [items, onIndexChange],
  );

  // Arrow keys / j k step through the reels.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paywall || moreOpen) return;
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
  }, [cur, select, paywall, moreOpen]);

  // Scrolling over the player steps one reel at a time, like the feed.
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 30 || Date.now() - lastWheel.current < 700) return;
    lastWheel.current = Date.now();
    select(cur + (e.deltaY > 0 ? 1 : -1));
  };

  const firstLocked = reels.find((r) => r.locked)?.index ?? 2;
  const closePaywall = useCallback(() => setPaywall(false), []);
  const listed = reels.length ? reels : null;
  const totalReels = reels.length || spool?.totalReels || 0;

  return (
    <div className="flex h-full w-full min-h-0">
      {/* Left: the document and its reels */}
      <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-r border-line">
        <div className="p-4">
          <div className="rounded-[18px] border border-line bg-surface p-4">
            <div className="flex gap-3">
              <FileBadge ext={ext} />
              <div className="min-w-0">
                <div className="line-clamp-2 font-display text-[17px] leading-[1.15]">{spool?.title ?? spool?.fileName ?? upload?.fileName ?? "Your document"}</div>
                {spool?.title && <div className="mt-1 truncate text-[12px] text-muted">{spool.fileName}</div>}
              </div>
            </div>
            {(spool?.pageCount || spool?.wordCount) && (
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11.5px] text-muted">
                {spool?.pageCount ? <span className="rounded-full bg-white/[0.05] px-2 py-0.5">{spool.pageCount} pages</span> : null}
                {spool?.wordCount ? <span className="rounded-full bg-white/[0.05] px-2 py-0.5">{spool.wordCount.toLocaleString("en-US")} words</span> : null}
                {spool?.truncated ? <span className="rounded-full bg-white/[0.05] px-2 py-0.5">trimmed</span> : null}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2 text-ink">
                <span className="h-2 w-2 rounded-full" style={{ background: status.tone }} />
                {status.label}
              </span>
              {totalReels > 0 && stageIndex(spool, upload ?? null) >= 4 && (
                <span className="font-mono text-[11px] text-muted">
                  {ready}/{totalReels} reels
                </span>
              )}
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-valuenow={ready} aria-valuemax={totalReels || 1} aria-label="Reels ready">
              <div className="h-full rounded-full bg-thread transition-[width] duration-500" style={{ width: `${totalReels ? (ready / totalReels) * 100 : 4}%` }} />
              {writing > 0 && totalReels > 0 && (
                <div className="h-full animate-pulse" style={{ width: `${(writing / totalReels) * 100}%`, background: "color-mix(in srgb, var(--thread) 40%, transparent)" }} />
              )}
            </div>
            {(stageIndex(spool, upload ?? null) < 4 || upload?.phase === "error") && (
              <p className="mt-2 text-[12px] text-muted" aria-live="polite">
                {upload?.phase === "error" ? upload.error : spool?.status === "failed" ? spool.error : stageLine(spool, upload ?? null)}
              </p>
            )}
          </div>
          <NewUploadButton />
        </div>

        <div className="flex items-baseline justify-between px-5 pb-2 pt-2">
          <span className="text-[13px] font-semibold text-ink">Reels</span>
          {listed && <span className="text-[12px] text-muted">{lockedCount ? `${spool?.freeReels ?? 1} free · ${lockedCount} locked` : "All unlocked"}</span>}
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
                      className={`flex w-full items-center gap-3 rounded-[14px] p-2 text-left transition-colors ${on ? "bg-surface" : "hover:bg-white/[0.03]"}`}
                    >
                      <ReelThumb reel={r} state={state} on={on} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted">Part {r.index}</span>
                          <StatePill state={state} until={nextDrip} />
                        </span>
                        <span className={`mt-0.5 block truncate text-[13.5px] font-semibold ${state === "locked" ? "text-ink/70" : "text-ink"}`}>{r.title}</span>
                        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted">{plain(r.hook)}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            : Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 p-2">
                  <span className="h-[78px] w-[44px] shrink-0 rounded-[8px] bg-white/[0.05]" />
                  <span className="flex-1 space-y-1.5">
                    <span className="shimmer block h-2.5 rounded-full" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                    <span className="shimmer block h-2 w-[40%] rounded-full" />
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
        <div className="relative flex min-h-[calc(100dvh-64px)] flex-1 items-center justify-center overflow-hidden px-6 py-6" onWheel={onWheel}>
          {/* Ambient light from the playing reel */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-[110px] transition-colors duration-700"
            style={{ background: accent }}
          />
          <div className="relative flex items-center gap-4 pl-14">
            <div
              className="relative aspect-[9/16] h-[calc(100dvh-112px)] max-h-[920px] min-h-[520px] shrink-0 overflow-hidden rounded-[20px] bg-black"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,.08), 0 30px 80px rgba(0,0,0,.45)" }}
            >
              {item && (
                <ReelSlot
                  key={item.key}
                  item={item}
                  upload={cur === 0 ? upload ?? null : null}
                  active={!paywall && !moreOpen}
                  total={reels.length || MAX_REELS}
                  bottomInset={0}
                  onRetry={() => onRetry?.(item.spool)}
                  onUnlock={() => setPaywall(true)}
                  onMore={() => setMoreOpen(true)}
                  onEnded={() => {
                    if (cur + 1 < items.length) setTimeout(() => select(cur + 1, { paywall: true }), 900);
                  }}
                />
              )}
            </div>
            <nav className="flex w-10 flex-col items-center gap-2.5" aria-label="Switch reel">
              <NavButton label="Previous reel (↑)" disabled={cur === 0} onClick={() => select(cur - 1)}>
                <ChevronUp size={20} strokeWidth={2} />
              </NavButton>
              <span className="py-1 font-mono text-[11px] tabular-nums text-muted">
                {cur + 1}/{items.length}
              </span>
              <NavButton label="Next reel (↓)" disabled={cur >= items.length - 1} onClick={() => select(cur + 1)}>
                <ChevronDown size={20} strokeWidth={2} />
              </NavButton>
            </nav>
          </div>
          <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-[11.5px] text-muted/80 [@media(min-height:760px)]:flex">
            Scroll or press
            <kbd className="rounded-[5px] border border-line px-1.5 py-px font-mono text-[10px]">↑</kbd>
            <kbd className="rounded-[5px] border border-line px-1.5 py-px font-mono text-[10px]">↓</kbd>
            to switch reels · click the video to pause
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
      </aside>

      {spool && (
        <UnlockSheet open={paywall} onClose={closePaywall} spool={spool} viewer={viewer} reel={reel?.locked ? reel.index : firstLocked} />
      )}
      {spool && <SpoolMoreSheet spool={spool} open={moreOpen} onClose={() => setMoreOpen(false)} onDeleted={onDeleted} />}
    </div>
  );
}
