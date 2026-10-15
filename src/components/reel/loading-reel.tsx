"use client";

import { motion } from "motion/react";
import type { SpoolDTO } from "@/lib/spool-types";
import type { UploadState } from "../upload/upload-store";
import { ParticleField } from "./particle-field";

function stageText(spool: SpoolDTO | null, upload: UploadState | null, reelIndex: number) {
  if (upload?.phase === "error") return upload.error ?? "Upload failed.";
  if (!spool || spool.status === "uploading") return upload?.phase === "starting" ? "Starting…" : "Uploading your doc…";
  switch (spool.status) {
    case "uploaded":
    case "extracting":
      return "Reading your doc…";
    case "planning":
      return "Planning 10 reels…";
    case "failed":
      return spool.error ?? "Something went wrong.";
    default:
      return `Writing reel ${reelIndex}…`;
  }
}

/** The skeleton reel shown in the feed while a reel is being generated. */
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
  const titles = spool?.reels ?? [];
  const isError = failed || spool?.status === "failed" || upload?.phase === "error";
  const name = spool?.title ?? spool?.fileName ?? upload?.fileName ?? "your doc";
  return (
    <div className="reel-bg relative flex h-full w-full flex-col overflow-hidden px-6" style={{ paddingBottom: bottomInset + 24 }}>
      <ParticleField accent="#4d9fff" active pulse={titles.length} />
      <div className="relative z-10 pt-[64px]">
        <div className="shimmer h-7 w-[85%] rounded-lg" />
        <div className="shimmer mt-2.5 h-7 w-[62%] rounded-lg" />
        <div className="shimmer mt-4 h-3.5 w-[45%] rounded" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        {!isError && (
          <div className="relative mb-7 h-24 w-24">
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-accent/25 border-t-accent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              style={{ boxShadow: "0 0 30px rgba(77,159,255,0.35)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[34px]">🧵</div>
          </div>
        )}
        <div className="text-[24px] font-black tracking-tight">{isError ? "Hmm, that didn't work" : "Unspooling your doc…"}</div>
        <div className={`mt-2 text-[15px] ${isError ? "text-warn" : "text-muted"}`}>{stageText(spool, upload, reelIndex)}</div>
        <div className="mt-1 max-w-[280px] truncate text-[13px] text-muted/80">{name}</div>
        {isError && onRetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="mt-5 rounded-full bg-white px-5 py-2.5 text-[15px] font-bold text-[#0b1020]"
          >
            Retry
          </button>
        )}
      </div>

      {titles.length > 0 && (
        <div className="relative z-10 mx-auto w-full max-w-[340px] space-y-1.5">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Your 10 reels</div>
          {titles.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 text-[13.5px]"
            >
              <span className="w-5 font-mono text-[11px] text-muted">{String(r.index).padStart(2, "0")}</span>
              <span className={`truncate font-bold ${r.index === reelIndex ? "text-accent" : "text-soft"}`}>{r.title}</span>
              {r.status === "ready" && <span className="ml-auto text-[11px] text-good">ready</span>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
