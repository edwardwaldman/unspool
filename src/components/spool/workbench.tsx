"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice, PRICING } from "@/lib/config";
import type { ReelDTO, SpoolDTO, ViewerDTO } from "@/lib/spool-types";
import { fileLabel } from "../reel/accent";
import { ReelSlot, SpoolMoreSheet, type FeedItem } from "../reel/feed";
import { stageIndex, stageLine } from "../reel/loading-reel";
import { PaywallSheet } from "../reel/paywall-sheet";
import { ChevronDown, ChevronUp, LockIcon, UploadIcon } from "../ui/icons";
import { MarkedText } from "../ui/marked-text";
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
      <button type="button" onClick={() => input.current?.click()} disabled={Boolean(pending)} className="btn-secondary mt-5 w-full py-2.5 text-[14px]">
        <UploadIcon size={16} /> {pending ? "Starting upload" : "New upload"}
      </button>
    </>
  );
}

function StateMark({ state, index, active }: { state: ReelState; index: number; active: boolean }) {
  if (state === "locked") return <LockIcon size={14} className="text-muted" />;
  if (state === "generating") return <Loader2 size={14} strokeWidth={1.75} className="animate-spin text-thread" />;
  return (
    <span className="font-mono text-[11px]" style={{ color: state === "failed" ? "var(--coral)" : state === "ready" ? (active ? "var(--thread)" : "var(--ink)") : "var(--muted)" }}>
      {String(index).padStart(2, "0")}
    </span>
  );
}

/** Quiz card for the details panel: pick an answer, see why. */
function QuizCard({ quiz }: { quiz: NonNullable<ReelDTO["script"]>["quiz"] }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="border border-line bg-paper p-4">
      <div className="label">Quick check</div>
      <p className="mt-2 text-[14.5px] leading-snug text-ink">{plain(quiz.question)}</p>
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
              className="flex w-full items-center gap-3 border border-line px-3 py-2 text-left text-[13.5px] hover:border-muted disabled:hover:border-line"
              style={color ? { borderColor: color, color } : undefined}
            >
              <span className="font-mono text-[10.5px] text-muted">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="mt-3 text-[13.5px] leading-snug text-ink/85">
          <span style={{ color: picked === quiz.answer ? "var(--sage)" : "var(--coral)" }}>{picked === quiz.answer ? "Correct. " : "Not quite. "}</span>
          <MarkedText text={quiz.explain} />
        </p>
      )}
    </div>
  );
}

function UnlockCta({ spool, onUnlock, compact = false }: { spool: SpoolDTO; onUnlock: () => void; compact?: boolean }) {
  const locked = spool.reels.filter((r) => r.locked).length;
  if (!locked) return null;
  return (
    <div className={compact ? "" : "border border-line border-t-2 border-t-thread bg-paper p-4"}>
      {!compact && (
        <>
          <div className="label flex items-center gap-2">
            <LockIcon size={12} /> {locked} reels locked
          </div>
          <p className="mt-2 text-[13.5px] leading-snug text-muted">Reel 1 is free. Unlock the rest of this document to keep going.</p>
        </>
      )}
      <button type="button" onClick={onUnlock} className={`btn-primary w-full justify-between px-4 py-3 text-[14.5px] ${compact ? "" : "mt-4"}`}>
        <span>Unlock all 10 reels</span>
        <span className="font-mono text-[12.5px]">{formatPrice(PRICING.documentCents)}</span>
      </button>
    </div>
  );
}

