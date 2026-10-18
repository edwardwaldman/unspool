"use client";

import { motion } from "motion/react";
import type { SpoolDTO } from "@/lib/spool-types";
import type { UploadState } from "../upload/upload-store";
import { reelAccent, reelVars } from "./accent";
import { ParticleField } from "./particle-field";

const STAGES = ["Upload", "Read", "Plan", "Write"] as const;

/** Where generation is: 0 upload, 1 read, 2 plan, 3 write reels, 4 done. */
export function stageIndex(spool: SpoolDTO | null, upload: UploadState | null) {
  if (!spool || spool.status === "uploading") return upload?.phase === "starting" ? 1 : 0;
  switch (spool.status) {
    case "uploaded":
    case "extracting":
      return 1;
    case "planning":
      return 2;
    case "ready":
      return 4;
    default:
      return 3;
  }
}

/** One plain line saying what's happening right now, from the real pipeline status. */
export function stageLine(spool: SpoolDTO | null, upload: UploadState | null) {
  const stage = stageIndex(spool, upload);
  const reels = spool?.reels ?? [];
  const ready = reels.filter((r) => r.status === "ready").length;
  const total = spool?.totalReels || reels.length;
  const n = (v: number | null | undefined, unit: string) => (v ? `${v.toLocaleString("en-US")} ${unit}` : null);
  if (stage === 0) return upload?.phase === "creating" ? "Preparing your upload" : "Uploading your file";
  if (stage === 1) return "Reading your document";
  if (stage === 2) {
    const size = n(spool?.pageCount, spool?.pageCount === 1 ? "page" : "pages") ?? n(spool?.wordCount, "words");
    return size ? `Planning your reels from ${size}` : "Planning your reels";
  }
  if (stage === 3) {
    const writing = reels.find((r) => r.status === "generating");
    return writing ? `Writing reel ${writing.index} · ${ready}/${total} ready` : `Writing reels · ${ready}/${total} ready`;
  }
  return "All reels written";
}

/** The reel shown in the feed while generation runs: real pipeline stage + the status of each planned reel. */
export function LoadingReel({
  spool,
  upload,
  reelIndex = 1,
  failed,
  onRetry,
  bottomInset,
}: {
  spool: SpoolDTO | null;
  upload: UploadState | null;
  reelIndex?: number;
  failed?: boolean;
  onRetry?: () => void;
  bottomInset: number;
}) {
  const reels = spool?.reels ?? [];
  const isError = failed || spool?.status === "failed" || upload?.phase === "error";
  const errorText = upload?.error ?? spool?.error ?? "Something went wrong.";
  const name = spool?.title ?? spool?.fileName ?? upload?.fileName ?? "Your document";
  const stage = stageIndex(spool, upload);
  const ready = reels.filter((r) => r.status === "ready").length;
  const line = stageLine(spool, upload);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden px-6 text-white" style={{ ...reelVars(reelIndex), paddingBottom: bottomInset + 28 }}>
      <ParticleField active pulse={stage} />

      <div className="relative z-10 pt-[64px]">
        <div className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{name}</div>
        <h2 className="mt-4 font-display text-[32px] leading-[1.02]">
          {isError ? "That didn't work." : reels.length && reelIndex > 1 ? `Writing reel ${reelIndex}.` : "Unspooling your doc."}
        </h2>
        <p className="mt-2 text-[14.5px] text-muted">
          {isError
            ? errorText
            : `${stage < 3 ? "Usually under a minute. " : ""}Reel ${reelIndex} plays here the moment it's ready.`}
        </p>
        {isError && onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-5 bg-white px-5 py-2.5 text-[15px] font-semibold text-[#08110e]"
          >
            Retry
          </button>
        )}
      </div>

      {!isError && (
        <div className="relative z-10 mt-9 grid grid-cols-4 gap-1.5">
          {STAGES.map((s, i) => (
            <div key={s}>
              <div className="h-[3px] overflow-hidden bg-white/15">
                <div
                  className={`h-full ${i === stage ? "animate-pulse" : ""}`}
                  style={{ width: i <= stage ? "100%" : "0%", background: i < stage ? "#fff" : "var(--thread)" }}
                />
              </div>
              <div className="mt-2 text-[13px] font-medium" style={{ color: i === stage ? "var(--thread)" : i < stage ? "#fff" : "rgba(255,255,255,.5)" }}>
                {s}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isError && (
        <div className="relative z-10 mt-4 flex items-center gap-2.5 font-mono text-[12px] text-ink/85" aria-live="polite">
          <span className="h-2 w-2 shrink-0 animate-pulse bg-thread" />
          {line}
        </div>
      )}

      <div className="relative z-10 mt-auto">
        {reels.length > 0 ? (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="label">Your {reels.length} reels</span>
              <span className="font-mono text-[11px] text-muted">
                {ready}/{reels.length} ready
              </span>
            </div>
            <div className="mb-4 flex gap-1">
              {reels.map((r) => (
                <div
                  key={r.id}
                  className="h-1 flex-1"
                  style={{
                    background:
                      r.status === "ready" ? "var(--thread)" : r.status === "generating" ? "color-mix(in srgb, var(--thread) 40%, transparent)" : "var(--border)",
                  }}
                />
              ))}
            </div>
            <div className="space-y-1">
              {reels.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 border-b border-white/[0.08] px-0.5 py-1.5 text-[13px]"
                >
                  <span className="h-[18px] w-[10px] shrink-0" style={{ background: reelAccent(r.index), opacity: r.status === "ready" ? 1 : 0.4 }} aria-hidden />
                  <span className={`truncate ${r.index === reelIndex ? "text-thread" : "text-white/85"}`}>{r.title}</span>
                  <span className="ml-auto text-[11px] font-medium text-white/60">
                    {r.status === "ready" ? "ready" : r.status === "generating" ? "writing" : r.locked ? "locked" : r.status === "failed" ? "failed" : "queued"}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          !isError && (
            <div className="space-y-2.5">
              <div className="shimmer h-3 w-[70%]" />
              <div className="shimmer h-3 w-[55%]" />
              <div className="shimmer h-3 w-[62%]" />
            </div>
          )
        )}
      </div>
    </div>
  );
}
