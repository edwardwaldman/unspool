"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ReelDTO, SpoolDTO } from "@/lib/spool-types";
import { PlayIcon, VolumeIcon } from "../ui/icons";
import { reelStyleVars } from "@/lib/reel-style";
import { reelVars } from "./accent";
import { ActionRail } from "./action-rail";
import { CaptionBlock } from "./caption-block";
import { Captions } from "./captions";
import { KineticHeadline, useHitCount } from "./hook-scene";
import { getPrefs, setPrefs, usePrefs } from "./prefs";
import { ReelMedia } from "./reel-media";
import { StatLine } from "./stat-line";
import { usePlayback } from "./use-playback";
import { BeatPop, useDoubleTapHeart } from "./gimmicks";
import { QuizCard } from "./visuals";
import { Sheet } from "../ui/sheet";
import { MarkedText } from "../ui/marked-text";

export type ReelChrome = {
  /** Extra bottom inset (keeps overlays clear of the phone's home indicator). */
  bottomInset: number;
  /** Extra top inset for overlays drawn over the frame (the mobile feed's tabs). */
  topInset?: number;
};

// Frame layout (px). The right gutter belongs to the action rail; captions and the account block stay
// left of it. The motion graphic sits between the headline/stats at the top and the top of the rail,
// so nothing in the frame ever overlaps, at any frame size.
const GUTTER = 76;
const RAIL_TOP = 300;
const BAND = 104;

