"use client";

import { useState } from "react";
import { fileLabel } from "./accent";

/** Bottom-left block, like a Reels caption: doc badge + name + reel counter, then a one-line expandable summary. */
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
  return (
    <div className="text-left">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-line bg-surface font-mono text-[9px] text-muted" aria-hidden>
          {fileLabel(fileType)}
        </div>
        <span className="min-w-0 truncate text-[14px] font-semibold">{fileName}</span>
        <span className="shrink-0 border border-cream/60 px-2 py-0.5 font-mono text-[11px]">
          {index}/{total}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`mt-2 block w-full text-left text-[13.5px] leading-snug text-cream/75 ${open ? "" : "truncate"}`}
      >
        {summary}
      </button>
      {open && sensitive && <p className="label mt-2">A summary, not legal or financial advice</p>}
    </div>
  );
}
