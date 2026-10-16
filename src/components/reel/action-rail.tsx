"use client";

import { useEffect, useState } from "react";
import { ChatIcon, HeartIcon, MoreIcon, ReplayIcon, ShareIcon } from "../ui/icons";
import { toast } from "../ui/toast";
import { fileLabel } from "./accent";
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
      className="flex flex-col items-center gap-1 text-cream active:opacity-60"
    >
      {children}
      {count !== undefined && <span className="text-[11px] text-cream/80">{count}</span>}
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
    <div className="flex flex-col items-center gap-5">
      <RailButton
        label={saved ? "Unsave" : "Save"}
        count={saved ? "Saved" : "Save"}
        onClick={() => {
          const on = toggleSaved(reelId);
          setSaved(on);
          if (on) toast("Saved for review");
        }}
      >
        <HeartIcon size={27} filled={saved} style={{ color: saved ? "var(--thread)" : undefined }} />
      </RailButton>
      <RailButton label="Ask a question" count="Ask" onClick={() => toast("Questions about a reel are coming soon")}>
        <ChatIcon size={26} />
      </RailButton>
      <RailButton label="Replay" count="Replay" onClick={onReplay}>
        <ReplayIcon size={26} />
      </RailButton>
      <RailButton label="Share" count="Share" onClick={share}>
        <ShareIcon size={25} />
      </RailButton>
      <RailButton label="More" onClick={onMore}>
        <MoreIcon size={24} />
      </RailButton>
      <div className="mt-1 flex h-9 w-9 items-center justify-center border border-cream/70 font-mono text-[9px] text-cream" aria-hidden>
        {fileLabel(fileType)}
      </div>
    </div>
  );
}
