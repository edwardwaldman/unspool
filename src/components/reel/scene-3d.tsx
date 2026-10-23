"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";
import type { HighlightColor, Visual } from "@/lib/schema";
import { ReelIcon } from "./icon";
import { sentenceCase } from "./text";

// Generated reels as real 3D scenes, in the look of the hand-made demo reels: lit, solid objects on a soft
// stage, black label chips with leader lines pinned to things in the scene, and a camera that drifts and
// pushes in while the beat plays. One scene per visual type, built from the beat's own words and icons.

type SceneVisual = Exclude<Visual, { type: "quiz" }>;
export type Scene3DProps = { visual: SceneVisual; progress: number; accent: string; colors: Record<HighlightColor, string>; beatKey: string };

const SCENE_TYPES = new Set(["hook", "bigword", "split", "flow", "list", "icons", "crowd", "stat"]);
export const hasScene = (v: { type: string }) => SCENE_TYPES.has(v.type);

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x: number) => {
  x = clamp(x);
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const sentence = (s: string) => sentenceCase(s.replace(/[*#^~]/g, ""));
const CREAM = "#efe8d6";
const INK = "#121512";

function hookFont() {
  if (typeof document === "undefined") return "sans-serif";
  const f = getComputedStyle(document.documentElement).getPropertyValue("--font-hook").trim();
  return f ? `${f}, sans-serif` : "sans-serif";
}

// ---------------------------------------------------------------- textures

/** Words on a transparent canvas, shrunk to fit, for a plane standing in the scene. */
function useTextTexture(text: string, color: string, opts: { w?: number; h?: number; weight?: number; max?: number } = {}) {
  const { w = 1024, h = 256, weight = 800, max = 190 } = opts;
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    const font = hookFont();
    let size = max;
    g.font = `${weight} ${size}px ${font}`;
    while (size > 24 && g.measureText(text).width > w * 0.94) {
      size -= 6;
      g.font = `${weight} ${size}px ${font}`;
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,0,.35)";
    g.fillText(text, w / 2 + size * 0.04, h / 2 + size * 0.07);
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { tex: t, aspect: w / h, fill: Math.min(1, (g.measureText(text).width + size * 0.2) / w) };
  }, [text, color, w, h, weight, max]);
}

/** A Lucide icon drawn on a square face (the face of a tile). */
function useIconTexture(name: string, ink: string, bg: string) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = bg;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const svg = renderToStaticMarkup(<ReelIcon name={name} size={150} strokeWidth={1.7} />).replace(/currentColor/g, ink);
    const img = new Image();
    img.onload = () => {
      g.drawImage(img, 53, 53, 150, 150);
      t.needsUpdate = true;
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.includes("xmlns") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}`;
    return t;
  }, [name, ink, bg]);
  return tex;
}

// ---------------------------------------------------------------- labels (chips pinned to the scene)

type Pin = { id: string; text: string; pos: THREE.Vector3; tone: "dark" | "accent"; line: number };
type PinApi = { set: (p: Pin) => void; drop: (id: string) => void };
const PinCtx = createContext<PinApi | null>(null);

/** A black chip with a leader line down to a point in the scene. */
function Label({ id, text, position, tone = "dark", line = 34 }: { id: string; text: string; position: [number, number, number]; tone?: "dark" | "accent"; line?: number }) {
  const api = useContext(PinCtx);
  const [x, y, z] = position;
  useEffect(() => {
    api?.set({ id, text, pos: new THREE.Vector3(x, y, z), tone, line });
    return () => api?.drop(id);
  }, [api, id, text, x, y, z, tone, line]);
  return null;
}

/** Projects every pin to the screen each frame and moves its chip there (no React re-render per frame). */
function PinProjector({ pins, els }: { pins: React.RefObject<Map<string, Pin>>; els: React.RefObject<Map<string, HTMLDivElement>> }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    for (const [id, p] of pins.current) {
      const el = els.current.get(id);
      if (!el) continue;
      v.copy(p.pos).project(camera);
      const sx = ((v.x + 1) / 2) * size.width;
      const sy = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(${sx}px, ${sy}px)`;
      el.style.opacity = v.z < 1 ? "1" : "0";
    }
  });
  return null;
}

