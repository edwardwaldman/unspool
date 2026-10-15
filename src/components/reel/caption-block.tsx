"use client";

import { useState } from "react";
import { fileBadge } from "./accent";

/** Bottom-left block, like a Reels caption: doc avatar + name + reel pill, then a one-line expandable summary. */
export function CaptionBlock({
  fileName,
  fileType,
  index,
  total,
  summary,
  sensitive,
}: {
  fileName: string;
  fileType: string;
  index: number;
  total: number;
  summary: string;
  sensitive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const badge = fileBadge(fileType);
  return (
    <div className="text-left drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-black ring-2 ring-white/70"
          style={{ background: badge.color, color: "#0b1020" }}
          aria-hidden
        >
          {badge.label}
        </div>
        <span className="min-w-0 truncate text-[14.5px] font-bold">{fileName}</span>
        <span className="shrink-0 rounded-lg border border-white/70 px-2.5 py-0.5 text-[12.5px] font-semibold">
          Reel {index}/{total}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`mt-2 block w-full text-left text-[13.5px] leading-snug text-soft ${open ? "" : "truncate"}`}
      >
        {summary}
      </button>
      {open && sensitive && (
        <p className="mt-1.5 text-[11.5px] text-muted">Unspool summarizes; it isn&apos;t legal or financial advice.</p>
      )}
    </div>
  );
}
