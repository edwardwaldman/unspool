"use client";

import { Music2 } from "lucide-react";
import { useState } from "react";
import { sentenceCase } from "./text";

const plain = (t: string) => t.replace(/[*#^~]/g, "");

/** "#apstats #studytok": a tag from the document's name, plus the study tag. */
function hashtags(doc: string) {
  const words = doc.replace(/\.[a-z0-9]{2,5}$/i, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 1 && !/^(the|and|for|of|to|a|an|test|practice|notes|pdf)$/.test(w));
  const tag = words.slice(0, 2).join("");
  return [tag && `#${tag.slice(0, 20)}`, "#studytok"].filter(Boolean).join(" ");
}

/**
 * Bottom-left block, exactly as in the demo reels: the unspool account with a Follow button, a caption (the
 * reel's hook and hashtags; tap to read the summary), and the "Original audio" line.
 */
export function CaptionBlock({ title, hook, docName, summary, sensitive }: { title: string; hook: string; docName: string; summary: string; sensitive?: boolean }) {
  const [open, setOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  return (
    <div className="text-left text-white [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-thread font-wordmark text-[14px] font-bold text-[#08110e] ring-2 ring-white/90 [text-shadow:none]" aria-hidden>
          u
        </span>
        <span className="text-[14px] font-semibold">unspool</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFollowing((f) => !f);
          }}
          className="rounded-[8px] border border-white/80 px-3 py-[3px] text-[13px] font-semibold"
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`mt-2 block w-full text-left text-[14px] leading-snug ${open ? "" : "line-clamp-2"}`}
        data-testid="reel-caption"
      >
        {open ? (
          <>
            <span className="font-semibold">{sentenceCase(title)}.</span> {summary}
            {sensitive && <span className="mt-1 block text-[12px] text-white/60">A summary, not legal or financial advice</span>}
          </>
        ) : (
          <>
            {plain(hook)} {hashtags(docName)}
          </>
        )}
      </button>
      <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-white/90">
        <Music2 size={13} strokeWidth={2} aria-hidden /> <span className="truncate">unspool · Original audio</span>
      </div>
    </div>
  );
}
