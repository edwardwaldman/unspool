"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { PaywallSheet } from "../reel/paywall-sheet";
import { openAuth } from "../auth/auth-store";
import { Sheet } from "../ui/sheet";
import { toast } from "../ui/toast";
import { Bookmark, Download, Heart, Link2, MessageCircle, MoreHorizontal, Music2, Send } from "lucide-react";
import { ChevronDown, ChevronUp, PlayIcon, VolumeIcon } from "../ui/icons";

// The public demo: three pre-rendered sample reels (real MP4s with voiceover), then a gate that can't be
// dismissed. Scroll / swipe / arrow keys move between reels, like a phone feed.
// Heart (or double-tap) and bookmark save a reel for later; comments open the reel's text summary and an
// edit box; share sends the watermarked reel with a link back to Unspool.

const REELS = [
  { src: "/demo/reel-1.mp4", poster: "/demo/reel-1.jpg", title: "Population vs sample", caption: "A chef never eats the whole pot 🍲 #apstats #studytok",
    summary: ["The population is everyone you want to know about: the whole pot.", "A sample is the part you actually measure: one spoonful.", "If the pot is stirred (a random sample), one spoonful tells you about the whole pot."] },
  { src: "/demo/reel-2.mp4", poster: "/demo/reel-2.jpg", title: "Parameter vs statistic", caption: "P with P. S with S. Never lose these points again #apstats",
    summary: ["A parameter describes a whole population, like the true average sleep of every teen. You almost never know it.", "A statistic is calculated from your sample, like the 6.9 hours your survey found.", "Memory trick: Parameter goes with Population, Statistic goes with Sample."] },
  { src: "/demo/reel-3.mp4", poster: "/demo/reel-3.jpg", title: "4 sampling methods", caption: "The one the test always asks 🎯 #apstats #finals",
    summary: ["Simple random: everyone has the same chance, like names in a hat.", "Stratified: split into groups, then sample some from every group.", "Cluster: split into groups, then take a few whole groups.", "Systematic: random start, then every k-th person.", "The trap: stratified takes some from every group; cluster takes all of a few groups."] },
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
  const [sheet, setSheet] = useState<null | "comments" | "share">(null);
  const [burst, setBurst] = useState<{ i: number; key: number; x: number; y: number } | null>(null);
  const lastTap = useRef<{ t: number; timer: number | null }>({ t: 0, timer: null });
  const save = (i: number) => {
    setLiked((l) => new Set(l).add(i));
    setSaved((x) => new Set(x).add(i));
  };
  // One tap: sound / pause. Two quick taps: big heart in the middle and save for later.
  const onTap = (i: number, e: React.MouseEvent<HTMLVideoElement>) => {
    const now = e.timeStamp;
    if (now - lastTap.current.t < 300) {
      if (lastTap.current.timer) window.clearTimeout(lastTap.current.timer);
      lastTap.current = { t: 0, timer: null };
      const box = e.currentTarget.getBoundingClientRect();
      setBurst({ i, key: now, x: e.clientX - box.left, y: e.clientY - box.top });
      if (!liked.has(i)) toast("Saved for later");
      save(i);
      return;
    }
    lastTap.current = {
      t: now,
      timer: window.setTimeout(() => {
        if (muted) setMuted(false);
        else setPaused((p) => !p);
      }, 300),
    };
  };
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
                onClick={(e) => onTap(i, e)}
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
              <AnimatePresence>
                {burst?.i === i && (
                  <motion.div
                    key={burst.key}
                    className="pointer-events-none absolute left-1/2 top-1/2 z-20 -ml-[60px] -mt-[60px] text-[120px] leading-none [filter:drop-shadow(0_6px_18px_rgba(0,0,0,.45))]"
                    initial={{ scale: 0, rotate: -18, opacity: 1 }}
                    animate={{ scale: [0, 1.35, 1, 1], rotate: [-18, 8, 0, 0], opacity: [1, 1, 1, 0], y: [0, 0, 0, -60] }}
                    transition={{ duration: 1.1, times: [0, 0.3, 0.55, 1] }}
                    onAnimationComplete={() => setBurst(null)}
                  >
                    ❤️
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Instagram Reels chrome */}
              <div className="absolute bottom-24 right-2 flex flex-col items-center gap-5 text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
                <RailButton label={liked.has(i) ? "Saved for later" : "Save for later"} onClick={() => { if (!liked.has(i)) toast("Saved for later"); setLiked((l) => toggle(l, i)); }}>
                  <Heart size={28} strokeWidth={1.8} fill={liked.has(i) ? "#ff3040" : "none"} color={liked.has(i) ? "#ff3040" : "currentColor"} />
                </RailButton>
                <RailButton label="Summary and edits" onClick={() => setSheet("comments")}>
                  <MessageCircle size={27} strokeWidth={1.8} className="-scale-x-100" />
                </RailButton>
                <RailButton label="Share" onClick={() => setSheet("share")}>
                  <Send size={26} strokeWidth={1.8} />
                </RailButton>
                <RailButton label={saved.has(i) ? "Unsave" : "Save"} onClick={() => { if (!saved.has(i)) toast("Saved"); setSaved((x) => toggle(x, i)); }}>
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
      {!gated && index < GATE && (
        <>
          <Sheet open={sheet === "comments"} onClose={() => setSheet(null)} label="Summary">
            <SummarySheet reel={REELS[index]} />
          </Sheet>
          <Sheet open={sheet === "share"} onClose={() => setSheet(null)} label="Share">
            <ShareDemo reel={REELS[index]} index={index} onDone={() => setSheet(null)} />
          </Sheet>
        </>
      )}
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

type DemoReel = (typeof REELS)[number];

/** The comment button: the reel as text (summary), plus a box to ask for a change. Editing needs an account. */
function SummarySheet({ reel }: { reel: DemoReel }) {
  const [ask, setAsk] = useState("");
  return (
    <div>
      <div className="label">Text summary</div>
      <h2 className="mt-1 text-[19px] font-semibold">{reel.title}</h2>
      <ul className="mt-3 space-y-2 text-[14.5px] leading-snug text-ink/85">
        {reel.summary.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-thread" /> {line}
          </li>
        ))}
      </ul>
      <div className="label mt-6">Want it different?</div>
      <form
        className="mt-2 flex"
        onSubmit={(e) => {
          e.preventDefault();
          openAuth("signup", { next: "/?upload=1" });
        }}
      >
        <input
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="e.g. use a sports example"
          className="field min-w-0 flex-1 px-3 py-2.5 text-[15px]"
        />
        <button type="submit" className="btn-primary -ml-px px-4 text-[14px]">
          Edit
        </button>
      </form>
      <p className="mt-2 text-[12.5px] text-muted">Make a free account to edit reels made from your own notes.</p>
    </div>
  );
}

