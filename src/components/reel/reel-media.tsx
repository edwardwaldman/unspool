"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { HighlightColor } from "@/lib/schema";
import { ParticleField } from "./particle-field";
import { VisualStage, type StageProps } from "./visuals";

const Scene3D = dynamic(() => import("./scene-3d"), { ssr: false });
const SCENE_TYPES = new Set(["hook", "bigword", "split", "flow", "list", "icons", "crowd", "stat"]);

/** WebGL is there (checked once per page). */
let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl === null) {
    try {
      const c = document.createElement("canvas");
      webgl = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** The reel's accent and the markup colours, resolved from the reel's own CSS scope (three.js needs real colours). */
function useSceneColors() {
  const ref = useRef<HTMLDivElement>(null);
  const [c, setC] = useState<{ accent: string; colors: Record<HighlightColor, string> } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const css = getComputedStyle(el), v = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const id = requestAnimationFrame(() =>
      setC({ accent: v("--thread", "#d3f05a"), colors: { primary: v("--thread", "#d3f05a"), warn: v("--coral", "#ff8b6c"), yellow: v("--butter", "#f2d36b"), cyan: v("--sage", "#8fd0a8") } }),
    );
    return () => cancelAnimationFrame(id);
  }, []);
  return [ref, c] as const;
}

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
  const reduce = useReducedMotion();
  const [probe, sceneColors] = useSceneColors();
  if (videoUrl && videoRef) return <ReelVideo src={videoUrl} videoRef={videoRef} muted={muted} />;
  // The playing reel's beats are real 3D scenes (as in the demo reels); off-screen reels and devices without
  // WebGL (or with reduced motion) keep the flat graphics.
  const visual = stage?.visual;
  const in3d = Boolean(active && !reduce && sceneColors && visual && SCENE_TYPES.has(visual.type) && !(visual.type === "hook" && /soup|cooking-pot/.test(visual.icon)) && hasWebGL());
  return (
    <>
      <div ref={probe} aria-hidden className="hidden" />
      {/* A deep, lit backdrop (as in the ads): the reel's accent glowing behind the graphic, falling off to near-black. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 42%, color-mix(in srgb, var(--thread) 30%, #20343c) 0%, color-mix(in srgb, var(--thread) 10%, #111b20) 48%, #070b0d 100%)",
        }}
      />
      {in3d && stage && sceneColors ? (
        <div className="absolute inset-x-0 bottom-0 z-[5]" style={{ top: stageBox.top }}>
          {/* @ts-expect-error quiz/outro never reach here (SCENE_TYPES) */}
          <Scene3D visual={stage.visual} progress={stage.progress} accent={sceneColors.accent} colors={sceneColors.colors} beatKey={stageKey} />
        </div>
      ) : (
        <>
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
      )}
    </>
  );
}

function ReelVideo({ src, videoRef, muted }: { src: string; videoRef: React.RefObject<HTMLVideoElement | null>; muted: boolean }) {
  return <video ref={videoRef} src={src} className="absolute inset-0 h-full w-full object-cover" playsInline muted={muted} preload="auto" />;
}
