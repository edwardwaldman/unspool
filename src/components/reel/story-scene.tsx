"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneObject, SceneSpec } from "@/lib/schema";
import { capsule, cone, contactMaterial, cyl, disc, lathe, mat, plane, popEase, rbox, rcyl, ring, roundedRect, slab, sphere, tone, torus, unitBox, wedge } from "./toy-kit";

// A beat of a reel's own story, built in 3D from the script's scene: the writer picks a concrete story for
// the reel (a chef tasting soup, a snowball rolling downhill) and places objects from this kit beat by beat.
// Every shape is a small designed toy (soft bevelled parts, two or three tones, a detail or two: faces, seams,
// labels, windows), about one unit tall at size 1, standing on the stage at y = 0. Parts share cached geometries
// and materials (toy-kit.ts), so a scene costs almost nothing to build or tear down.

const PALETTE: Record<SceneObject["color"], string> = {
  accent: "", cream: "#efe8d6", white: "#f7f7f2", dark: "#2a2f2a", red: "#e5484d", orange: "#ff8a4c", yellow: "#f2d36b",
  green: "#5fb36b", blue: "#6fa8ff", purple: "#a98bff", pink: "#ff8fb3", brown: "#8a5a3b", gray: "#9aa39a", gold: "#e3b341",
};
const g0 = (g: THREE.BufferGeometry) => g.dispose();
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

type V3 = [number, number, number];

/** One part of a toy: a shared geometry with a shared material. */
function P({ g, m, p, r, s, cast = true }: { g: THREE.BufferGeometry; m: THREE.Material; p?: V3; r?: V3; s?: V3 | number; cast?: boolean }) {
  return <mesh geometry={g} material={m} position={p} rotation={r} scale={s} castShadow={cast} receiveShadow />;
}

const INK = "#1b1f1c";
const PAPER = "#f6f1e4";
const STEEL = "#cfd4d6";
const GOLD = "#e3b341";
const LEAF = "#5fb36b";

const heartShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.42);
  s.bezierCurveTo(-0.22, -0.24, -0.5, -0.06, -0.5, 0.17);
  s.bezierCurveTo(-0.5, 0.36, -0.36, 0.46, -0.24, 0.46);
  s.bezierCurveTo(-0.1, 0.46, -0.02, 0.37, 0, 0.29);
  s.bezierCurveTo(0.02, 0.37, 0.1, 0.46, 0.24, 0.46);
  s.bezierCurveTo(0.36, 0.46, 0.5, 0.36, 0.5, 0.17);
  s.bezierCurveTo(0.5, -0.06, 0.22, -0.24, 0, -0.42);
  return s;
};
const starShape = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.23 : 0.48, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
};
const arrowShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.45, -0.085);
  s.lineTo(0.06, -0.085);
  s.lineTo(0.06, -0.23);
  s.lineTo(0.44, 0);
  s.lineTo(0.06, 0.23);
  s.lineTo(0.06, 0.085);
  s.lineTo(-0.45, 0.085);
  s.closePath();
  return s;
};
const roofShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0, 0.36);
  s.closePath();
  return s;
};

/** A little face (eyes and a smile) on the front of a round head of radius r centred at the origin. */
function Face({ r }: { r: number }) {
  const ink = mat(INK, "ink");
  return (
    <group>
      <P g={sphere(r * 0.12, 12, 8)} m={ink} p={[-r * 0.36, r * 0.12, r * 0.93]} s={[1, 1.25, 0.6]} cast={false} />
      <P g={sphere(r * 0.12, 12, 8)} m={ink} p={[r * 0.36, r * 0.12, r * 0.93]} s={[1, 1.25, 0.6]} cast={false} />
      <P g={torus(r * 0.26, r * 0.045, Math.PI, 6, 16)} m={ink} p={[0, -r * 0.2, r * 0.95]} r={[0.25, 0, Math.PI]} cast={false} />
    </group>
  );
}

function Bowl({ color, deep = false }: { color: string; deep?: boolean }) {
  const h = deep ? 0.75 : 0.45;
  const body = lathe(
    deep ? "pot" : "bowl",
    Array.from({ length: 17 }, (_, i) => {
      const a = (i / 16) * (Math.PI / 2);
      return [0.2 + Math.sin(a) * 0.6, (1 - Math.cos(a)) * h] as [number, number];
    }),
  );
  const top = h - 0.04;
  const chunk = rbox(0.11, 0.07, 0.11, 0.025);
  return (
    <group>
      <mesh geometry={body} material={bowlMat()} castShadow receiveShadow />
      <P g={rcyl(0.18, 0.04, 0.015)} m={mat("#1a1f20")} p={[0, -0.015, 0]} />
      <P g={torus(0.8, 0.04, Math.PI * 2, 12, 64)} m={mat("#d7e39a")} p={[0, h, 0]} r={[Math.PI / 2, 0, 0]} />
      <P g={disc(0.77)} m={mat(color, "matte")} p={[0, top, 0]} r={[-Math.PI / 2, 0, 0]} cast={false} />
      {deep &&
        [-1, 1].map((sx) => <P key={sx} g={torus(0.11, 0.035, Math.PI * 2, 10, 28)} m={mat("#2b3234")} p={[sx * 0.86, h - 0.1, 0]} r={[Math.PI / 2, 0, 0]} />)}
      {Array.from({ length: 11 }, (_, i) => {
        const rr = 0.18 + ((i * 37) % 10) / 20;
        return <P key={i} g={chunk} m={mat(i % 3 ? "#ff8a4c" : "#7fc77a", "matte")} p={[Math.cos(i * 2.4) * rr, top + 0.02, Math.sin(i * 2.4) * rr]} r={[0.2 * (i % 2), i, 0.15]} />;
      })}
    </group>
  );
}
let _bowl: THREE.Material | null = null;
const bowlMat = () => (_bowl ??= new THREE.MeshPhysicalMaterial({ color: "#22292a", roughness: 0.3, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2, side: THREE.DoubleSide }));

/** A flag on a pole, its cloth rippling in a breeze. */
function Flag({ color }: { color: string }) {
  const geo = useMemo(() => new THREE.PlaneGeometry(0.6, 0.38, 16, 4).translate(0.3, 0, 0), []);
  useEffect(() => () => g0(geo), [geo]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const cloth = ref.current?.geometry;
    if (!cloth) return;
    const pos = cloth.attributes.position as THREE.BufferAttribute;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 9 - t * 4 + y * 2) * 0.05 * (x / 0.6));
    }
    pos.needsUpdate = true;
    cloth.computeVertexNormals();
  });
  return (
    <group>
      <P g={rcyl(0.17, 0.06, 0.025)} m={mat(INK)} />
      <P g={cyl(0.022, 1.18, 14)} m={mat(STEEL, "metal")} p={[0, 0.65, 0]} />
      <P g={sphere(0.045, 16, 10)} m={mat(GOLD, "metal")} p={[0, 1.26, 0]} />
      <mesh ref={ref} geometry={geo} material={mat(color, "cloth")} position={[0.02, 1.02, 0]} castShadow />
    </group>
  );
}

