"use client";

import { useEffect, useState } from "react";
import type { ReelDTO, SpoolDTO } from "@/lib/spool-types";
import { ReelView } from "../reel/reel-view";

declare global {
  interface Window {
    /** Set for the recorder: the page is laid out and fonts are in. */
    __recordReady?: boolean;
    /** The recorder calls this on its first frame: the reel starts playing from the top. */
    __recordGo?: () => void;
    /** Set for the recorder: the reel finished. */
    __reelDone?: boolean;
    /** Each segment's voiceover clip, for the recorder's audio track. */
    __reelAudio?: Record<string, { url?: string; duration: number }>;
  }
}

/** One reel, full frame, recording mode: it starts on its own and tells the recorder when it's done. */
export function RecordReel({ spool, reel }: { spool: SpoolDTO; reel: ReelDTO }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    window.__reelAudio = reel.audio ?? {};
    window.__recordGo = () => setGo(true);
    let live = true;
    document.fonts.ready.then(() => {
      if (live) window.__recordReady = true;
    });
    return () => {
      live = false;
    };
  }, [reel.audio]);
  return (
    <div className="fixed inset-0 bg-black">
      <ReelView spool={spool} reel={reel} active={go} onScreen record total={spool.totalReels ?? 1} chrome={{ bottomInset: 0, topInset: 0 }} onMore={() => {}} onEnded={() => (window.__reelDone = true)} />
    </div>
  );
}