/** Right-hand panel: what the active reel covers, its script, its quiz, or the unlock pitch. */
function Details({ spool, reel, onUnlock, onRetry }: { spool: SpoolDTO | null; reel: ReelDTO | null; onUnlock: () => void; onRetry: () => void }) {
  if (!spool || !reel) {
    return (
      <div>
        <div className="label">Up next</div>
        <p className="mt-2 text-[14px] leading-snug text-muted">Your 10 reel titles appear here as soon as the plan is ready. Reel 1 starts playing on its own.</p>
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
    <div className="space-y-6">
      <div>
        <div className="label flex items-center justify-between">
          <span>
            Reel {reel.index} of {spool.reels.length || 10}
          </span>
          <span className="flex items-center gap-1.5" style={{ color: state === "ready" ? "var(--sage)" : state === "failed" ? "var(--coral)" : undefined }}>
            {state === "locked" && <LockIcon size={11} />}
            {STATE_LABEL[state]}
          </span>
        </div>
        <h2 className="mt-3 font-hook text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.02em]">{reel.title}</h2>
        <p className="mt-2 text-[14.5px] leading-snug text-ink/80">{plain(reel.hook)}</p>
      </div>

      {script ? (
        <>
          <div>
            <div className="label">Key point</div>
            <p className="mt-2 text-[14.5px] leading-snug text-ink">
              <MarkedText text={script.summary} />
            </p>
          </div>
          <div>
            <div className="label">Script</div>
            <ol className="mt-2 border-t border-line">
              {script.beats.map((b, i) => (
                <li key={i} className="flex gap-3 border-b border-line py-2 text-[13px] leading-snug text-ink/85">
                  <span className="w-4 shrink-0 font-mono text-[10.5px] leading-[18px] text-muted">{i + 1}</span>
                  <span>
                    <MarkedText text={b.say} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <QuizCard key={reel.id} quiz={script.quiz} />
        </>
      ) : state === "locked" ? (
        <UnlockCta spool={spool} onUnlock={onUnlock} />
      ) : state === "failed" ? (
        <div>
          <p className="text-[14px] text-coral">{reel.error ?? "This reel didn't come out right."}</p>
          <button type="button" onClick={onRetry} className="btn-primary mt-3 px-5 py-2.5 text-[14px]">
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

/**
 * Desktop document view: the document and its 10 reels on the left, the active reel playing big in
 * the middle, and what that reel covers (script, quiz, unlock) on the right. Same reels and player
 * as the mobile feed; this is just a wider frame around them.
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
  const status = docStatus(spool, upload ?? null);

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
  const listed = reels.length ? reels : null;

  return (
    <div className="flex h-full w-full min-h-0">
      {/* Left: the document and its reels */}
      <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-line">
        <div className="border-b border-line p-5">
          <div className="label">Document</div>
          <div className="mt-3 flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-surface font-mono text-[10px] text-muted" aria-hidden>
              {fileLabel(spool?.fileType ?? upload?.fileName?.split(".").pop() ?? "")}
            </div>
            <div className="min-w-0">
              <div className="line-clamp-2 font-display text-[19px] leading-tight">{spool?.title ?? spool?.fileName ?? upload?.fileName ?? "Your document"}</div>
              {spool?.title && <div className="mt-1 truncate text-[12.5px] text-muted">{spool.fileName}</div>}
            </div>
          </div>
          {(spool?.pageCount || spool?.wordCount) && (
            <div className="mt-3 flex gap-3 font-mono text-[11px] text-muted">
              {spool?.pageCount ? <span>{spool.pageCount} pages</span> : null}
              {spool?.wordCount ? <span>{spool.wordCount.toLocaleString("en-US")} words</span> : null}
              {spool?.truncated ? <span>trimmed</span> : null}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: status.tone }} />
              {status.label}
            </span>
            <span className="font-mono text-[11px] text-muted">{ready}/10 ready</span>
          </div>
          <div className="mt-2 grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => {
              const r = reels[i];
              return (
                <div
                  key={i}
                  className="h-1"
                  style={{
                    background: r?.status === "ready" ? "var(--thread)" : r?.status === "generating" ? "color-mix(in srgb, var(--thread) 40%, transparent)" : "var(--border)",
                  }}
                />
              );
            })}
          </div>
          {(stageIndex(spool, upload ?? null) < 4 || upload?.phase === "error") && (
            <p className="mt-2 font-mono text-[11px] text-muted" aria-live="polite">
              {upload?.phase === "error" ? upload.error : spool?.status === "failed" ? spool.error : stageLine(spool, upload ?? null)}
            </p>
          )}
          <NewUploadButton />
        </div>

        <div className="flex items-baseline justify-between px-5 pb-2 pt-5">
          <span className="label">Reels</span>
          {listed && <span className="font-mono text-[11px] text-muted">{lockedCount ? `1 free · ${lockedCount} locked` : "all unlocked"}</span>}
        </div>
        <ol className="border-t border-line" aria-label="Reels">
          {listed
            ? listed.map((r, i) => {
                const state = reelState(r);
                const on = i === cur;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => select(i, { paywall: true })}
                      aria-current={on ? "true" : undefined}
                      className={`flex w-full items-center gap-3 border-b border-l-2 border-b-line px-5 py-2.5 text-left transition-colors ${
                        on ? "border-l-thread bg-surface" : "border-l-transparent hover:bg-surface/60"
                      }`}
                    >
                      <span className={`flex h-11 w-[25px] shrink-0 items-center justify-center border bg-paper ${on ? "border-thread" : "border-line"}`} aria-hidden>
                        <StateMark state={state} index={r.index} active={on} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13.5px] ${on ? "text-thread" : state === "locked" ? "text-ink/70" : "text-ink"}`}>{r.title}</span>
                        <span className="block truncate text-[12px] text-muted">{plain(r.hook)}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted">{STATE_LABEL[state]}</span>
                    </button>
                  </li>
                );
              })
            : Array.from({ length: 10 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 border-b border-line px-5 py-2.5">
                  <span className="flex h-11 w-[25px] shrink-0 items-center justify-center border border-line font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 space-y-1.5">
                    <span className="shimmer block h-2.5" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
                    <span className="shimmer block h-2 w-[40%]" />
                  </span>
                </li>
              ))}
        </ol>
        {spool && lockedCount > 0 && (
          <div className="sticky bottom-0 mt-auto border-t border-line bg-paper p-5">
            <UnlockCta spool={spool} onUnlock={() => setPaywall(true)} compact />
            <p className="mt-2 text-center text-[11.5px] text-muted">One-time payment for this document.</p>
          </div>
        )}
      </aside>

      {/* Center: the player */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto xl:overflow-hidden">
        <div className="flex min-h-[calc(100dvh-64px)] flex-1 items-center justify-center gap-5 px-6 py-5" onWheel={onWheel}>
          <div className="relative aspect-[9/16] h-[calc(100dvh-104px)] min-h-[520px] shrink-0 overflow-hidden border border-line">
            {item && (
              <ReelSlot
                key={item.key}
                item={item}
                upload={cur === 0 ? upload ?? null : null}
                active={!paywall && !moreOpen}
                total={reels.length || 10}
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
          <div className="flex flex-col gap-4">
            <button
              type="button"
              aria-label="Previous reel"
              disabled={cur === 0}
              onClick={() => select(cur - 1)}
              className="flex h-11 w-11 items-center justify-center border border-line text-ink hover:border-muted disabled:opacity-30"
            >
              <ChevronUp size={24} />
            </button>
            <button
              type="button"
              aria-label="Next reel"
              disabled={cur >= items.length - 1}
              onClick={() => select(cur + 1)}
              className="flex h-11 w-11 items-center justify-center border border-line text-ink hover:border-muted disabled:opacity-30"
            >
              <ChevronDown size={24} />
            </button>
          </div>
        </div>
        {/* Below the player on narrower desktops */}
        <div className="border-t border-line px-8 py-8 xl:hidden">
          <div className="mx-auto max-w-[560px]">
            <Details spool={spool} reel={reel} onUnlock={() => setPaywall(true)} onRetry={() => onRetry?.(spool)} />
          </div>
        </div>
      </div>

      {/* Right: details for the active reel (wide desktops) */}
      <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-l border-line p-6 xl:block">
        <Details spool={spool} reel={reel} onUnlock={() => setPaywall(true)} onRetry={() => onRetry?.(spool)} />
      </aside>

      {spool && (
        <PaywallSheet open={paywall} onClose={() => setPaywall(false)} spool={spool} viewer={viewer} reel={reel?.locked ? reel.index : firstLocked} />
      )}
      {spool && <SpoolMoreSheet spool={spool} open={moreOpen} onClose={() => setMoreOpen(false)} onDeleted={onDeleted} />}
    </div>
  );
}
