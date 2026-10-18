"use client";

import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReelDTO, SpoolDTO } from "@/lib/spool-types";
import { MarkedText } from "../ui/marked-text";
import { PlayIcon, VolumeIcon } from "../ui/icons";
import { reelVars } from "./accent";
import { ActionRail } from "./action-rail";
import { CaptionBlock } from "./caption-block";
import { Captions } from "./captions";
import { setPrefs, usePrefs } from "./prefs";
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

function clock(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const SHADOW = { textShadow: "0 1px 3px rgba(0,0,0,.5)" };

/**
 * One playable reel, laid out like an Instagram Reel: story-style progress at the top, the media layer
 * (tinted backdrop + this beat's motion graphic) full-bleed, burned-in captions in the lower third,
 * the action rail on the right, and the account / title / audio rows at the bottom.
 */
export function ReelView({
  spool,
  reel,
  active,
  total,
  chrome,
  onEnded,
  onMore,
  preview = false,
}: {
  spool: SpoolDTO;
  reel: ReelDTO;
  active: boolean;
  total: number;
  chrome: ReelChrome;
  onEnded?: () => void;
  onMore: () => void;
  /** Silent looping background (landing page). */
  preview?: boolean;
}) {
  const script = reel.script!;
  const pb = usePlayback({ script, audio: reel.audio, active, onEnded, silent: preview });
  const prefs = usePrefs();
  const fraction = pb.duration > 0 ? pb.t / pb.duration : 0;
  const kind = pb.segment.kind;
  const isQuiz = kind === "quiz" || kind === "explain";
  const stageKey = isQuiz ? `q${pb.segment.beatIndex}` : pb.segment.key;
  const top = chrome.topInset ?? 0;
  const bottom = chrome.bottomInset;
  const opening = pb.seg === 0;
  const muted = prefs.muted;

  return (
    <div className="relative h-full w-full select-none overflow-hidden text-white [container-type:inline-size]" style={reelVars(reel.index)} onClick={pb.toggle} data-testid="reel-view">
      <ReelMedia
        index={reel.index}
        active={active}
        playing={pb.playing}
        muted={muted}
        pulse={pb.seg}
        videoUrl={reel.videoUrl}
        stageKey={stageKey}
        stageBox={{ top: top + (opening ? 190 : 120), bottom: bottom + 236 }}
        stage={
          (active || pb.seg > 0) && !isQuiz
            ? { visual: pb.segment.visual, script, progress: fraction, last: reel.index === total }
            : null
        }
      />

      {/* Scrims so the overlays read on any frame */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-40 bg-gradient-to-b from-black/45 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-[46%] bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      {/* Story-style progress: one segment per beat */}
      {!preview && (
        <div className="absolute inset-x-3 top-2 z-20 flex gap-[3px]" aria-hidden>
          {pb.segments.map((s, i) => {
            const fill = pb.ended || i < pb.seg ? 1 : i === pb.seg ? Math.min(1, fraction) : 0;
            return (
              <div key={s.key} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-white" style={{ width: `${fill * 100}%` }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Player controls: play/pause + time left, mute */}
      {!preview && (
        <div className="absolute inset-x-3 z-20 flex items-center justify-between" style={{ top: top + 16 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pb.toggle();
            }}
            aria-label={pb.playing ? "Pause" : "Play"}
            className="flex h-8 items-center gap-1.5 rounded-full bg-black/30 pl-2.5 pr-3 text-[12px] font-semibold text-white backdrop-blur-[6px] hover:bg-black/45"
          >
            {pb.playing ? <Pause size={13} fill="currentColor" strokeWidth={0} /> : <Play size={13} fill="currentColor" strokeWidth={0} />}
            <span className="font-mono tabular-nums">-{clock(pb.total - pb.elapsed)}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPrefs({ muted: !muted, autoMuted: false });
            }}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-[6px] hover:bg-black/45"
          >
            <VolumeIcon size={16} muted={muted} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Hook text on the opening beat, then the live stats */}
      <div className="absolute inset-x-0 z-10 px-5" style={{ top: top + 62 }}>
        <AnimatePresence mode="wait" initial={false}>
          {opening ? (
            <motion.h2
              key="hook"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-hook text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white"
              style={SHADOW}
            >
              <MarkedText text={script.headline} />
            </motion.h2>
          ) : (
            <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <StatLine stats={script.stats} beat={pb.segment.beatIndex} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quiz: an overlay card inside the frame */}
      {isQuiz && (
        <div className="absolute left-3 right-[64px] z-20 flex items-center" style={{ top: top + 104, bottom: bottom + 150 }}>
          <QuizCard quiz={script.quiz} state={pb.quiz} waitLeft={pb.quizWaitLeft} onAnswer={pb.answer} />
        </div>
      )}

      {/* Burned-in captions, lower third */}
      {!isQuiz && (
        <div className="absolute left-3 right-[60px] z-10" style={{ bottom: bottom + 150 }}>
          <Captions text={pb.segment.text} words={pb.words} fraction={fraction} />
        </div>
      )}

      {/* Right action rail */}
      <div className="absolute right-2.5 z-20" style={{ bottom: bottom + 22 }}>
        <ActionRail reelId={reel.id} title={script.title} fileType={spool.fileType} onReplay={pb.replay} onMore={onMore} />
      </div>

      {/* Account row, title, audio */}
      <div className="absolute left-3.5 right-[68px] z-20" style={{ bottom: bottom + 20 }}>
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
            <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-black/40 pl-1 text-white backdrop-blur-[8px]">
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
          className="absolute left-1/2 top-[50%] z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-[#08110e]"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}
        >
          <VolumeIcon size={17} muted strokeWidth={2} /> Tap for sound
        </button>
      )}
    </div>
  );
}
