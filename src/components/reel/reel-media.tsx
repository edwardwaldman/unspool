"use client";

import { AnimatePresence, motion } from "motion/react";
import { ParticleField } from "./particle-field";
import { VisualStage, type StageProps } from "./visuals";

/**
 * The reel's media layer: everything that would be "the video" (backdrop + motion graphic for the
 * current beat). Overlays (captions, rail, quiz, controls) live in ReelView on top of it.
 *
 * When a reel has a rendered MP4 (`videoUrl`), this swaps to a plain <video> and the generated
 * graphics are skipped; ReelView's overlays stay as they are. The video is driven by usePlayback
 * (via `videoRef`): it plays, pauses and seeks it, and reads its clock.
 */
export function ReelMedia({
  active,
  playing,
  muted,
  pulse,
  stageKey,
  stage,
  stageBox,
  videoUrl,
  videoRef,
}: {
  index: number;
  active: boolean;
  playing: boolean;
  muted: boolean;
  /** Changes per beat; sends a ripple through the backdrop. */
  pulse: number;
  stageKey: string;
  stage: StageProps | null;
  /** Where the motion graphic sits inside the frame. */
  stageBox: React.CSSProperties;
  videoUrl?: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}) {
  if (videoUrl && videoRef) return <ReelVideo src={videoUrl} videoRef={videoRef} muted={muted} />;
  return (
    <>
      {/* A deep, lit backdrop (as in the ads): the reel's accent glowing behind the graphic, falling off to near-black. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 42%, color-mix(in srgb, var(--thread) 30%, #20343c) 0%, color-mix(in srgb, var(--thread) 10%, #111b20) 48%, #070b0d 100%)",
        }}
      />
      <ParticleField active={active && playing} pulse={pulse} />
      <div className="absolute inset-x-0 z-[5] flex items-center justify-center" style={stageBox}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stageKey}
            className="flex h-full w-full items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35 }}
          >
            {stage ? <VisualStage {...stage} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

function ReelVideo({ src, videoRef, muted }: { src: string; videoRef: React.RefObject<HTMLVideoElement | null>; muted: boolean }) {
  return <video ref={videoRef} src={src} className="absolute inset-0 h-full w-full object-cover" playsInline muted={muted} preload="auto" />;
}
