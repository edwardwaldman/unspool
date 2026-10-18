"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { ParticleField } from "./particle-field";
import { VisualStage, type StageProps } from "./visuals";

// Glow placement varies per reel so neighbouring clips don't look like the same frame recoloured.
const GLOWS = ["50% 38%", "22% 30%", "78% 62%", "30% 70%", "70% 24%"];

/**
 * The reel's media layer: everything that would be "the video" (backdrop + motion graphic for the
 * current beat). Overlays (captions, rail, quiz, controls) live in ReelView on top of it.
 *
 * When a reel has a rendered MP4 (`videoUrl`), this swaps to a plain <video> and the generated
 * graphics are skipped; ReelView's overlays stay as they are.
 */
export function ReelMedia({
  index,
  active,
  playing,
  muted,
  pulse,
  stageKey,
  stage,
  stageBox,
  videoUrl,
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
}) {
  if (videoUrl) return <ReelVideo src={videoUrl} active={active} playing={playing} muted={muted} />;
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(70% 45% at ${GLOWS[(index - 1) % GLOWS.length]}, color-mix(in srgb, var(--thread) 26%, transparent), transparent 70%)` }}
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

function ReelVideo({ src, active, playing, muted }: { src: string; active: boolean; playing: boolean; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active) {
      el.pause();
      el.currentTime = 0;
    } else if (playing) el.play().catch(() => undefined);
    else el.pause();
  }, [active, playing]);
  return <video ref={ref} src={src} className="absolute inset-0 h-full w-full object-cover" playsInline muted={muted} preload="auto" />;
}
