"use client";

import { Music2 } from "lucide-react";
import { useState } from "react";

/**
 * Bottom-left block, like an Instagram Reel: account row (avatar, source document, part counter),
 * then the reel's title + an expandable one-line summary, then the "Original audio" line.
 */
export function CaptionBlock({
  fileName,
  title,
  index,
  total,
  summary,
  sensitive,
}: {
  fileName: string;
  title: string;
  index: number;
  total: number;
  summary: string;
  sensitive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-left text-white" style={{ textShadow: "0 1px 0 rgba(0,0,0,.55)" }}>
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center font-wordmark text-[14px] font-bold text-[#08110e]"
          style={{ background: "var(--thread)", textShadow: "none" }}
          aria-hidden
        >
          u
        </span>
        <span className="min-w-0 truncate text-[14px] font-semibold tracking-[-0.01em]">{fileName}</span>
        <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">
          Part {index}/{total}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`mt-2 block w-full text-left text-[13.5px] leading-snug text-white/90 ${open ? "" : "truncate"}`}
      >
        <span className="font-semibold text-white">{title}</span> <span className="text-white/80">{summary}</span>
        {!open && <span className="sr-only"> (more)</span>}
      </button>
      {open && sensitive && <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/60">A summary, not legal or financial advice</p>}
      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-white/80">
        <Music2 size={12} strokeWidth={2} aria-hidden />
        <span className="min-w-0 truncate">Original audio · unspool</span>
      </div>
    </div>
  );
}