// ---------------------------------------------------------------- building blocks

/** Pops its children in (scale) after `delay` seconds from mount. */
function Pop({ delay = 0, children, position }: { delay?: number; children: React.ReactNode; position?: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const k = back((s.clock.elapsedTime - t0.current - delay) / 0.45);
    ref.current?.scale.setScalar(Math.max(0.0001, k));
  });
  return (
    <group ref={ref} position={position} scale={0.0001}>
      {children}
    </group>
  );
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/** A chunky rounded tile with an icon on its face. */
function Tile({ icon, body, ink = INK, size = 1, spin = 0 }: { icon: string; body: string; ink?: string; size?: number; spin?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(1, 1, 0.18), { depth: 0.28, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 10 });
    g.translate(0, 0, -0.14);
    return g;
  }, []);
  const face = useIconTexture(icon, ink, body);
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current && spin) ref.current.rotation.y = Math.sin(s.clock.elapsedTime * spin) * 0.35;
  });
  return (
    <group ref={ref} scale={size}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={body} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.196]}>
        <planeGeometry args={[0.86, 0.86]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Pedestal({ radius = 0.75, height = 0.35, color = "#262b26" }: { radius?: number; height?: number; color?: string }) {
  return (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 1.06, height, 48]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
    </mesh>
  );
}

