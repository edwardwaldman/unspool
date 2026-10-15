"use client";

import { useEffect, useState } from "react";
import { ChatIcon, HeartIcon, MoreIcon, ReplayIcon, ShareIcon } from "../ui/icons";
import { toast } from "../ui/toast";
import { fileBadge } from "./accent";
import { loadSaved, toggleSaved } from "./prefs";

function RailButton({ label, count, onClick, children }: { label: string; count?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-1 text-ink drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] active:scale-90"
    >
      {children}
      {count !== undefined && <span className="text-[11.5px] font-semibold">{count}</span>}
    </button>
  );
}

export function ActionRail({
  reelId,
  title,
  fileType,
  onReplay,
  onMore,
}: {
  reelId: string;
  title: string;
  fileType: string;
  onReplay: () => void;
  onMore: () => void;
}) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSaved(loadSaved().has(reelId)));
    return () => cancelAnimationFrame(id);
  }, [reelId]);
  const badge = fileBadge(fileType);

  const share = async () => {
    const url = window.location.origin;
    const text = `I turned my doc into reels with Unspool. This one: ${title}`;
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
    <div className="flex flex-col items-center gap-5">
      <RailButton
        label={saved ? "Unsave" : "Save"}
        count={saved ? "Saved" : "Save"}
        onClick={() => {
          const on = toggleSaved(reelId);
          setSaved(on);
          if (on) toast("Saved for review ♥");
        }}
      >
        <HeartIcon size={30} filled={saved} style={{ color: saved ? "var(--hl-warn)" : undefined }} />
      </RailButton>
      <RailButton label="Ask a question" count="Ask" onClick={() => toast("Ask about this reel — coming soon")}>
        <ChatIcon size={29} />
      </RailButton>
      <RailButton label="Replay" count="Replay" onClick={onReplay}>
        <ReplayIcon size={28} />
      </RailButton>
      <RailButton label="Share" count="Share" onClick={share}>
        <ShareIcon size={27} />
      </RailButton>
      <RailButton label="More" onClick={onMore}>
        <MoreIcon size={26} />
      </RailButton>
      <div
        className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white/80 text-[9px] font-black"
        style={{ background: badge.color, color: "#0b1020" }}
        aria-hidden
      >
        {badge.label}
      </div>
    </div>
  );
}
