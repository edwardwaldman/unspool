"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { DIAGRAM_TYPES, cleanObjects, type HighlightColor } from "@/lib/schema";
import { MOOD_BG } from "./diagrams";
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
      const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
      webgl = Boolean(gl);
      // Give the probe's context back at once: browsers cap live WebGL contexts (~16) and drop the oldest.
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
  onScreen = false,
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
  /** The reel is the one on screen, even if a sheet over it has paused it. */
  onScreen?: boolean;
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
  // The GPU dropped the scene's context (driver reset, too many contexts, backgrounded tab): rebuild it once, then
  // fall back to the flat graphics if it drops again.
  const [lost, setLost] = useState(0);
  // Reels written before the cast clean-up still get it: real shapes for labelled things, no filler props, and
  // beats with only stand-in boxes drawn flat (objects are visual only, so the voiceover is unaffected).
  const rawScene = stage?.scene;
  const scene = useMemo(() => (rawScene ? { ...rawScene, objects: cleanObjects(rawScene.objects) } : undefined), [rawScene]);
  const glLost = lost > 1;
  if (videoUrl && videoRef) return <ReelVideo src={videoUrl} videoRef={videoRef} muted={muted} />;
  // The playing reel's beats are real 3D scenes (as in the demo reels); off-screen reels and devices without
  // WebGL (or with reduced motion) keep the flat graphics.
  const visual = stage?.visual;
  const story = Boolean(scene?.objects.length);
  // Graphs, equations and emoji props are full-frame flat diagrams: never inside the 3D scene.
  // Lists and icon rows of colours are drawn flat with real colour chips (the 3D versions can only show icons).
  const colours = Boolean(visual && (visual.type === "list" || visual.type === "icons") && visual.items.some((it) => it.color));
  const diagram = Boolean(visual && (DIAGRAM_TYPES.has(visual.type) || colours));
  const mood = stage?.mood ?? (diagram ? "calm" : undefined);
  // Only beats the writer made into a real 3D scene (with objects) go 3D. A text visual (bigword, split, list,
  // icons) with no objects is drawn flat: in 3D it became small labelled pedestals floating in empty space.
  const can3d = Boolean(!diagram && !glLost && !reduce && sceneColors && visual && story && SCENE_TYPES.has(visual.type));
  // The reel on screen keeps its 3D scene even while a pop-up or sheet covers it (and it isn't "active"), so it
  // never swaps to the flat version under the pop-up.
  const in3d = can3d && (active || onScreen) && hasWebGL();
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
      {/* A quick wipe in the reel's colour as each new beat lands, instead of a hard cut */}
      <AnimatePresence>
        {active && !reduce && (
          <motion.div
            key={`wipe-${stageKey}`}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-[7] w-[60%]"
            style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--thread) 22%, transparent), transparent)" }}
            initial={{ left: "-60%" }}
            animate={{ left: "110%" }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          />
        )}
      </AnimatePresence>
      {/* The beat's mood (hot pink hook, calm navy, warning red, win green) cross-fades over the accent backdrop. */}
      <AnimatePresence>
        {mood && (
          <motion.div key={mood} aria-hidden className="pointer-events-none absolute inset-0" style={{ background: MOOD_BG[mood] }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
        )}
      </AnimatePresence>
      {in3d && stage && sceneColors ? (
        <div className="absolute inset-x-0 z-[5]" style={{ top: stageBox.top, bottom: stageBox.bottom }}>
          {/* @ts-expect-error quiz/outro never reach here (SCENE_TYPES) */}
          <Scene3D key={lost} visual={stage.visual} progress={stage.progress} accent={sceneColors.accent} colors={sceneColors.colors} beatKey={stageKey} scene={scene} mood={stage.mood} onLost={() => setLost((n) => n + 1)} />
        </div>
      ) : (
        <>
      {!diagram && <ParticleField active={active && playing} pulse={pulse} />}
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