const MOLECULE: { p: V3; r: number }[] = [
  { p: [0, 0, 0], r: 0.2 },
  { p: [0.4, 0.2, 0], r: 0.13 },
  { p: [-0.38, 0.18, 0.1], r: 0.13 },
  { p: [0.02, -0.38, 0.15], r: 0.13 },
];
const BONDS = MOLECULE.slice(1).map(({ p }) => {
  const b = new THREE.Vector3(...p), len = b.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().normalize());
  return { mid: b.multiplyScalar(0.5).toArray() as V3, q, len };
});

/** One shape from the kit, about a unit tall, standing at y = 0. */
function Shape({ o, color }: { o: SceneObject; color: string }) {
  const c = color;
  const m = mat(c);
  switch (o.shape) {
    case "person": {
      // The demo's peg figure, as a toy: a smooth body that widens to the shoulders, little arms, a face.
      const body = lathe("peg", [[0, 0], [0.2, 0], [0.235, 0.03], [0.24, 0.08], [0.2, 0.32], [0.17, 0.5], [0.19, 0.6], [0.2, 0.66], [0.17, 0.73], [0.1, 0.77], [0, 0.78]]);
      return (
        <group>
          <P g={body} m={m} />
          {[-1, 1].map((sx) => (
            <P key={sx} g={capsule(0.055, 0.26)} m={mat(tone(c, -0.07))} p={[sx * 0.215, 0.47, 0.02]} r={[0, 0, sx * 0.14]} />
          ))}
          <group position={[0, 0.93, 0]}>
            <P g={sphere(0.18)} m={mat(tone(c, 0.06))} />
            <Face r={0.18} />
          </group>
        </group>
      );
    }
    case "crowd":
      return <Crowd color={c} />;
    case "bowl":
      return <Bowl color={c} />;
    case "pot":
      return <Bowl color={c} deep />;
    case "spoon":
      return (
        <group rotation={[0, 0, -0.5]} position={[0.1, 0.12, 0]}>
          <P g={cyl(0.03, 1.15, 16, 0.022)} m={mat(STEEL, "metal")} p={[0, 0.72, 0]} />
          <P g={sphere(0.04, 16, 10)} m={mat(STEEL, "metal")} p={[0, 1.3, 0]} />
          <P g={sphere(0.14, 24, 16)} m={mat(STEEL, "metal")} p={[0, 0.06, 0]} s={[1, 0.38, 1.35]} />
        </group>
      );
    case "cube":
      // A toy building block: soft edges, a raised panel on its faces in a lighter tone.
      return (
        <group position={[0, 0.36, 0]}>
          <P g={rbox(0.72, 0.72, 0.72, 0.1)} m={m} />
          <P g={rbox(0.54, 0.54, 0.04, 0.02)} m={mat(tone(c, 0.035))} p={[0, 0, 0.352]} cast={false} />
          <P g={rbox(0.54, 0.04, 0.54, 0.02)} m={mat(tone(c, 0.035))} p={[0, 0.352, 0]} cast={false} />
          <P g={rbox(0.04, 0.54, 0.54, 0.02)} m={mat(tone(c, 0.035))} p={[0.352, 0, 0]} cast={false} />
        </group>
      );
    case "dice": {
      const pip = sphere(0.058, 14, 10), ink = mat(INK, "ink"), f = 0.352, d = 0.18;
      return (
        <group position={[0, 0.36, 0]} rotation={[0, 0.35, 0]}>
          <P g={rbox(0.72, 0.72, 0.72, 0.14)} m={mat(PAPER)} />
          {/* front: five */}
          {[[0, 0], [-d, -d], [d, d], [-d, d], [d, -d]].map(([x, y], i) => (
            <P key={`f${i}`} g={pip} m={ink} p={[x, y, f]} s={[1, 1, 0.35]} cast={false} />
          ))}
          {/* top: one */}
          <P g={pip} m={mat(PALETTE.red, "ink")} p={[0, f, 0]} s={[1.3, 0.35, 1.3]} cast={false} />
          {/* side: three */}
          {[[-d, d], [0, 0], [d, -d]].map(([y, z], i) => (
            <P key={`s${i}`} g={pip} m={ink} p={[f, y, z]} s={[0.35, 1, 1]} cast={false} />
          ))}
        </group>
      );
    }
    case "crate": {
      const wood = o.color === "brown" || o.color === "cream" ? PALETTE.brown : c;
      const slat = rbox(0.62, 0.17, 0.05, 0.02), post = rbox(0.1, 0.74, 0.1, 0.03), mSlat = mat(wood, "matte"), mPost = mat(tone(wood, 0.07), "matte");
      return (
        <group position={[0, 0.37, 0]}>
          <P g={rbox(0.68, 0.7, 0.68, 0.03)} m={mat(tone(wood, -0.14), "matte")} />
          {[-0.21, 0, 0.21].map((y) => (
            <group key={y}>
              <P g={slat} m={mSlat} p={[0, y, 0.33]} />
              <P g={slat} m={mSlat} p={[0.33, y, 0]} r={[0, Math.PI / 2, 0]} />
            </group>
          ))}
          <P g={rbox(0.82, 0.08, 0.05, 0.02)} m={mPost} p={[0, 0, 0.365]} r={[0, 0, 0.78]} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
            <P key={`${sx}${sz}`} g={post} m={mPost} p={[sx * 0.33, 0, sz * 0.33]} />
          ))}
        </group>
      );
    }
    case "ball":
      // Two-tone striped toy ball.
      return (
        <group position={[0, 0.4, 0]} rotation={[0.35, 0.4, 0.2]}>
          {Array.from({ length: 6 }, (_, i) => (
            <P key={i} g={wedge(0.4, (i * Math.PI) / 3, Math.PI / 3)} m={i % 2 ? mat(tone(c, 0.2, -0.05)) : m} />
          ))}
          <P g={sphere(0.07, 16, 10)} m={mat(PAPER)} p={[0, 0.385, 0]} s={[1, 0.4, 1]} />
        </group>
      );
    case "cylinder":
      // A lidded tin: body, a lighter label band, a steel rim and lid.
      return (
        <group>
          <P g={rcyl(0.35, 0.86, 0.06)} m={m} />
          <P g={cyl(0.356, 0.3, 48, 0.356, true)} m={mat(tone(c, 0.14, -0.05))} p={[0, 0.42, 0]} cast={false} />
          <P g={torus(0.315, 0.03, Math.PI * 2, 10, 48)} m={mat(STEEL, "metal")} p={[0, 0.86, 0]} r={[Math.PI / 2, 0, 0]} />
          <P g={rcyl(0.3, 0.035, 0.015)} m={mat(tone(c, -0.08))} p={[0, 0.845, 0]} cast={false} />
          <P g={torus(0.335, 0.018, Math.PI * 2, 8, 48)} m={mat(tone(c, -0.12))} p={[0, 0.06, 0]} r={[Math.PI / 2, 0, 0]} cast={false} />
        </group>
      );
    case "cone":
      // A toy traffic cone: square foot, rounded tip, a white band.
      return (
        <group>
          <P g={rbox(0.76, 0.07, 0.76, 0.03)} m={mat(tone(c, -0.18))} p={[0, 0.035, 0]} />
          <P g={lathe("cone", [[0, 0.06], [0.36, 0.06], [0.345, 0.1], [0.09, 0.9], [0.05, 0.96], [0, 0.975]])} m={m} />
          <P g={cyl(0.234, 0.17, 40, 0.18, true)} m={mat(PAPER)} p={[0, 0.535, 0]} cast={false} />
        </group>
      );
    case "mountain":
      return (
        <group>
          <P g={cone(0.85, 1, 7)} m={mat(c, "facet")} p={[0, 0.5, 0]} />
          <P g={cone(0.85 * 0.3, 0.3, 7)} m={mat(PAPER, "facet")} p={[0, 0.85, 0]} s={1.04} />
          <P g={cone(0.5, 0.62, 6)} m={mat(tone(c, -0.08), "facet")} p={[0.55, 0.31, 0.2]} />
          <P g={cone(0.5 * 0.3, 0.186, 6)} m={mat(PAPER, "facet")} p={[0.55, 0.527, 0.2]} s={1.05} />
        </group>
      );
    case "book":
      return (
        <group rotation={[0, -0.25, 0]}>
          <P g={rbox(0.96, 0.05, 0.7, 0.02)} m={m} p={[0, 0.025, 0]} />
          <P g={rbox(0.96, 0.05, 0.7, 0.02)} m={m} p={[0, 0.245, 0]} />
          <P g={rbox(0.07, 0.27, 0.7, 0.03)} m={mat(tone(c, -0.06))} p={[-0.46, 0.135, 0]} />
          <P g={rbox(0.9, 0.18, 0.66, 0.015)} m={mat(PAPER, "matte")} p={[0.02, 0.135, 0]} cast={false} />
          <P g={rbox(0.42, 0.012, 0.24, 0.005)} m={mat(tone(c, 0.3, -0.1))} p={[0.08, 0.272, 0]} cast={false} />
          {[-0.22, 0.22].map((z) => (
            <P key={z} g={rbox(0.076, 0.275, 0.03, 0.01)} m={mat(GOLD, "metal")} p={[-0.46, 0.135, z]} cast={false} />
          ))}
        </group>
      );
    case "coin":
      return (
        <group position={[0, 0.37, 0]} rotation={[0, 0.35, 0]}>
          <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.045]}>
            <P g={rcyl(0.35, 0.09, 0.03)} m={mat(GOLD, "metal")} />
          </group>
          {[-1, 1].map((sz) => (
            <P key={sz} g={torus(0.3, 0.025, Math.PI * 2, 8, 48)} m={mat(tone(GOLD, 0.08), "metal")} p={[0, 0, sz * 0.045]} cast={false} />
          ))}
          <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.045]}>
            <P g={rcyl(0.17, 0.02, 0.008)} m={mat(tone(GOLD, 0.06), "metal")} cast={false} />
          </group>
        </group>
      );
    case "coins":
      return (
        <group>
          {Array.from({ length: 5 }, (_, i) => (
            <group key={i} position={[Math.sin(i * 2.1) * 0.03, i * 0.088, Math.cos(i * 1.7) * 0.02]}>
              <P g={rcyl(0.3, 0.085, 0.03)} m={mat(GOLD, "metal")} />
              <P g={torus(0.302, 0.01, Math.PI * 2, 6, 48)} m={mat(tone(GOLD, -0.12), "metal")} p={[0, 0.0425, 0]} r={[Math.PI / 2, 0, 0]} cast={false} />
            </group>
          ))}
        </group>
      );
    case "card":
      return (
        <group position={[0, 0.5, 0]} rotation={[-0.12, 0, 0]}>
          <P g={slab("card", () => roundedRect(0.66, 0.95, 0.07), 0.03, 0.015)} m={mat(PAPER)} />
          <P g={rbox(0.56, 0.24, 0.012, 0.03)} m={m} p={[0, 0.27, 0.031]} cast={false} />
          {[0.48, 0.42, 0.3].map((w, i) => (
            <P key={i} g={rbox(w, 0.045, 0.012, 0.02)} m={mat("#d3cbb8", "matte")} p={[(w - 0.48) / 2, 0.02 - i * 0.11, 0.031]} cast={false} />
          ))}
          <P g={rbox(0.13, 0.1, 0.012, 0.02)} m={mat(GOLD, "metal")} p={[-0.18, -0.34, 0.031]} cast={false} />
        </group>
      );
    case "phone":
      return (
        <group position={[0, 0.5, 0]} rotation={[-0.1, 0, 0]}>
          <P g={slab("phone", () => roundedRect(0.5, 0.95, 0.09), 0.05, 0.02)} m={mat("#1d2126")} />
          <P g={rbox(0.43, 0.84, 0.01, 0.06)} m={mat(c, "screen")} p={[0, 0, 0.046]} cast={false} />
          <P g={rbox(0.12, 0.032, 0.01, 0.016)} m={mat("#0b0c0e", "ink")} p={[0, 0.38, 0.052]} cast={false} />
          {[0.3, 0.22, 0.3].map((w, i) => (
            <P key={i} g={rbox(w, 0.05, 0.01, 0.025)} m={mat("#ffffff", "screen")} p={[(w - 0.3) / 2, 0.18 - i * 0.12, 0.052]} cast={false} />
          ))}
          <P g={rcyl(0.06, 0.01, 0.004)} m={mat("#ffffff", "screen")} p={[0, -0.3, 0.052]} r={[Math.PI / 2, 0, 0]} cast={false} />
        </group>
      );
    case "clock": {
      const tick = rbox(0.022, 0.06, 0.01, 0.008), tickBig = rbox(0.035, 0.09, 0.01, 0.01), ink = mat(INK, "ink");
      return (
        <group position={[0, 0.5, 0]}>
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <P g={sphere(0.13, 24, 12, )} m={mat(tone(c, -0.08))} p={[sx * 0.27, 0.4, -0.02]} s={[1, 0.75, 1]} />
              <P g={sphere(0.06, 12, 8)} m={mat(tone(c, -0.15))} p={[sx * 0.3, -0.43, 0]} />
            </group>
          ))}
          <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.07]}>
            <P g={rcyl(0.46, 0.14, 0.06)} m={m} />
          </group>
          <P g={disc(0.37)} m={mat(PAPER, "matte")} p={[0, 0, 0.072]} cast={false} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <P key={i} g={i % 3 ? tick : tickBig} m={ink} p={[Math.sin(a) * 0.3, Math.cos(a) * 0.3, 0.078]} r={[0, 0, -a]} cast={false} />;
          })}
          <Hand length={0.26} speed={1.2} />
          <Hand length={0.17} speed={0.1} />
          <P g={sphere(0.035, 12, 8)} m={mat(c)} p={[0, 0, 0.1]} cast={false} />
        </group>
      );
    }
    case "scale":
      return <Balance color={c} tilt={o.motion === "tilt"} />;
    case "flag":
      return <Flag color={c} />;
    case "tree": {
      const leaf = o.color === "cream" || o.color === "white" ? LEAF : c;
      return (
        <group>
          <P g={lathe("trunk", [[0, 0], [0.12, 0], [0.1, 0.06], [0.075, 0.3], [0.065, 0.62], [0, 0.62]], 16)} m={mat(PALETTE.brown, "matte")} />
          <P g={sphere(0.38)} m={mat(leaf, "matte")} p={[0, 0.86, 0]} />
          <P g={sphere(0.26)} m={mat(tone(leaf, -0.07), "matte")} p={[-0.25, 0.7, 0.1]} />
          <P g={sphere(0.27)} m={mat(tone(leaf, 0.06), "matte")} p={[0.24, 0.72, 0.06]} />
        </group>
      );
    }
    case "house": {
      const roof = "#b4503d";
      return (
        <group>
          <P g={rbox(0.8, 0.58, 0.7, 0.04)} m={m} p={[0, 0.29, 0]} />
          <P g={slab("roof", roofShape, 0.74, 0.04)} m={mat(roof)} p={[0, 0.58 + 0.2, 0]} />
          <P g={rbox(0.12, 0.24, 0.12, 0.03)} m={mat(tone(roof, -0.08))} p={[0.24, 0.86, -0.12]} />
          <P g={rbox(0.18, 0.3, 0.03, 0.04)} m={mat(tone(c, -0.35))} p={[0, 0.15, 0.355]} cast={false} />
          <P g={sphere(0.018, 8, 6)} m={mat(GOLD, "metal")} p={[0.05, 0.15, 0.375]} cast={false} />
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <P g={rbox(0.18, 0.18, 0.03, 0.025)} m={mat(tone(c, -0.2))} p={[sx * 0.25, 0.36, 0.352]} cast={false} />
              <P g={rbox(0.13, 0.13, 0.03, 0.02)} m={mat("#ffe6a3", "screen")} p={[sx * 0.25, 0.36, 0.36]} cast={false} />
            </group>
          ))}
        </group>
      );
    }
    case "building": {
      const win = rbox(0.11, 0.14, 0.02, 0.02), lit = mat("#fff1c8", "screen"), dark = mat(tone(c, -0.25));
      return (
        <group>
          <P g={rbox(0.62, 1.5, 0.62, 0.05)} m={m} p={[0, 0.75, 0]} />
          <P g={rbox(0.67, 0.07, 0.67, 0.03)} m={mat(tone(c, -0.12))} p={[0, 1.52, 0]} />
          <P g={cyl(0.012, 0.22, 8)} m={mat(STEEL, "metal")} p={[0.15, 1.66, 0]} />
          {Array.from({ length: 15 }, (_, i) => {
            const col = i % 3, row = Math.floor(i / 3), on = (i * 7) % 5 !== 0;
            const x = (col - 1) * 0.17, y = 0.3 + row * 0.24;
            return (
              <group key={i}>
                <P g={win} m={on ? lit : dark} p={[x, y, 0.31]} cast={false} />
                <P g={win} m={(i * 3) % 4 ? lit : dark} p={[0.31, y, -x]} r={[0, Math.PI / 2, 0]} cast={false} />
              </group>
            );
          })}
        </group>
      );
    }
    case "bottle":
      return (
        <group>
          <P g={lathe("bottle", [[0, 0], [0.19, 0], [0.22, 0.03], [0.22, 0.5], [0.19, 0.6], [0.1, 0.68], [0.085, 0.78], [0.09, 0.8], [0, 0.8]])} m={mat("#e8f6ff", "glass")} cast={false} />
          <P g={rcyl(0.2, 0.42, 0.03)} m={mat(c, "screen")} p={[0, 0.02, 0]} />
          <P g={cyl(0.225, 0.2, 48, 0.225, true)} m={mat(PAPER, "matte")} p={[0, 0.26, 0]} cast={false} />
          <P g={rcyl(0.1, 0.11, 0.03)} m={mat(tone(c, -0.2))} p={[0, 0.78, 0]} />
        </group>
      );
    case "flask":
      return (
        <group>
          <P g={lathe("flask", [[0, 0], [0.33, 0], [0.36, 0.03], [0.34, 0.09], [0.12, 0.56], [0.1, 0.62], [0.1, 0.82], [0.135, 0.84], [0.135, 0.87]])} m={mat("#e8f6ff", "glass")} cast={false} />
          <P g={lathe("flaskfill", [[0, 0.02], [0.32, 0.02], [0.33, 0.06], [0.22, 0.3], [0, 0.3]])} m={mat(c, "screen")} />
          {[[0.08, 0.2, 0.1, 0.035], [-0.1, 0.36, 0.0, 0.025], [0.02, 0.5, -0.02, 0.02]].map(([x, y, z, r], i) => (
            <P key={i} g={sphere(r, 12, 8)} m={mat("#ffffff", "glass")} p={[x, y, z]} cast={false} />
          ))}
        </group>
      );
    case "heart":
      return <P g={slab("heart", heartShape, 0.16, 0.08)} m={m} p={[0, 0.54, 0]} />;
    case "star":
      return <P g={slab("star", starShape, 0.14, 0.07)} m={m} p={[0, 0.54, 0]} />;
    case "arrow":
      return <P g={slab("arrow", arrowShape, 0.12, 0.05)} m={m} p={[0, 0.42, 0]} />;
    case "magnifier":
      return (
        <group position={[0, 0.76, 0]} rotation={[0, 0, 0.5]}>
          <P g={torus(0.3, 0.06, Math.PI * 2, 16, 48)} m={m} />
          <P g={disc(0.3)} m={mat("#d6ecff", "glass")} cast={false} />
          <P g={torus(0.19, 0.014, 1.1, 6, 16)} m={mat("#ffffff", "glow")} p={[0, 0, 0.02]} r={[0, 0, 1.9]} cast={false} />
          <P g={cyl(0.075, 0.1, 24)} m={mat(STEEL, "metal")} p={[0, -0.39, 0]} />
          <P g={rcyl(0.065, 0.42, 0.04)} m={mat(INK)} p={[0, -0.86, 0]} />
        </group>
      );
    case "target":
      return (
        <group>
          {[-1, 1].map((sx) => (
            <P key={sx} g={cyl(0.025, 0.72, 10)} m={mat(PALETTE.brown, "matte")} p={[sx * 0.22, 0.34, -0.05]} r={[0.1, 0, -sx * 0.18]} />
          ))}
          <P g={cyl(0.025, 0.7, 10)} m={mat(PALETTE.brown, "matte")} p={[0, 0.32, -0.25]} r={[-0.35, 0, 0]} />
          <group position={[0, 0.6, 0]} rotation={[-0.12, 0, 0]}>
            <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.04]}>
              <P g={rcyl(0.5, 0.08, 0.035)} m={mat(PAPER)} />
            </group>
            <P g={ring(0.37, 0.47)} m={m} p={[0, 0, 0.042]} cast={false} />
            <P g={ring(0.17, 0.27)} m={m} p={[0, 0, 0.042]} cast={false} />
            <P g={disc(0.08)} m={m} p={[0, 0, 0.042]} cast={false} />
            <group position={[0.02, 0.01, 0.04]} rotation={[0.5, 0.35, 0]}>
              <P g={cyl(0.012, 0.36, 8)} m={mat(STEEL, "metal")} p={[0, 0, 0.18]} r={[Math.PI / 2, 0, 0]} />
              <P g={cone(0.05, 0.1, 3)} m={mat(PALETTE.red)} p={[0, 0, 0.34]} r={[-Math.PI / 2, 0, 0]} />
            </group>
          </group>
        </group>
      );
    case "lock":
      return (
        <group>
          <P g={torus(0.19, 0.05, Math.PI, 12, 32)} m={mat(STEEL, "metal")} p={[0, 0.68, 0]} />
          {[-1, 1].map((sx) => (
            <P key={sx} g={cyl(0.05, 0.16, 16)} m={mat(STEEL, "metal")} p={[sx * 0.19, 0.6, 0]} />
          ))}
          <P g={slab("lock", () => roundedRect(0.62, 0.5, 0.1), 0.18, 0.04)} m={m} p={[0, 0.3, 0]} />
          <P g={rbox(0.48, 0.36, 0.012, 0.05)} m={mat(tone(c, 0.08))} p={[0, 0.3, 0.131]} cast={false} />
          <P g={disc(0.05, 20)} m={mat(INK, "ink")} p={[0, 0.33, 0.139]} cast={false} />
          <P g={rbox(0.035, 0.1, 0.01, 0.01)} m={mat(INK, "ink")} p={[0, 0.27, 0.138]} cast={false} />
        </group>
      );
    case "key":
      return (
        <group position={[0, 0.48, 0]} rotation={[0, 0.3, -0.55]}>
          <P g={torus(0.14, 0.055, Math.PI * 2, 12, 32)} m={mat(GOLD, "metal")} p={[0, 0.28, 0]} />
          <P g={rbox(0.15, 0.045, 0.1, 0.02)} m={mat(GOLD, "metal")} p={[0, 0.1, 0]} />
          <P g={rbox(0.07, 0.56, 0.07, 0.03)} m={mat(GOLD, "metal")} p={[0, -0.16, 0]} />
          <P g={rbox(0.13, 0.06, 0.06, 0.02)} m={mat(GOLD, "metal")} p={[0.08, -0.38, 0]} />
          <P g={rbox(0.1, 0.06, 0.06, 0.02)} m={mat(GOLD, "metal")} p={[0.065, -0.25, 0]} />
        </group>
      );
    case "lightbulb": {
      const glow = o.color === "cream" || o.color === "white" ? PALETTE.yellow : c;
      return (
        <group>
          <P g={rcyl(0.08, 0.1, 0.03)} m={mat(INK)} />
          <P g={rcyl(0.15, 0.28, 0.02)} m={mat(STEEL, "metal")} p={[0, 0.08, 0]} />
          {[0.15, 0.21, 0.27].map((y) => (
            <P key={y} g={torus(0.152, 0.018, Math.PI * 2, 8, 32)} m={mat(STEEL, "metal")} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} cast={false} />
          ))}
          <P g={lathe("bulb", [[0, 0.35], [0.14, 0.35], [0.16, 0.45], [0.26, 0.56], [0.31, 0.7], [0.31, 0.82], [0.24, 0.93], [0.12, 0.99], [0, 1.0]])} m={mat("#fff7d6", "glass")} cast={false} />
          <P g={sphere(0.2)} m={mat(glow, "glow")} p={[0, 0.72, 0]} cast={false} />
        </group>
      );
    }
    case "cell":
      return (
        <group position={[0, 0.5, 0]}>
          <P g={sphere(0.5, 40, 24)} m={mat(c, "glass")} cast={false} />
          <P g={sphere(0.17)} m={mat("#8a5ad6")} p={[0.05, 0.02, 0]} />
          <P g={sphere(0.06, 16, 10)} m={mat("#5d3a9e")} p={[0.1, 0.07, 0.12]} cast={false} />
          {[[0.25, -0.15, 0.1, 0.4], [-0.22, 0.2, -0.05, 1.3], [-0.2, -0.22, 0.12, 2.2], [0.18, 0.25, -0.12, 0.9]].map(([x, y, z, r], i) => (
            <P key={i} g={capsule(0.045, 0.12)} m={mat(tone(c, -0.15, 0.1))} p={[x, y, z]} r={[r, r * 0.6, r * 1.3]} cast={false} />
          ))}
        </group>
      );
    case "molecule":
      return (
        <group position={[0, 0.52, 0]}>
          {BONDS.map((b, i) => (
            <mesh key={`b${i}`} geometry={cyl(0.035, b.len, 12)} material={mat("#d9dcd6")} position={b.mid} quaternion={b.q} castShadow />
          ))}
          {MOLECULE.map(({ p, r }, i) => (
            <P key={i} g={sphere(r)} m={i ? mat(PAPER) : m} p={p} />
          ))}
        </group>
      );
    case "cloud": {
      const w = o.color === "cream" ? "#ffffff" : c, cm = mat(w, "matte");
      return (
        <group position={[0, 0.5, 0]}>
          {[[0, 0.06, 0, 0.3], [0.3, -0.02, 0, 0.23], [-0.3, -0.02, 0, 0.23], [0.13, 0.2, -0.05, 0.22], [-0.15, 0.17, -0.04, 0.2], [0.05, -0.05, 0.12, 0.22]].map(([x, y, z, r], i) => (
            <P key={i} g={sphere(r)} m={cm} p={[x, y, z]} />
          ))}
          <P g={capsule(0.16, 0.5)} m={cm} p={[0, -0.08, 0]} r={[0, 0, Math.PI / 2]} />
        </group>
      );
    }
    case "sun": {
      const sun = PALETTE.yellow;
      return (
        <group position={[0, 0.62, 0]}>
          <P g={sphere(0.34)} m={mat(sun, "glow")} />
          <P g={torus(0.43, 0.025, Math.PI * 2, 8, 64)} m={mat(tone(sun, 0.1), "glow")} cast={false} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <P key={i} g={capsule(0.045, 0.1)} m={mat(PALETTE.orange, "glow")} p={[Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0]} r={[0, 0, a - Math.PI / 2]} />;
          })}
          <group position={[0, 0, 0]}>
            <Face r={0.34} />
          </group>
        </group>
      );
    }
    case "planet":
      return (
        <group position={[0, 0.56, 0]} rotation={[0, 0, 0.25]}>
          <P g={sphere(0.4, 40, 24)} m={mat(c, "matte")} />
          {[-0.14, 0.12].map((y) => (
            <P key={y} g={torus(Math.sqrt(0.4 * 0.4 - y * y) + 0.002, 0.025, Math.PI * 2, 8, 48)} m={mat(tone(c, -0.1), "matte")} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} cast={false} />
          ))}
          <P g={ring(0.52, 0.7)} m={mat("#efe1bb", "cloth")} r={[Math.PI / 2 - 0.62, 0.15, 0]} />
          <P g={sphere(0.075, 16, 10)} m={mat("#b9bfb6", "matte")} p={[0.62, 0.32, 0.1]} />
        </group>
      );
    case "chart": {
      const hs = [0.35, 0.58, 0.82, 1.1];
      return (
        <group>
          <P g={rbox(1.08, 0.06, 0.42, 0.03)} m={mat(PAPER)} p={[0, 0.03, 0]} />
          {hs.map((h, i) => (
            <P key={i} g={rbox(0.19, h, 0.19, 0.045)} m={i === 3 ? m : mat(tone(c, 0.28 - i * 0.08, -0.15))} p={[(i - 1.5) * 0.25, 0.06 + h / 2, 0]} />
          ))}
        </group>
      );
    }
    default:
      // A shape from an older or newer kit than this player knows: a plain ball, so the object (and its label) still has a body.
      return <P g={sphere(0.4)} m={m} p={[0, 0.4, 0]} />;
  }
}

