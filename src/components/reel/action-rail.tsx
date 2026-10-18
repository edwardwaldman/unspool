"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatIcon, HeartIcon, ReplayIcon, ShareIcon, VolumeIcon } from "../ui/icons";
import { toast } from "../ui/toast";

import { loadSaved, toggleSaved } from "./prefs";

const SHADOW = { filter: "drop-shadow(0 1px 0 rgba(0,0,0,.55))" };

function RailButton({
  label,
  count,
  onClick,
  pressed,
  children,
}: {
  label: string;
  count?: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-[3px] text-white transition-transform hover:scale-110 active:scale-95"
      style={SHADOW}
    >
      {children}
      {count !== undefined && <span className="text-[11px] font-semibold leading-none text-white">{count}</span>}
    </button>
  );
}

export function ActionRail({
  reelId,
  title,
  muted,
  onToggleMute,
  onReplay,
  onMore,
  onShare,
}: {
  reelId: string;
  title: string;
  muted: boolean;
  onToggleMute: () => void;
  onReplay: () => void;
  onMore: () => void;
  /** Opens the share sheet; without it the rail shares the site link. */
  onShare?: () => void;
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
    <div className="flex flex-col items-center gap-[14px]">
      <RailButton
        label={saved ? "Unsave" : "Save"}
        count={saved ? "Saved" : "Save"}
        onClick={() => {
          const on = toggleSaved(reelId);
          setSaved(on);
          if (on) toast("Saved for review");
        }}
      >
        <HeartIcon size={26} strokeWidth={2} filled={saved} style={{ color: saved ? "#ff4d6d" : undefined }} />
      </RailButton>
      <RailButton label="Ask a question" count="Ask" onClick={() => toast("Questions about a reel are coming soon")}>
        <ChatIcon size={25} strokeWidth={2} />
      </RailButton>
      <RailButton label="Replay" count="Replay" onClick={onReplay}>
        <ReplayIcon size={24} strokeWidth={2} />
      </RailButton>
      <RailButton label="Share" count="Share" onClick={onShare ?? share}>
        <ShareIcon size={23} strokeWidth={2} />
      </RailButton>
      <RailButton label={muted ? "Unmute (M)" : "Mute (M)"} pressed={muted} onClick={onToggleMute}>
        <span className={muted ? "text-white" : "text-white/70"}>
          <VolumeIcon size={20} muted={muted} strokeWidth={2} />
        </span>
      </RailButton>
      <RailButton label="More" onClick={onMore}>
        <MoreHorizontal size={24} strokeWidth={2} />
      </RailButton>
    </div>
  );
}
