"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReelDTO, SpoolDTO } from "@/lib/spool-types";
import { MarkedText } from "../ui/marked-text";
import { PlayIcon, VolumeIcon } from "../ui/icons";
import { ActionRail } from "./action-rail";
import { CaptionBlock } from "./caption-block";
import { Captions } from "./captions";
import { ParticleField } from "./particle-field";
import { setPrefs, usePrefs } from "./prefs";
import { StatLine } from "./stat-line";
import { usePlayback } from "./use-playback";
import { VisualStage } from "./visuals";

export type ReelChrome = {
  /** Extra bottom inset for the floating mobile nav. */
  bottomInset: number;
};

/** One playable reel, laid out like an Instagram Reel: headline + live stats on top, visual in the middle, rail + caption at the bottom. */
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
  const visualKey = pb.segment.kind === "explain" ? `q${pb.segment.beatIndex}` : pb.segment.kind === "quiz" ? `q${pb.segment.beatIndex}` : pb.segment.key;

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-paper" onClick={pb.toggle}>
      <ParticleField active={active && pb.playing} pulse={pb.seg} />

      {/* Hook headline + live stat line */}
      <div className="absolute inset-x-0 top-0 z-10 px-5 pt-[60px]">
        <h2 className="font-hook text-[26px] font-extrabold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[27px]">
          <MarkedText text={script.headline} />
        </h2>
        <div className="mt-3">
          <StatLine stats={script.stats} beat={pb.segment.beatIndex} />
        </div>
      </div>

      {/* Visual */}
      <div className="absolute inset-x-0 z-[5] flex items-center justify-center" style={{ top: "28%", bottom: `${chrome.bottomInset + 200}px` }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={visualKey}
            className={`flex h-full w-full items-center justify-center ${pb.segment.visual.type === "quiz" ? "pr-14" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35 }}
          >
            {active || pb.seg > 0 ? (
              <VisualStage
                visual={pb.segment.visual}
                script={script}
                progress={fraction}
                quiz={pb.quiz}
                quizWaitLeft={pb.quizWaitLeft}
                onAnswer={pb.answer}
                last={reel.index === total}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Live captions */}
      {pb.segment.kind !== "quiz" && (
        <div className="absolute inset-x-0 z-10 px-14" style={{ bottom: `${chrome.bottomInset + 112}px` }}>
          <Captions text={pb.segment.text} words={pb.words} fraction={fraction} />
        </div>
      )}

      {/* Right action rail */}
      <div className="absolute right-2.5 z-20" style={{ bottom: `${chrome.bottomInset + 26}px` }}>
        <ActionRail reelId={reel.id} title={script.title} fileType={spool.fileType} onReplay={pb.replay} onMore={onMore} />
      </div>

      {/* Bottom-left caption block */}
      <div className="absolute left-4 right-20 z-20" style={{ bottom: `${chrome.bottomInset + 22}px` }}>
        <CaptionBlock
          fileName={spool.title ?? spool.fileName}
          fileType={spool.fileType}
          index={reel.index}
          total={total}
          summary={script.summary}
          sensitive={spool.sensitive}
        />
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-0 z-20 h-[2px] bg-line" style={{ bottom: `${chrome.bottomInset + 8}px` }}>
        <div className="h-full bg-thread" style={{ width: `${pb.progress * 100}%` }} />
      </div>

      {/* Paused / muted affordances */}
      <AnimatePresence>
        {!pb.playing && active && !pb.ended && (
          <motion.div
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ink/40 bg-paper/50 text-ink">
              <PlayIcon size={30} />
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
          className="btn-primary absolute left-1/2 top-[52%] z-30 -translate-x-1/2 px-4 py-2 text-[14px]"
        >
          <VolumeIcon size={17} muted /> Tap for sound
        </button>
      )}
    </div>
  );
}