const HEIGHT: Partial<Record<SceneObject["shape"], number>> = {
  person: 1.1, crowd: 0.45, bowl: 0.6, pot: 0.85, spoon: 1.2, building: 1.6, flag: 1.3, tree: 1.24, mountain: 1, scale: 1.1, chart: 1.2, coins: 0.45, coin: 0.72,
  book: 0.28, cube: 0.72, dice: 0.72, crate: 0.74, ball: 0.8, cylinder: 0.9, house: 1.02, clock: 1.0, bottle: 0.9, flask: 0.88, heart: 1.0, star: 1.0, arrow: 0.7,
  magnifier: 1.1, target: 1.1, lock: 0.9, key: 0.95, cell: 1.0, molecule: 0.95, cloud: 0.85, sun: 1.25, planet: 1.0,
};
/** Footprint width at size 1 (what a row of objects is packed by). */
const WIDTH: Partial<Record<SceneObject["shape"], number>> = {
  crowd: 2.1, bowl: 1.7, pot: 1.9, spoon: 0.9, mountain: 1.9, scale: 1.4, chart: 1.1, house: 1.0, flag: 0.85, person: 0.6, building: 0.68, bottle: 0.5, flask: 0.75,
  key: 0.7, coin: 0.75, coins: 0.7, arrow: 1.0, clock: 0.95, target: 1.05, book: 1.0, planet: 1.45, cloud: 1.15, sun: 1.3, cube: 0.8, dice: 0.85, crate: 0.8, cylinder: 0.75, cone: 0.8,
};
export const shapeHeight = (o: SceneObject) => (HEIGHT[o.shape] ?? 1) * o.size;

