"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { PaywallSheet } from "../reel/paywall-sheet";
import { ChevronDown, ChevronUp, PlayIcon, VolumeIcon } from "../ui/icons";

// The public demo: three pre-rendered sample reels (real MP4s with voiceover), then a gate that can't be
// dismissed. Scroll / swipe / arrow keys move between reels, like a phone feed.

const REELS = [
  { src: "/demo/reel-1.mp4", poster: "/demo/reel-1.jpg", title: "Population vs sample" },
  { src: "/demo/reel-2.mp4", poster: "/demo/reel-2.jpg", title: "Parameter vs statistic" },
  { src: "/demo/reel-3.mp4", poster: "/demo/reel-3.jpg", title: "4 sampling methods" },
];
const GATE = REELS.length;

export function DemoVideos() {
  const scroller = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const gated = index >= GATE;

  // Track which slide is on screen.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollTop / el.clientHeight));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Play the visible reel only.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === index && !paused) {
        v.muted = muted;
        void v.play().catch(() => {
          // Autoplay with sound blocked: fall back to muted.
          v.muted = true;
          setMuted(true);
          void v.play().catch(() => {});
        });
      } else v.pause();
    });
  }, [index, muted, paused]);

  const go = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    setPaused(false);
    el.scrollTo({ top: Math.max(0, Math.min(GATE, i)) * el.clientHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") go(index + 1);
      else if (e.key === "ArrowUp" || e.key === "k") go(index - 1);
      else if (e.key === "m" || e.key === "M") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex h-full w-full items-center justify-center bg-paper lg:gap-4">
      <div className="relative h-full w-full overflow-hidden bg-black lg:aspect-[9/16] lg:h-[calc(100dvh-112px)] lg:max-h-[920px] lg:w-auto lg:border lg:border-line">
        <div ref={scroller} className={`h-full w-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] ${gated ? "overflow-hidden" : ""}`}>
          {REELS.map((r, i) => (
            <section key={r.src} className="relative h-full w-full snap-start snap-always">
              <video
                ref={(v) => void (videos.current[i] = v)}
                src={r.src}
                poster={r.poster}
                playsInline
                loop
                muted
                preload={i === 0 ? "auto" : "metadata"}
                className="h-full w-full object-contain"
                onClick={() => {
                  if (muted) setMuted(false);
                  else setPaused((p) => !p);
                }}
              />
              {i === index && muted && (
                <button
                  type="button"
                  onClick={() => setMuted(false)}
                  className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 bg-thread px-4 py-2.5 text-[14px] font-semibold text-[#08110e]"
                >
                  <VolumeIcon size={17} muted strokeWidth={2} /> Tap for sound
                </button>
              )}
              {i === index && paused && !muted && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-white/20 bg-paper/85 pl-1 text-white">
                  <PlayIcon size={34} />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-5 pt-16 text-white">
                <div>
                  <div className="text-[12px] font-medium text-white/70">Sample · part {i + 1} of {REELS.length}</div>
                  <div className="mt-0.5 text-[16px] font-semibold">{r.title}</div>
                </div>
                <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="p-2">
                  <VolumeIcon size={22} muted={muted} />
                </button>
              </div>
            </section>
          ))}
          {/* Past the third reel: the gate. */}
          <section className="relative h-full w-full snap-start bg-paper" aria-hidden />
        </div>
      </div>
      <div className="hidden flex-col items-center gap-2 lg:flex">
        <button type="button" aria-label="Previous reel" onClick={() => go(index - 1)} disabled={index === 0} className="flex h-12 w-12 items-center justify-center border border-line text-ink disabled:opacity-30">
          <ChevronUp size={20} />
        </button>
        <span className="font-mono text-[12px] text-muted">{Math.min(index + 1, REELS.length)} of {REELS.length}</span>
        <button type="button" aria-label="Next reel" onClick={() => go(index + 1)} className="flex h-12 w-12 items-center justify-center border border-line text-ink">
          <ChevronDown size={20} />
        </button>
      </div>
      <PaywallSheet open={gated} onClose={() => {}} spool={SAMPLE_SPOOL} viewer={null} reel={GATE + 1} />
    </div>
  );
}