/** Height of an element, kept up to date (the headline's height decides where the graphic starts). */
function useHeight<T extends HTMLElement>(initial: number) {
  const ref = useRef<T>(null);
  const [h, setH] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(Math.round(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, h] as const;
}

/**
 * One playable reel, laid out like an Instagram Reel: the headline (opening beat) or live stats at the
 * top, the media layer (tinted backdrop + this beat's motion graphic) full-bleed, burned-in captions in
 * the lower third, the action rail on the right, and the account / title / audio rows at the bottom.
 * No player chrome on top: click the video to pause, mute from the rail or with M.
 */
export function ReelView({
  spool,
  reel,
  active,
  total,
  chrome,
  onEnded,
  onMore,
  onShare,
  preview = false,
  overlay,
}: {
  spool: SpoolDTO;
  reel: ReelDTO;
  active: boolean;
  total: number;
  chrome: ReelChrome;
  onEnded?: () => void;
  onMore: () => void;
  onShare?: () => void;
  /** Extra layer drawn inside the frame (public share page: watermark, outro card). */
  overlay?: React.ReactNode;
  /** Silent looping background (landing page). */
  preview?: boolean;
}) {
  const script = reel.script!;
  const video = reel.videoUrl && reel.video ? { url: reel.videoUrl, timeline: reel.video } : undefined;
  // The comments button opens the reel as text; the reel pauses while it's open.
  const [summaryOpen, setSummaryOpen] = useState(false);
  const pb = usePlayback({ script, audio: reel.audio, active: active && !summaryOpen, onEnded, silent: preview, video });
  const prefs = usePrefs();
  const fraction = pb.duration > 0 ? pb.t / pb.duration : 0;
  const kind = pb.segment.kind;
  const isQuiz = kind === "quiz" || kind === "explain";
  const stageKey = isQuiz ? `q${pb.segment.beatIndex}` : pb.segment.key;
  const top = chrome.topInset ?? 0;
  const bottom = chrome.bottomInset;
  const opening = pb.seg === 0;
  const muted = prefs.muted;
  const [headRef, headH] = useHeight<HTMLDivElement>(opening ? 110 : 40);
  const hits = useHitCount(script.headline, pb.segments[0]?.text ?? "", opening ? pb.words : [], opening ? fraction : 0);
  const below = top + 20 + headH + 18;
  const heart = useDoubleTapHeart();
  const toggleMute = () => setPrefs({ muted: !getPrefs().muted, autoMuted: false });
  // The owner's Pro reel style (only ever set on their own documents). A rendered video keeps its own look.
  const look = spool.style;
  const paper = look?.theme === "paper" && !pb.videoMode;

  // Hold-to-2x: a timer starts on press; letting go (or leaving) before it fires is just a tap.
  const hold = useRef<{ timer: number; fired: boolean }>({ timer: 0, fired: false });
  const endHold = () => {
    window.clearTimeout(hold.current.timer);
    if (getPrefs().boost) setPrefs({ boost: false });
  };
  useEffect(() => () => {
    window.clearTimeout(hold.current.timer);
    if (getPrefs().boost) setPrefs({ boost: false });
  }, []);

  // M mutes / unmutes the reel that's playing.
  useEffect(() => {
    if (!active || preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "m" && e.key !== "M") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)) return;
      setPrefs({ muted: !getPrefs().muted, autoMuted: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, preview]);

  return (
    <div className="relative h-full w-full touch-manipulation select-none overflow-hidden text-white [container-type:size] [-webkit-touch-callout:none]" style={{ ...reelVars(reel.index), ...reelStyleVars(look), ...(paper ? { filter: "invert(1) hue-rotate(180deg)" } : {}) }} data-reel-theme={paper ? "paper" : undefined} onClick={(e) => {
        // A hold for 2x ends in a click too: don't let it pause the reel.
        if (hold.current.fired) {
          hold.current.fired = false;
          return;
        }
        heart.onTap(e);
        pb.toggle();
      }}
      onPointerDown={(e) => {
        // Hold the right side of the reel (not a button) to play at 2x, like TikTok.
        if (preview || !active || (e.target as HTMLElement).closest("button,a,input,textarea")) return;
        const box = e.currentTarget.getBoundingClientRect();
        if (e.clientX - box.left < box.width * 0.6) return;
        window.clearTimeout(hold.current.timer);
        hold.current.timer = window.setTimeout(() => {
          hold.current.fired = true;
          setPrefs({ boost: true });
        }, 260);
      }}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={endHold}
      onContextMenu={(e) => hold.current.fired && e.preventDefault()}
      data-testid="reel-view" data-seg={pb.segment.key} data-playing={pb.playing ? "1" : "0"}>
      <motion.div
        className="absolute inset-0"
        animate={preview ? undefined : { scale: [1.07, 1], rotate: [pb.seg % 2 ? 1.2 : -1.2, 0] }}
        transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
      >
      <ReelMedia
        index={reel.index}
        active={active}
        playing={pb.playing}
        muted={muted || preview}
        pulse={pb.seg}
        videoUrl={pb.videoMode ? reel.videoUrl : undefined}
        videoRef={pb.videoRef}
        stageKey={stageKey}
        stageBox={{ top: below, bottom: bottom + RAIL_TOP, right: preview ? 0 : GUTTER - 8, left: preview ? 0 : 8 }}
        stage={
          (active || pb.seg > 0) && !isQuiz
            ? { visual: pb.segment.visual, script, progress: fraction, last: reel.index === total, pulse: hits }
            : null
        }
      />
      </motion.div>

      {/* 2x while held */}
      <AnimatePresence>
        {prefs.boost && active && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 bg-black/60 px-3 py-1.5 font-mono text-[13px] font-semibold text-white"
            style={{ top: below - 6 }}
            data-testid="boost"
          >
            2x <span aria-hidden>▶▶</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress through the reel, a thin line on top of the bottom band */}
      {!preview && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 z-[7] h-[3px] bg-white/15" style={{ bottom: bottom + BAND }}>
          <div className="h-full bg-white" style={{ width: `${Math.min(100, pb.progress * 100)}%` }} />
        </div>
      )}

      {/* Flat band so the account row reads on any frame */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] border-t border-line bg-paper/85" style={{ height: bottom + BAND }} />

      {/* Kinetic headline on the opening beat, then the live stats */}
      <div ref={headRef} className="absolute inset-x-0 z-10 px-5" style={{ top: top + 20 }}>
        <AnimatePresence mode="wait">
          {opening ? (
            <motion.div key="hook" exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}>
              {/* Remounts when the reel comes into view, so the headline builds as it starts playing. */}
              <KineticHeadline key={active ? "on" : "off"} headline={script.headline} beatText={pb.segments[0]?.text ?? ""} words={pb.words} fraction={active ? fraction : 1} />
            </motion.div>
          ) : (
            <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* As in the ads: the reel's topic in big accent letters, with the live stats under it */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="text-center font-hook font-extrabold uppercase leading-[1.02] tracking-[-0.02em] text-thread"
                style={{ fontSize: `min(34px, ${(150 / Math.max(10, script.title.length)).toFixed(1)}cqw)`, textShadow: "0 2px 10px rgba(0,0,0,.45)" }}
                data-testid="reel-topic"
              >
                {script.title}
              </motion.div>
              {script.stats.length > 0 && (
                <div className="mt-3 flex justify-center">
                  <StatLine stats={script.stats} beat={pb.segment.beatIndex} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quiz: an overlay card inside the frame */}
      {isQuiz && (
        <div className="absolute left-3 z-20 flex items-center" style={{ right: GUTTER, top: below - 6, bottom: bottom + BAND + 10 }}>
          <QuizCard quiz={script.quiz} state={pb.quiz} waitLeft={pb.quizWaitLeft} onAnswer={pb.answer} />
        </div>
      )}

      {/* Burned-in captions, lower third (already in the frames when playing a rendered video) */}
      {!isQuiz && !pb.burnedCaptions && (
        <div className="absolute left-4 z-10" style={look?.position === "middle" ? { right: GUTTER, top: "50%", transform: "translateY(-50%)" } : { right: GUTTER, bottom: bottom + BAND + 12 }}>
          <Captions text={pb.segment.text} words={pb.words} fraction={fraction} variant={look?.captions} />
        </div>
      )}

      {/* Right action rail */}
      <div className="absolute right-2 z-20 flex w-[60px] origin-bottom-right justify-center ipad:right-5 ipad:scale-[1.6]" style={{ bottom: bottom + 14 }}>
        <ActionRail reelId={reel.id} title={script.title} muted={muted || preview} onToggleMute={toggleMute} onReplay={pb.replay} onMore={onMore} onShare={onShare} onComments={() => setSummaryOpen(true)} />
      </div>

      {/* Account row, title, audio */}
      <div className="absolute left-3.5 z-20 origin-bottom-left ipad:left-6 ipad:right-[40%]! ipad:scale-[1.6]" style={{ right: GUTTER, bottom: bottom + 14 }}>
        <CaptionBlock
          fileName={spool.title ?? spool.fileName}
          title={script.title}
          index={reel.index}
          total={total}
          summary={script.summary}
          sensitive={spool.sensitive}
        />
      </div>

      <Sheet open={summaryOpen} onClose={() => setSummaryOpen(false)} label="Reel summary">
        <ReelSummary script={script} index={reel.index} sensitive={spool.sensitive} />
      </Sheet>

      {/* Paused */}
      <AnimatePresence>
        {!pb.playing && active && !pb.ended && (
          <motion.div
            initial={{ opacity: 0, scale: 1.25 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div className="flex h-[72px] w-[72px] items-center justify-center border border-white/20 bg-paper/85 pl-1 text-white">
              <PlayIcon size={34} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {active && !preview && prefs.autoMuted && prefs.muted && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPrefs({ muted: false, autoMuted: false });
            pb.replay();
          }}
          className="absolute left-1/2 top-[50%] z-30 flex -translate-x-1/2 items-center gap-2 bg-thread px-4 py-2.5 text-[14px] font-semibold text-[#08110e]"
        >
          <VolumeIcon size={17} muted strokeWidth={2} /> Tap for sound
        </button>
      )}
      {!preview && (
        <>
          {active && <BeatPop seg={pb.seg} />}
          {heart.layer}
        </>
      )}
      {overlay}
    </div>
  );
}

const plainText = (t: string) => t.replace(/[*#^~]/g, "");

/** The reel as text: its summary, the points it makes in order, and its quick-check question. */
function ReelSummary({ script, index, sensitive }: { script: ReelDTO["script"] & object; index: number; sensitive?: boolean }) {
  const points = script.beats.slice(1).map((b) => plainText(b.say)).filter(Boolean);
  return (
    <div className="max-h-[70dvh] overflow-y-auto" data-testid="reel-summary" onClick={(e) => e.stopPropagation()}>
      <div className="label">Reel {index} · summary</div>
      <h2 className="mt-1.5 font-display text-[22px] leading-[1.12] text-ink">{sentence(script.title)}</h2>
      <p className="mt-3 text-[15.5px] leading-[1.5] text-ink/90">
        <MarkedText text={script.summary} />
      </p>
      {points.length > 0 && (
        <>
          <div className="label mt-5">What it covers</div>
          <ol className="mt-2 space-y-2.5">
            {points.map((p, i) => (
              <li key={i} className="flex gap-3 text-[14.5px] leading-[1.45] text-ink/85">
                <span className="w-5 shrink-0 pt-[1px] font-mono text-[12px] text-muted">{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      <div className="mt-5 border border-line p-4">
        <div className="label">Quick check</div>
        <p className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{plainText(script.quiz.question)}</p>
        <p className="mt-2 text-[13.5px] text-muted">Answer: {plainText(script.quiz.options[script.quiz.answer] ?? "")}</p>
      </div>
      {sensitive && <p className="mt-4 text-[12px] text-muted">A summary, not legal or financial advice.</p>}
    </div>
  );
}

function sentence(t: string) {
  const s = t.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