function Hand({ length, speed }: { length: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = -s.clock.elapsedTime * speed;
  });
  return (
    <group ref={ref} position={[0, 0, 0.085]}>
      <P g={rbox(0.03, length, 0.015, 0.012)} m={mat(INK, "ink")} p={[0, length / 2 - 0.03, 0]} cast={false} />
    </group>
  );
}

function Balance({ color, tilt }: { color: string; tilt: boolean }) {
  const beam = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (beam.current) beam.current.rotation.z = tilt ? Math.sin(s.clock.elapsedTime * 1.4) * 0.18 : 0;
  });
  const pan = lathe("pan", [[0, 0], [0.18, 0.01], [0.25, 0.05], [0.27, 0.08], [0.26, 0.085]]);
  return (
    <group>
      <P g={rcyl(0.32, 0.08, 0.035)} m={mat(tone(color, -0.18))} />
      <P g={cyl(0.04, 0.9, 16, 0.03)} m={mat(STEEL, "metal")} p={[0, 0.5, 0]} />
      <group ref={beam} position={[0, 0.96, 0]}>
        <P g={rbox(1.3, 0.06, 0.07, 0.03)} m={mat(color)} />
        <P g={sphere(0.06, 16, 10)} m={mat(GOLD, "metal")} p={[0, 0.03, 0]} />
        {[-0.6, 0.6].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <P g={sphere(0.035, 12, 8)} m={mat(STEEL, "metal")} />
            <P g={cyl(0.008, 0.3, 6)} m={mat(STEEL, "metal")} p={[0, -0.15, 0]} cast={false} />
            <P g={pan} m={mat(color)} p={[0, -0.33, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
}

function Crowd({ color }: { color: string }) {
  const N = 8;
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  // The crowd never moves: place it once. Each figure a slightly different shade of the colour, as a real crowd reads.
  useLayoutEffect(() => {
    const b = bodies.current, h = heads.current;
    if (!b || !h) return;
    const m = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < N * N; i++) {
      const j = Math.sin(i * 12.9898) * 43758.5453, r = j - Math.floor(j);
      const x = ((i % N) - (N - 1) / 2) * 0.26 + (r - 0.5) * 0.05, z = (Math.floor(i / N) - (N - 1) / 2) * 0.26 + (r - 0.5) * 0.04;
      m.makeTranslation(x, 0.16, z);
      b.setMatrixAt(i, m);
      m.makeTranslation(x, 0.36, z);
      h.setMatrixAt(i, m);
      col.set(tone(color, (r - 0.5) * 0.14));
      b.setColorAt(i, col);
      h.setColorAt(i, col.offsetHSL(0, 0, 0.05));
    }
    for (const x of [b, h]) {
      x.instanceMatrix.needsUpdate = true;
      if (x.instanceColor) x.instanceColor.needsUpdate = true;
      x.computeBoundingBox();
      x.computeBoundingSphere();
    }
  }, [color]);
  return (
    <group>
      <instancedMesh ref={bodies} args={[capsule(0.075, 0.16), mat("#ffffff"), N * N]} castShadow receiveShadow />
      <instancedMesh ref={heads} args={[sphere(0.075, 16, 10), mat("#ffffff"), N * N]} castShadow />
    </group>
  );
}

/** Where an object sits once the scene is laid out. `focus`: the beat's hero, the one the camera pushes in on. */
export type Slot = { x: number; z: number; size: number; height: number; focus: boolean };

/** The object a beat is about: the accent one (the script's way to point at it), else a glowing one, else the biggest. */
export function focusIndex(scene: SceneSpec): number {
  const objs = scene.objects;
  let best = 0, score = -Infinity;
  objs.forEach((o, i) => {
    const s = (o.color === "accent" ? 10 : 0) + (o.motion === "glow" || o.motion === "pulse" ? 4 : 0) + (o.size || 1);
    if (s > score) {
      score = s;
      best = i;
    }
  });
  return best;
}

/**
 * Lay a scene out like a shot, not a slide: the hero object stands big at centre front, and the supporting cast
 * is staged around it, smaller and stepping back into depth on the side the writer put it (left or right of the
 * hero), so the frame has a foreground, a background and a clear subject. Nothing overlaps.
 */
export function layoutScene(scene: SceneSpec): Slot[] {
  const objs = scene.objects;
  const n = objs.length;
  const slots: Slot[] = new Array(n);
  if (!n) return slots;
  const h = focusIndex(scene);
  const hero = objs[h];
  const heroSize = n === 1 ? 1.9 : Math.max(1.25, Math.min(1.8, (hero.size || 1) * 1.3));
  const heroW = (WIDTH[hero.shape] ?? 0.9) * heroSize;
  slots[h] = { x: 0, z: 0.35, size: heroSize, height: (HEIGHT[hero.shape] ?? 1) * heroSize, focus: true };
  // The cast, split by which side of the hero the writer placed them, nearest first on each side.
  const rest = objs.map((o, i) => ({ o, i })).filter(({ i }) => i !== h);
  const left: typeof rest = [], right: typeof rest = [];
  rest.sort((a, b) => Math.abs(a.o.x - hero.x) - Math.abs(b.o.x - hero.x) || a.i - b.i);
  for (const r of rest) {
    const side = r.o.x < hero.x ? left : r.o.x > hero.x ? right : left.length <= right.length ? left : right;
    side.push(r);
  }
  // Keep the shot balanced: one side never holds two more than the other.
  while (left.length > right.length + 1) right.push(left.pop()!);
  while (right.length > left.length + 1) left.push(right.pop()!);
  const gap = 0.45;
  for (const [dir, list] of [[-1, left], [1, right]] as const) {
    let edge = heroW / 2 + gap;
    list.forEach(({ o, i }, j) => {
      // Writer's relative size still reads (0.5..1.05 of a unit), but always clearly smaller than the hero, and
      // each step out from the hero a little smaller and further back.
      const size = Math.max(0.65, Math.min(1.1, (o.size || 1) * 0.8)) * (1 - j * 0.1) * Math.min(1, heroSize / 1.4);
      const w = (WIDTH[o.shape] ?? 0.9) * size;
      const x = dir * (edge + w / 2);
      edge += w + gap * 0.7;
      const z = -0.4 - j * 0.6 + (dir > 0 ? -0.15 : 0);
      slots[i] = { x, z, size, height: (HEIGHT[o.shape] ?? 1) * size, focus: false };
    });
  }
  return slots;
}

/** One object: pops in the first time it appears, then glides (position and size) when a later beat moves it. */
/** A camera kick (0..1) that landings and impacts add; the camera rig shakes by it and lets it decay. */
export const impact = { v: 0 };

/** Seconds an object's arrival takes, by how it enters. */
const ENTER_LEN: Record<NonNullable<SceneObject["enter"]>, number> = { pop: 0.7, drop: 0.95, slide: 0.75, rise: 0.8, fly: 0.9, grow: 1.0 };

function Placed({ o, slot, i, accent, progress, heroX }: { o: SceneObject; slot: Slot; i: number; accent: string; progress: number; heroX: number }) {
  const ref = useRef<THREE.Group>(null);
  // The beat's choreography: when (in the line) this object arrives and acts. Scripts without it keep the old
  // staggered pop-in. Both clocks start when the voiceover reaches the cue, not when the scene mounts.
  const choreo = o.enter !== undefined;
  const prog = useRef(progress);
  const entered = useRef<number | null>(null);
  const acted = useRef<number | null>(null);
  const landed = useRef(false);
  useEffect(() => {
    prog.current = progress;
  }, [progress]);
  // A new beat (the object carries over under the same key): its action can play again. An object already on
  // screen stays where it is rather than arriving a second time.
  useEffect(() => {
    acted.current = null;
  }, [o]);
  const body = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const proxy = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  const cur = useRef({ x: slot.x, z: slot.z, size: slot.size });
  const color = o.color === "accent" ? accent : PALETTE[o.color] || PALETTE.cream;
  const foot = (WIDTH[o.shape] ?? 0.9) * 1.05;
  useFrame((s, dt) => {
    const g = ref.current, b = body.current;
    if (!g || !b) return;
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const t = s.clock.elapsedTime;
    if (choreo && entered.current === null && prog.current >= (o.at ?? 0)) entered.current = t;
    if (choreo && acted.current === null && entered.current !== null && o.action && o.action !== "none" && prog.current >= Math.max(o.action_at ?? 0.5, (o.at ?? 0) + 0.15)) acted.current = t;
    // Staggered: each object of a new scene arrives a beat after the one before it (or on its cue).
    const lt = choreo ? (entered.current === null ? -1 : t - entered.current) : t - t0.current - i * 0.14;
    // Critically damped glide (frame-rate independent) when a later beat moves or resizes the object.
    const k = 1 - Math.pow(0.012, dt);
    cur.current.x += (slot.x - cur.current.x) * k;
    cur.current.z += (slot.z - cur.current.z) * k;
    cur.current.size += (slot.size - cur.current.size) * k;
    // Pop in on a spring (one small overshoot, then settle), turning in from a slight angle as it lands.
    const enter = choreo ? o.enter! : o.motion === "drop" ? "drop" : "pop";
    const drop = enter === "drop";
    const appear = lt < 0 ? 0 : enter === "pop" ? popEase(lt / 0.7) : enter === "grow" ? popEase(lt / 1.0) : enter === "rise" ? clamp(lt / 0.25) : 1;
    const settle = 1 - clamp(lt / 0.9);
    let y = 0, ry = -cur.current.x * 0.08 + (drop ? 0 : settle * settle * 0.7), rz = 0, sy = 1, sx = 1;
    // Idle life: a slow breathe and sway, phase-shifted per object, so a held shot never looks frozen.
    const idle = clamp(lt - 0.6);
    ry += Math.sin(t * 0.7 + i * 1.7) * 0.05 * idle;
    sy += Math.sin(t * 1.9 + i * 2.3) * 0.012 * idle;
    let x = cur.current.x, z = cur.current.z;
    if (drop) {
      const fall = clamp(lt / 0.55);
      y = 2.4 * (1 - fall) ** 2;
      // Squash on landing, then spring back; the camera feels it.
      const land = (lt - 0.55) / 0.4;
      if (land > 0 && !landed.current) {
        landed.current = true;
        impact.v = Math.min(1, impact.v + (slot.focus ? 0.7 : 0.35));
      }
      if (land > 0 && land < 1) {
        sy = 1 - Math.sin(land * Math.PI) * 0.16 * (1 - land);
        sx = 1 + (1 - sy) * 0.5;
      }
    }
    const side = cur.current.x < heroX - 0.01 ? -1 : cur.current.x > heroX + 0.01 ? 1 : i % 2 ? 1 : -1;
    if (choreo && lt >= 0) {
      const u = clamp(lt / ENTER_LEN[enter]), e = 1 - (1 - u) ** 3;
      if (enter === "slide") {
        // Skids in from its own side of the frame, leaning into the stop.
        x += side * 4.2 * (1 - e);
        rz += side * 0.25 * Math.sin(u * Math.PI) * (1 - u);
      } else if (enter === "rise") {
        y += -1.4 * (1 - e);
      } else if (enter === "fly") {
        // A thrown arc in from high on its side, tumbling once.
        x += side * 3.2 * (1 - e);
        y += Math.sin((1 - u) * Math.PI * 0.5) * 2.6 * (1 - u) + 0.0;
        ry += (1 - e) * Math.PI * 2;
      }
    }
    // The beat's action, on its cue.
    if (acted.current !== null) {
      const la = t - acted.current;
      switch (o.action) {
        case "to_hero": {
          // Walks over to the hero and stops beside it (a hop in each step).
          const u = 1 - (1 - clamp(la / 0.9)) ** 3;
          x += (heroX + side * 0.9 - cur.current.x) * u;
          y += Math.abs(Math.sin(clamp(la / 0.9) * Math.PI * 3)) * 0.12 * (1 - clamp(la / 0.9));
          break;
        }
        case "away": {
          const u = clamp(la / 0.8) ** 2;
          x += side * 5 * u;
          ry += side * u * 0.6;
          break;
        }
        case "jump": {
          const u = clamp(la / 0.7);
          y += Math.sin(u * Math.PI) * 1.1;
          if (u >= 1 && la < 1.0) {
            sy *= 1 - Math.sin(((la - 0.7) / 0.3) * Math.PI) * 0.14;
            sx *= 1 + (1 - sy) * 0.5;
          }
          break;
        }
        case "shake": {
          const d = Math.max(0, 1 - la / 0.7);
          rz += Math.sin(la * 45) * 0.16 * d;
          x += Math.sin(la * 38) * 0.06 * d;
          if (la < 0.05) impact.v = Math.min(1, impact.v + 0.25);
          break;
        }
        case "flip": {
          ry += (1 - (1 - clamp(la / 0.7)) ** 3) * Math.PI * 2;
          y += Math.sin(clamp(la / 0.7) * Math.PI) * 0.5;
          break;
        }
        case "grow": {
          const u = popEase(la / 0.6);
          sx *= 1 + 0.35 * u;
          sy *= 1 + 0.35 * u;
          if (la < 0.05) impact.v = Math.min(1, impact.v + 0.2);
          break;
        }
      }
    }
    if (o.motion === "bob") y = (0.5 - 0.5 * Math.cos(t * 2.4 + i)) * 0.1;
    if (o.motion === "spin") ry += t * 0.7;
    const pulse = o.motion === "pulse" || o.motion === "glow" ? 1 + Math.sin(t * 3.2) * 0.03 * idle : 1;
    if (o.motion === "stir") {
      x += Math.cos(t * 1.4) * 0.18;
      z += Math.sin(t * 1.4) * 0.18;
    }
    if (o.motion === "tilt" && o.shape !== "scale") rz = Math.sin(t * 1.2) * 0.1;
    // What the camera frames: the object's settled footprint, not its pop, bob or breathing.
    const sz = cur.current.size;
    proxy.current?.position.set(cur.current.x, 0, cur.current.z);
    proxy.current?.scale.set(foot * sz, (HEIGHT[o.shape] ?? 1) * sz, foot * 0.8 * sz);
    g.position.set(x, 0, z);
    g.scale.setScalar(Math.max(0.0001, cur.current.size * appear * pulse));
    b.position.y = y;
    b.rotation.set(0, ry, rz);
    b.scale.set(sx, sy, sx);
    // The contact shadow shrinks and fades as the object lifts off the floor.
    shadow.current?.scale.setScalar(foot * (1 - clamp(y / 3) * 0.6));
  });
  return (
    <>
    <mesh ref={proxy} geometry={unitBox()} visible={false} userData={{ fitProxy: true, focus: slot.focus }} position={[slot.x, 0, slot.z]} scale={[foot * slot.size, slot.height, foot * 0.8 * slot.size]} />
    <group ref={ref} position={[slot.x, 0, slot.z]} scale={0.0001}>
      <mesh ref={shadow} geometry={plane(1, 1)} material={contactMaterial()} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} userData={{ noFit: true }} renderOrder={-1} />
      <group ref={body}>
        <Shape o={o} color={color} />
      </group>
      {o.motion === "glow" && <pointLight position={[0, 1, 0.6]} intensity={2} distance={3} color={color} />}
    </group>
    </>
  );
}

export const STORY_SHOTS: Record<SceneSpec["camera"], { pos: [number, number, number]; look: [number, number, number]; fov: number; sway: number }> = {
  front: { pos: [0, 2.9, 6.4], look: [0, 0.6, 0], fov: 36, sway: 0.25 },
  close: { pos: [0.2, 2.4, 4.6], look: [0, 0.7, 0], fov: 34, sway: 0.2 },
  low: { pos: [0.3, 1.5, 5.8], look: [0, 0.8, 0], fov: 37, sway: 0.25 },
  top: { pos: [0, 6.0, 4.6], look: [0, 0, 0.2], fov: 38, sway: 0.25 },
  orbit: { pos: [0, 2.8, 6.4], look: [0, 0.6, 0], fov: 36, sway: 0.7 },
};

/** The objects of one beat's scene. */
/**
 * The objects of one beat. Keyed by shape (and which one of that shape), not by beat, so an object that is still
 * in the next beat's scene stays mounted and glides to its new place: the story carries on instead of restarting.
 */
export function StoryObjects({ scene, accent, slots, progress = 1 }: { scene: SceneSpec; accent: string; slots: Slot[]; progress?: number }) {
  const seen = new Map<string, number>();
  const heroX = slots.find((s) => s?.focus)?.x ?? 0;
  return (
    <>
      {scene.objects.map((o, i) => {
        const n = seen.get(o.shape) ?? 0;
        seen.set(o.shape, n + 1);
        // Not keyed by colour: recolouring an object to "accent" (the script's way to point at it) must glide, not re-pop.
        return <Placed key={`${o.shape}-${n}`} o={o} slot={slots[i]} i={i} accent={accent} progress={progress} heroX={heroX} />;
      })}
    </>
  );
}
