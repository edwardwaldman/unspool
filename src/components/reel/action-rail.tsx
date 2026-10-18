"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatIcon, HeartIcon, ReplayIcon, ShareIcon } from "../ui/icons";
import { toast } from "../ui/toast";

const SHADOW = { filter: "drop-shadow(0 1px 0 rgba(0,0,0,.55))" };
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
      className="flex flex-col items-center gap-1 text-white transition-transform hover:scale-110 active:scale-95"
      style={SHADOW}
    >
      {children}
      {count !== undefined && <span className="text-[11.5px] font-semibold tracking-[-0.01em] text-white">{count}</span>}
    </button>
  );
}

export function ActionRail({
  reelId,
  title,
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
    <div className="flex flex-col items-center gap-[18px]">
      <RailButton
        label={saved ? "Unsave" : "Save"}
        count={saved ? "Saved" : "Save"}
        onClick={() => {
          const on = toggleSaved(reelId);
          setSaved(on);
          if (on) toast("Saved for review");
        }}
      >
        <HeartIcon size={28} strokeWidth={2} filled={saved} style={{ color: saved ? "#ff4d6d" : undefined }} />
      </RailButton>
      <RailButton label="Ask a question" count="Ask" onClick={() => toast("Questions about a reel are coming soon")}>
        <ChatIcon size={27} strokeWidth={2} />
      </RailButton>
      <RailButton label="Replay" count="Replay" onClick={onReplay}>
        <ReplayIcon size={26} strokeWidth={2} />
      </RailButton>
      <RailButton label="Share" count="Share" onClick={share}>
        <ShareIcon size={25} strokeWidth={2} />
      </RailButton>
      <RailButton label="More" onClick={onMore}>
        <MoreHorizontal size={26} strokeWidth={2} />
      </RailButton>
    </div>
  );
}
