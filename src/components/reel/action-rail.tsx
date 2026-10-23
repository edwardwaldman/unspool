"use client";

import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "../ui/toast";
import { loadSaved, toggleSaved } from "./prefs";

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-1 text-white transition-transform active:scale-90"
    >
      {children}
    </button>
  );
}

/** The right rail, as in the demo reels: like, summary, share, save, more, and the audio square. */
export function ActionRail({
  reelId,
  title,
  onMore,
  onShare,
  onComments,
}: {
  reelId: string;
  title: string;
  muted?: boolean;
  onToggleMute?: () => void;
  onReplay?: () => void;
  onMore: () => void;
  /** Opens the share sheet; without it the rail shares the site link. */
  onShare?: () => void;
  /** Opens the reel's text summary. */
  onComments?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSaved(loadSaved().has(reelId)));
    return () => cancelAnimationFrame(id);
  }, [reelId]);

  const share = async () => {
    const url = window.location.origin;
    const text = `Unspool turned my doc into reels. This one: ${title}`;
    try {
      if (navigator.share) await navigator.share({ title: "Unspool", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast("Link copied");
      }
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 [text-shadow:0_1px_2px_rgba(0,0,0,.6)]" style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.45))" }}>
      <RailButton label={liked ? "Unlike" : "Like"} onClick={() => setLiked((l) => !l)}>
        <Heart size={28} strokeWidth={1.8} fill={liked ? "#ff3040" : "none"} color={liked ? "#ff3040" : "currentColor"} />
      </RailButton>
      <RailButton label="Read the summary" onClick={onComments ?? (() => toast("Summary unavailable"))}>
        <MessageCircle size={27} strokeWidth={1.8} className="-scale-x-100" />
      </RailButton>
      <RailButton label="Share" onClick={onShare ?? share}>
        <Send size={26} strokeWidth={1.8} />
      </RailButton>
      <RailButton
        label={saved ? "Unsave" : "Save for review"}
        onClick={() => {
          const on = toggleSaved(reelId);
          setSaved(on);
          if (on) toast("Saved for review");
        }}
      >
        <Bookmark size={26} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
      </RailButton>
      <RailButton label="More" onClick={onMore}>
        <MoreHorizontal size={24} strokeWidth={1.8} />
      </RailButton>
      <span className="h-7 w-7 rounded-[7px] border-2 border-white bg-thread" aria-hidden />
    </div>
  );
}
