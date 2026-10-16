"use client";

import { motion } from "motion/react";
import type { SpoolDTO } from "@/lib/spool-types";
import type { UploadState } from "../upload/upload-store";
import { ParticleField } from "./particle-field";

const STAGES = ["Upload", "Read", "Plan", "Write"] as const;

function stageIndex(spool: SpoolDTO | null, upload: UploadState | null) {
  if (!spool || spool.status === "uploading") return upload?.phase === "starting" ? 1 : 0;
  switch (spool.status) {
    case "uploaded":
    case "extracting":
      return 1;
    case "planning":
      return 2;
    default:
      return 3;
  }
}

/** The reel shown in the feed while generation runs: real pipeline stage + the status of each of the 10 reels. */
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

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-ink px-6" style={{ paddingBottom: bottomInset + 28 }}>
      <ParticleField active pulse={stage} />

      <div className="relative z-10 pt-[64px]">
        <div className="label">{name}</div>
        <h2 className="mt-3 font-display text-[40px] leading-[1.02] tracking-[-0.01em]">
          {isError ? "That didn't work." : reels.length && reelIndex > 1 ? `Writing reel ${reelIndex}.` : "Unspooling your doc."}
        </h2>
        <p className="mt-2 text-[14.5px] text-muted">
          {isError ? errorText : stage < 3 ? "Usually under a minute. Reel 1 plays here when it's ready." : "Reel 1 plays here when it's ready."}
        </p>
        {isError && onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="btn-primary mt-5 px-5 py-2.5 text-[15px]"
          >
            Retry
          </button>
        )}
      </div>

      {!isError && (
        <div className="relative z-10 mt-9 grid grid-cols-4 border-t border-line">
          {STAGES.map((s, i) => (
            <div key={s} className="pt-3">
              <div className="mb-2 h-px" style={{ background: i < stage ? "var(--cream)" : i === stage ? "var(--thread)" : "transparent" }} />
              <div className="font-mono text-[10.5px] text-muted">0{i + 1}</div>
              <div className="text-[13px]" style={{ color: i === stage ? "var(--thread)" : i < stage ? "var(--cream)" : "var(--muted)" }}>
                {s}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 mt-auto">
        {reels.length > 0 ? (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="label">Your 10 reels</span>
              <span className="font-mono text-[11px] text-muted">{ready}/10 ready</span>
            </div>
            <div className="mb-4 grid grid-cols-10 gap-1">
              {reels.map((r) => (
                <div
                  key={r.id}
                  className="h-1"
                  style={{
                    background:
                      r.status === "ready" ? "var(--thread)" : r.status === "generating" ? "color-mix(in srgb, var(--thread) 40%, transparent)" : "var(--border)",
                  }}
                />
              ))}
            </div>
            <div className="border-t border-line">
              {reels.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 border-b border-line py-1.5 text-[13px]"
                >
                  <span className="w-5 font-mono text-[10.5px] text-muted">{String(r.index).padStart(2, "0")}</span>
                  <span className={`truncate ${r.index === reelIndex ? "text-thread" : "text-cream/85"}`}>{r.title}</span>
                  <span className="ml-auto font-mono text-[10.5px] text-muted">
                    {r.status === "ready" ? "ready" : r.locked ? "locked" : r.status === "generating" ? "writing" : ""}
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