/** Words standing in the scene. `height` is the world height of the text line. */
function Words({ text, color, height = 0.7, position = [0, 0, 0], max }: { text: string; color: string; height?: number; position?: [number, number, number]; max?: number }) {
  const { tex, aspect } = useTextTexture(text, color, { max });
  return (
    <mesh position={position}>
      <planeGeometry args={[height * aspect, height]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function Arrow({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mid = a.clone().lerp(b, 0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <group position={mid} quaternion={q}>
      <mesh position={[0, -0.12, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, len - 0.3, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, len / 2 - 0.15, 0]} castShadow>
        <coneGeometry args={[0.15, 0.3, 20]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- camera

type Shot = { pos: [number, number, number]; look: [number, number, number]; fov?: number; sway?: number; push?: number };

/** Glides to the shot, then drifts sideways and pushes in a little as the beat plays. */
function CameraRig({ shot, progress }: { shot: Shot; progress: number }) {
  const look = useRef(new THREE.Vector3(...shot.look));
  const prog = useRef(progress);
  useEffect(() => {
    prog.current = progress;
  }, [progress]);
  useFrame((s, dt) => {
    const camera = s.camera;
    const t = s.clock.elapsedTime, k = 1 - Math.pow(0.002, dt);
    const sway = shot.sway ?? 0.5, push = shot.push ?? 0.12;
    // Shots are composed for a square frame; a tall, narrow reel needs the camera further back to fit the width.
    const aspect = s.size.width / Math.max(1, s.size.height);
    const back = clamp(1.05 / aspect, 1, 2.4) * (1 - push * easeOut(prog.current));
    const lk = new THREE.Vector3(...shot.look);
    const goal = new THREE.Vector3(shot.pos[0] + Math.sin(t * 0.35) * sway, shot.pos[1] + Math.sin(t * 0.27) * 0.08, shot.pos[2]).sub(lk).multiplyScalar(back).add(lk);
    camera.position.lerp(goal, k);
    look.current.lerp(new THREE.Vector3(...shot.look), k);
    camera.lookAt(look.current);
    const cam = camera as THREE.PerspectiveCamera;
    const fov = shot.fov ?? 34;
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov += (fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

// ---------------------------------------------------------------- scenes

function CrowdScene({ v, progress, accent }: { v: Extract<Visual, { type: "crowd" }>; progress: number; accent: string }) {
  const N = 20, GAP = 0.42;
  const ref = useRef<THREE.InstancedMesh>(null);
  // Who's in the sample: a fixed pseudo-random pick, the same every time the beat plays.
  const picked = useMemo(() => Array.from({ length: N * N }, (_, i) => { const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return h - Math.floor(h) < clamp(v.ratio, 0.02, 0.9); }), [v.ratio]);
  const firstPicked = useMemo(() => {
    // A highlighted person near the front-middle, to pin the sample label on.
    let best = -1, score = -1e9;
    picked.forEach((p, i) => {
      if (!p) return;
      const x = (i % N) - N / 2, z = Math.floor(i / N);
      const s = z * 1.2 - Math.abs(x) * 1.5;
      if (s > score) {
        score = s;
        best = i;
      }
    });
    return best < 0 ? N * N - N / 2 : best;
  }, [picked]);
  const pale = useMemo(() => new THREE.Color("#c8d3a6"), []), dim = useMemo(() => new THREE.Color("#3a4136"), []), hot = useMemo(() => new THREE.Color(accent), [accent]);
  const m = useMemo(() => new THREE.Matrix4(), []), c = useMemo(() => new THREE.Color(), []);
  useFrame((s) => {
    const mesh = ref.current;
    if (!mesh) return;
    const lit = easeOut((progress - 0.3) / 0.25);
    for (let i = 0; i < N * N; i++) {
      const x = ((i % N) - (N - 1) / 2) * GAP, z = (Math.floor(i / N) - (N - 1) / 2) * GAP;
      const bob = picked[i] && lit > 0 ? Math.abs(Math.sin(s.clock.elapsedTime * 3 + i)) * 0.06 * lit : 0;
      m.makeTranslation(x, 0.32 + bob, z);
      mesh.setMatrixAt(i, m);
      c.copy(pale).lerp(picked[i] ? hot : dim, lit);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  const fx = ((firstPicked % N) - (N - 1) / 2) * GAP, fz = (Math.floor(firstPicked / N) - (N - 1) / 2) * GAP;
  return (
    <>
      <CameraRig shot={{ pos: [0, 4.2, 7.4], look: [0, 0, 0.6], fov: 38, sway: 0.8, push: 0.25 }} progress={progress} />
      <instancedMesh ref={ref} args={[undefined, undefined, N * N]} castShadow>
        <capsuleGeometry args={[0.11, 0.3, 6, 12]} />
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      <Label id="total" text={v.total_label.toUpperCase()} position={[0, 0.75, -2.6]} />
      {progress > 0.32 && <Label id="pick" text={v.highlight_label.toUpperCase()} position={[fx, 0.6, fz]} tone="accent" />}
    </>
  );
}

function BigWordScene({ v, progress, color }: { v: Extract<Visual, { type: "bigword" }>; progress: number; color: string }) {
  const parts = v.word.split(/\s*·\s*/).filter(Boolean);
  const subs = v.sub.split(/\s*·\s*/).filter(Boolean);
  if (parts.length > 1) {
    return (
      <>
        <CameraRig shot={{ pos: [0, 1.6, 6.2], look: [0, 0.9, 0], fov: 36 }} progress={progress} />
        {parts.slice(0, 3).map((p, i, arr) => {
          const x = (i - (arr.length - 1) / 2) * 2.4;
          return (
            <Pop key={i} delay={i * 0.2} position={[x, 0, 0]}>
              <Pedestal radius={0.9} />
              <Words text={sentence(p)} color={color} height={0.62} position={[0, 1.05, 0]} />
              {subs[i] && <Label id={`s${i}`} text={sentence(subs[i])} position={[0, 0.38, 0.6]} line={22} />}
            </Pop>
          );
        })}
      </>
    );
  }
  return (
    <>
      <CameraRig shot={{ pos: [0, 1.4, 5.6], look: [0, 1.05, 0], fov: 34, push: 0.18 }} progress={progress} />
      <Pop>
        <Pedestal radius={1.7} height={0.3} />
        <Words text={sentence(v.word)} color={color} height={0.8} position={[0, 1.05, 0]} />
      </Pop>
      {v.sub && <Label id="sub" text={sentence(v.sub)} position={[0, 0.32, 1.2]} line={26} />}
    </>
  );
}

function StatScene({ v, progress, color }: { v: Extract<Visual, { type: "stat" }>; progress: number; color: string }) {
  const rise = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    rise.current?.scale.set(1, Math.max(0.01, easeOut((s.clock.elapsedTime - t0.current) / 0.8)), 1);
  });
  return (
    <>
      <CameraRig shot={{ pos: [0, 2.0, 5.8], look: [0, 1.4, 0], fov: 34 }} progress={progress} />
      <group ref={rise}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.2, 1.3, 1.2, 64]} />
          <meshStandardMaterial color="#232823" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.18, 64]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <Pop delay={0.35}>
        <Words text={v.value} color={color} height={1.0} position={[0, 2.05, 0]} />
      </Pop>
      <Label id="lab" text={v.label.toUpperCase()} position={[0, 1.25, 1.1]} line={20} />
    </>
  );
}

function SplitScene({ v, progress, accent }: { v: Extract<Visual, { type: "split" }>; progress: number; accent: string }) {
  const sides = [v.left, v.right];
  return (
    <>
      <CameraRig shot={{ pos: [0, 2.0, 7.6], look: [0, 1.0, 0], fov: 36 }} progress={progress} />
      {sides.map((s, i) => {
        const x = i ? 1.3 : -1.3;
        return (
          <Pop key={i} delay={i * 0.25} position={[x, 0, 0]}>
            <Pedestal radius={0.8} height={0.3} />
            <group position={[0, 1.0, 0]}>
              <Tile icon={s.icon} body={i ? accent : CREAM} size={0.85} spin={0.6} />
            </group>
            <Words text={sentence(s.title)} color="#ffffff" height={0.3} position={[0, 1.8, 0]} max={130} />
            <Label id={`side${i}`} text={sentence(s.sub)} position={[0, 0.3, 0.75]} line={20} />
          </Pop>
        );
      })}
      {v.mode === "to" ? (
        <Pop delay={0.5}>
          <Arrow from={[-0.6, 1.0, 0]} to={[0.6, 1.0, 0]} color={accent} />
        </Pop>
      ) : (
        <Pop delay={0.5}>
          <Words text="VS" color={accent} height={0.55} position={[0, 1.0, 0.3]} />
        </Pop>
      )}
    </>
  );
}

function FlowScene({ v, progress, accent }: { v: Extract<Visual, { type: "flow" }>; progress: number; accent: string }) {
  const steps = v.steps.slice(0, 4);
  const n = steps.length;
  const xs = steps.map((_, i) => (i - (n - 1) / 2) * 1.55);
  const on = Math.min(n, Math.floor(progress * n * 1.15) + 1);
  const focus = xs[on - 1] ?? 0;
  return (
    <>
      <CameraRig shot={{ pos: [focus * 0.3, 2.3, 7.0 + n * 0.6], look: [focus * 0.25, 0.9, 0], fov: 38 }} progress={progress} />
      {steps.map((s, i) => (
        <Pop key={i} delay={i * 0.18} position={[xs[i], 0, i % 2 ? -0.5 : 0.3]}>
          <Pedestal radius={0.62} height={0.22} color={i < on ? "#2c3427" : "#20241f"} />
          <group position={[0, 0.85, 0]}>
            <Tile icon={s.icon} body={i < on ? accent : CREAM} size={0.75} />
          </group>
          <Words text={sentence(s.title)} color={i < on ? "#ffffff" : "rgba(255,255,255,.55)"} height={0.3} position={[0, 1.7, 0]} />
          {i < on && <Label id={`st${i}`} text={sentence(s.sub)} position={[0, 0.22, 0.6]} line={18} />}
        </Pop>
      ))}
      {steps.slice(1).map((_, i) => (
        <Pop key={`a${i}`} delay={0.3 + i * 0.18}>
          <Arrow from={[xs[i] + 0.55, 0.85, i % 2 ? -0.5 : 0.3]} to={[xs[i + 1] - 0.55, 0.85, (i + 1) % 2 ? -0.5 : 0.3]} color={i + 1 < on ? accent : "#5b6356"} />
        </Pop>
      ))}
    </>
  );
}

function ListScene({ v, progress, accent }: { v: Extract<Visual, { type: "list" }>; progress: number; accent: string }) {
  const items = v.items.slice(0, 5);
  const shown = Math.min(items.length, Math.floor(progress * items.length * 1.2) + 1);
  return (
    <>
      <CameraRig shot={{ pos: [2.4, 2.4, 6.0], look: [0, 0.55 + items.length * 0.18, 0], fov: 36 }} progress={progress} />
      <Label id="title" text={v.title.toUpperCase()} position={[0, 0.5 + items.length * 0.42, 0]} />
      {items.slice(0, shown).map((it, i) => (
        <Drop key={i} y={0.2 + i * 0.42} rot={(i % 2 ? 1 : -1) * 0.12}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.36, 1.5]} />
            <meshStandardMaterial color={i === shown - 1 ? accent : i % 2 ? "#d9cfb6" : CREAM} roughness={0.6} />
          </mesh>
          <Words text={sentence(it.label)} color={INK} height={0.24} position={[0, 0, 0.752]} max={150} />
        </Drop>
      ))}
    </>
  );
}

/** Drops a slab in from above onto its place in the stack. */
function Drop({ y, rot, children }: { y: number; rot: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  useFrame((s) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const k = clamp((s.clock.elapsedTime - t0.current) / 0.45);
    const bounce = k < 1 ? (1 - k) * (1 - k) * 2.2 : 0;
    if (ref.current) ref.current.position.y = y + bounce;
  });
  return (
    <group ref={ref} position={[0, y + 2.2, 0]} rotation={[0, rot, 0]}>
      {children}
    </group>
  );
}

function IconsScene({ v, progress, accent }: { v: Extract<Visual, { type: "icons" }>; progress: number; accent: string }) {
  const items = v.items.slice(0, 3);
  const xs = items.map((_, i) => (i - (items.length - 1) / 2) * 1.6);
  return (
    <>
      <CameraRig shot={{ pos: [0, 1.9, 7.2], look: [0, 0.95, 0], fov: 36 }} progress={progress} />
      {items.map((it, i) => (
        <Pop key={i} delay={i * 0.22} position={[xs[i], 0, 0]}>
          <Pedestal radius={0.7} height={0.26} />
          <group position={[0, 0.95, 0]}>
            <Tile icon={it.icon} body={i === items.length - 1 ? accent : CREAM} size={0.8} spin={0.5} />
          </group>
          <Label id={`i${i}`} text={sentence(it.label)} position={[0, 1.6, 0]} line={16} />
        </Pop>
      ))}
      {v.arrow &&
        xs.slice(1).map((x, i) => (
          <Pop key={`a${i}`} delay={0.4 + i * 0.2}>
            <Arrow from={[xs[i] + 0.6, 0.95, 0]} to={[x - 0.6, 0.95, 0]} color={accent} />
          </Pop>
        ))}
    </>
  );
}

function HookScene({ v, progress, accent, color }: { v: Extract<Visual, { type: "hook" }>; progress: number; accent: string; color: string }) {
  return (
    <>
      <CameraRig shot={{ pos: [0.6, 1.5, 5.2], look: [0, 1.15, 0], fov: 34, push: 0.15 }} progress={progress} />
      <Pop>
        <Pedestal radius={1.1} height={0.3} />
        <group position={[0, 1.35, 0]}>
          <Tile icon={v.icon} body={v.color === "warn" ? color : accent} size={1.55} spin={0.7} />
        </group>
      </Pop>
      <Label id="tag" text={v.tag.toUpperCase()} position={[0.75, 2.2, 0.3]} tone="accent" />
    </>
  );
}

function SceneFor({ visual, progress, accent, colors }: Omit<Scene3DProps, "beatKey">) {
  const tone = (c?: HighlightColor) => (c ? colors[c] : accent);
  switch (visual.type) {
    case "crowd":
      return <CrowdScene v={visual} progress={progress} accent={accent} />;
    case "bigword":
      return <BigWordScene v={visual} progress={progress} color={tone(visual.color)} />;
    case "stat":
      return <StatScene v={visual} progress={progress} color={tone(visual.color)} />;
    case "split":
      return <SplitScene v={visual} progress={progress} accent={accent} />;
    case "flow":
      return <FlowScene v={visual} progress={progress} accent={accent} />;
    case "list":
      return <ListScene v={visual} progress={progress} accent={accent} />;
    case "icons":
      return <IconsScene v={visual} progress={progress} accent={accent} />;
    case "hook":
      return <HookScene v={visual} progress={progress} accent={accent} color={tone(visual.color)} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------- the stage

/** The full-frame 3D stage for one beat: lights, a shadow floor, the beat's scene, and its pinned labels. */
export default function Scene3D({ visual, progress, accent, colors, beatKey }: Scene3DProps) {
  const pins = useRef(new Map<string, Pin>());
  const els = useRef(new Map<string, HTMLDivElement>());
  const [list, setList] = useState<Pin[]>([]);
  const api = useMemo<PinApi>(
    () => ({
      set: (p) => {
        pins.current.set(p.id, p);
        setList([...pins.current.values()]);
      },
      drop: (id) => {
        pins.current.delete(id);
        setList([...pins.current.values()]);
      },
    }),
    [],
  );
  return (
    <div className="absolute inset-0" data-testid="scene-3d">
      {/* Soft bokeh behind the stage, as in the demo reels */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          [18, 14, 120],
          [70, 9, 160],
          [84, 30, 90],
          [30, 26, 70],
          [55, 20, 110],
        ].map(([x, y, s], i) => (
          <span key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, background: "rgba(255,255,255,.07)", filter: "blur(6px)" }} />
        ))}
      </div>
      <Canvas shadows dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 2, 7], fov: 36 }} style={{ position: "absolute", inset: 0 }}>
        <PinCtx.Provider value={api}>
          <hemisphereLight args={["#e9f2d6", "#1c2418", 1.0]} />
          <directionalLight
            position={[-3.5, 7, 4.5]}
            intensity={2.2}
            color="#fff1d8"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={6}
            shadow-camera-bottom={-6}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[4, 3, -5]} intensity={1.1} color={accent} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            <shadowMaterial opacity={0.38} />
          </mesh>
          <group key={beatKey}>
            <SceneFor visual={visual} progress={progress} accent={accent} colors={colors} />
          </group>
          <PinProjector pins={pins} els={els} />
        </PinCtx.Provider>
      </Canvas>
      {/* The pinned label chips */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {list.map((p) => (
          <div
            key={p.id}
            ref={(el) => {
              if (el) els.current.set(p.id, el);
              else els.current.delete(p.id);
            }}
            className="absolute left-0 top-0 transition-opacity duration-200"
            style={{ transform: "translate(-999px,-999px)" }}
          >
            <div className="flex -translate-x-1/2 flex-col items-center" style={{ transform: `translate(-50%, calc(-100% - 2px))` }}>
              <span
                className="whitespace-nowrap px-2 py-[3px] font-mono text-[11px] font-semibold uppercase tracking-[0.04em]"
                style={p.tone === "accent" ? { background: accent, color: INK } : { background: "#0b0d0b", color: "#fff" }}
              >
                {p.text}
              </span>
              <span className="w-px" style={{ height: p.line, background: p.tone === "accent" ? accent : "#e5484d" }} />
              <span className="h-[5px] w-[5px] rounded-full" style={{ background: p.tone === "accent" ? accent : "#e5484d" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
