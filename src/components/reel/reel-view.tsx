"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ReelDTO, SpoolDTO } from "@/lib/spool-types";
import { PlayIcon, VolumeIcon } from "../ui/icons";
import { reelVars } from "./accent";
import { ActionRail } from "./action-rail";
import { CaptionBlock } from "./caption-block";
import { Captions } from "./captions";
import { KineticHeadline, useHitCount } from "./hook-scene";
import { getPrefs, setPrefs, usePrefs } from "./prefs";
import { ReelMedia } from "./reel-media";
import { StatLine } from "./stat-line";
import { usePlayback } from "./use-playback";
import { QuizCard } from "./visuals";

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
  const pb = usePlayback({ script, audio: reel.audio, active, onEnded, silent: preview, video });
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
  const toggleMute = () => setPrefs({ muted: !getPrefs().muted, autoMuted: false });

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
    <div className="relative h-full w-full select-none overflow-hidden text-white [container-type:inline-size]" style={reelVars(reel.index)} onClick={pb.toggle} data-testid="reel-view" data-seg={pb.segment.key} data-playing={pb.playing ? "1" : "0"}>
      <ReelMedia
        index={reel.index}
        active={active}
        playing={pb.playing}
        muted={muted || preview}
        pulse={pb.seg}
        videoUrl={pb.videoMode ? reel.videoUrl : undefined}
        videoRef={pb.videoRef}
        stageKey={stageKey}
        stageBox={{ top: below, bottom: bottom + RAIL_TOP }}
        stage={
          (active || pb.seg > 0) && !isQuiz
            ? { visual: pb.segment.visual, script, progress: fraction, last: reel.index === total, pulse: hits }
            : null
        }
      />

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
              <StatLine stats={script.stats} beat={pb.segment.beatIndex} />
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
        <div className="absolute left-4 z-10" style={{ right: GUTTER, bottom: bottom + BAND + 12 }}>
          <Captions text={pb.segment.text} words={pb.words} fraction={fraction} />
        </div>
      )}

      {/* Right action rail */}
      <div className="absolute right-2 z-20 flex w-[60px] justify-center" style={{ bottom: bottom + 14 }}>
        <ActionRail reelId={reel.id} title={script.title} muted={muted || preview} onToggleMute={toggleMute} onReplay={pb.replay} onMore={onMore} onShare={onShare} />
      </div>

      {/* Account row, title, audio */}
      <div className="absolute left-3.5 z-20" style={{ right: GUTTER, bottom: bottom + 14 }}>
        <CaptionBlock
          fileName={spool.title ?? spool.fileName}
          title={script.title}
          index={reel.index}
          total={total}
          summary={script.summary}
          sensitive={spool.sensitive}
        />
      </div>

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
      {overlay}
    </div>
  );
}