/** Share: the video already carries the unspool watermark; the text and link point back to us. */
function ShareDemo({ reel, index, onDone }: { reel: DemoReel; index: number; onDone: () => void }) {
  const url = typeof window === "undefined" ? "https://unspool.cc/s/demo" : `${window.location.origin}/s/demo?reel=${index + 1}`;
  const text = `${reel.title}: made with Unspool. Turn any document into reels like this at unspool.cc`;
  const native = async () => {
    try {
      const file = await fetch(reel.src).then((r) => r.blob()).then((b) => new File([b], `unspool-${index + 1}.mp4`, { type: "video/mp4" }));
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, url });
      else if (navigator.share) await navigator.share({ title: reel.title, text, url });
      else throw new Error("no share");
      onDone();
    } catch (e) {
      if ((e as Error).name !== "AbortError") await copy();
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(`${text} ${url}`).catch(() => {});
    toast("Link copied");
    onDone();
  };
  return (
    <div>
      <div className="label">Share</div>
      <h2 className="mt-1 text-[19px] font-semibold">{reel.title}</h2>
      <p className="mt-1 text-[13.5px] text-muted">Shares with the unspool watermark and a link back, so friends can make their own.</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <button type="button" onClick={native} className="flex flex-col items-center gap-2 border border-line py-4 text-[13px] hover:border-thread">
          <Send size={22} strokeWidth={1.6} /> Share
        </button>
        <button type="button" onClick={copy} className="flex flex-col items-center gap-2 border border-line py-4 text-[13px] hover:border-thread">
          <Link2 size={22} strokeWidth={1.6} /> Copy link
        </button>
        <a href={reel.src} download={`unspool-${index + 1}.mp4`} onClick={onDone} className="flex flex-col items-center gap-2 border border-line py-4 text-[13px] hover:border-thread">
          <Download size={22} strokeWidth={1.6} /> Save video
        </a>
      </div>
      <p className="mt-4 text-center font-mono text-[11.5px] text-muted">made with unspool · unspool.cc</p>
    </div>
  );
}
