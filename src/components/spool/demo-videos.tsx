"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { PaywallSheet } from "../reel/paywall-sheet";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Music2, Send } from "lucide-react";
import { ChevronDown, ChevronUp, PlayIcon, VolumeIcon } from "../ui/icons";

// The public demo: three pre-rendered sample reels (real MP4s with voiceover), then a gate that can't be
// dismissed. Scroll / swipe / arrow keys move between reels, like a phone feed.

const REELS = [
  { src: "/demo/reel-1.mp4", poster: "/demo/reel-1.jpg", title: "Population vs sample", caption: "A chef never eats the whole pot 🍲 #apstats #studytok" },
  { src: "/demo/reel-2.mp4", poster: "/demo/reel-2.jpg", title: "Parameter vs statistic", caption: "P with P. S with S. Never lose these points again #apstats" },
  { src: "/demo/reel-3.mp4", poster: "/demo/reel-3.jpg", title: "4 sampling methods", caption: "The one the test always asks 🎯 #apstats #finals" },
];
const GATE = REELS.length;

export function DemoVideos() {
  const scroller = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [following, setFollowing] = useState(false);
  const [progress, setProgress] = useState(0);
  const toggle = (set: Set<number>, i: number) => {
    const n = new Set(set);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    return n;
  };
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
                onTimeUpdate={(e) => i === index && setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
                onDoubleClick={() => setLiked((l) => new Set(l).add(i))}
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
              {/* Instagram Reels chrome */}
              <div className="absolute bottom-24 right-2 flex flex-col items-center gap-5 text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
                <RailButton label={liked.has(i) ? "Unlike" : "Like"} onClick={() => setLiked((l) => toggle(l, i))}>
                  <Heart size={28} strokeWidth={1.8} fill={liked.has(i) ? "#ff3040" : "none"} color={liked.has(i) ? "#ff3040" : "currentColor"} />
                </RailButton>
                <RailButton label="Comments">
                  <MessageCircle size={27} strokeWidth={1.8} className="-scale-x-100" />
                </RailButton>
                <RailButton label="Share">
                  <Send size={26} strokeWidth={1.8} />
                </RailButton>
                <RailButton label={saved.has(i) ? "Unsave" : "Save"} onClick={() => setSaved((x) => toggle(x, i))}>
                  <Bookmark size={26} strokeWidth={1.8} fill={saved.has(i) ? "currentColor" : "none"} />
                </RailButton>
                <RailButton label="More">
                  <MoreHorizontal size={24} strokeWidth={1.8} />
                </RailButton>
                <span className="h-7 w-7 rounded-[7px] border-2 border-white bg-thread" aria-hidden />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3.5 pb-4 pt-20 pr-16 text-white [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-thread font-wordmark text-[14px] font-bold text-[#08110e] ring-2 ring-white/90">u</span>
                  <span className="text-[14px] font-semibold">unspool</span>
                  <button
                    type="button"
                    onClick={() => setFollowing((f) => !f)}
                    className="rounded-[8px] border border-white/80 px-3 py-[3px] text-[13px] font-semibold"
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </div>
                <p className="mt-2 line-clamp-2 text-[14px] leading-snug">{r.caption}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-white/90">
                  <Music2 size={13} strokeWidth={2} /> <span className="truncate">unspool · Original audio</span>
                </div>
                <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="absolute bottom-4 right-3 rounded-full bg-black/40 p-2">
                  <VolumeIcon size={18} muted={muted} />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/25">
                <div className="h-full bg-white" style={{ width: `${(i === index ? progress : 0) * 100}%` }} />
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

function RailButton({ label, count, onClick, children }: { label: string; count?: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
      {children}
      {count && <span className="text-[12.5px] font-semibold">{count}</span>}
    </button>
  );
}
