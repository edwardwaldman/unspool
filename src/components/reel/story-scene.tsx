"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneObject, SceneSpec } from "@/lib/schema";

// A beat of a reel's own story, built in 3D from the script's scene: the writer picks a concrete story for
// the reel (a chef tasting soup, a snowball rolling downhill) and places objects from this kit beat by beat.
// Every shape is a few primitives, about one unit tall at size 1, standing on the stage at y = 0.

const PALETTE: Record<SceneObject["color"], string> = {
  accent: "", cream: "#efe8d6", white: "#f7f7f2", dark: "#2a2f2a", red: "#e5484d", orange: "#ff8a4c", yellow: "#f2d36b",
  green: "#5fb36b", blue: "#6fa8ff", purple: "#a98bff", pink: "#ff8fb3", brown: "#8a5a3b", gray: "#9aa39a", gold: "#e3b341",
};
const g0 = (g: THREE.BufferGeometry) => g.dispose();
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const back = (x: number) => {
  x = clamp(x);
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

/** The demo's look: glazed, slightly glossy solids (a clear coat over the colour) that catch the studio light. */
function Mat({ color, rough = 0.5, metal = 0, emissive, glass }: { color: string; rough?: number; metal?: number; emissive?: number; glass?: boolean }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough * 0.8}
      metalness={metal}
      clearcoat={metal > 0.5 ? 0 : 0.6}
      clearcoatRoughness={0.28}
      emissive={emissive ? color : "#000000"}
      emissiveIntensity={emissive ?? 0}
      transparent={glass}
      opacity={glass ? 0.45 : 1}
      side={glass ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

/** Extruded flat shapes (heart, star), stood upright. */
function Flat({ shape, color, depth = 0.25 }: { shape: THREE.Shape; color: string; depth?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
    g.center();
    return g;
  }, [shape, depth]);
  useEffect(() => () => g0(geo), [geo]);
  return (
    <mesh geometry={geo} position={[0, 0.5, 0]} castShadow receiveShadow>
      <Mat color={color} rough={0.4} />
    </mesh>
  );
}

const heartShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.45);
  s.bezierCurveTo(-0.6, -0.05, -0.55, 0.45, -0.25, 0.45);
  s.bezierCurveTo(-0.08, 0.45, 0, 0.3, 0, 0.22);
  s.bezierCurveTo(0, 0.3, 0.08, 0.45, 0.25, 0.45);
  s.bezierCurveTo(0.55, 0.45, 0.6, -0.05, 0, -0.45);
  return s;
})();
const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.22 : 0.5, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
})();

function Bowl({ color, deep = false }: { color: string; deep?: boolean }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * (Math.PI / 2);
      pts.push(new THREE.Vector2(0.18 + Math.sin(a) * 0.62, (-Math.cos(a) + 1) * (deep ? 0.75 : 0.45)));
    }
    return new THREE.LatheGeometry(pts, 40);
  }, [deep]);
  useEffect(() => () => g0(geo), [geo]);
  const top = deep ? 0.74 : 0.42;
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#23292a" roughness={0.25} metalness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, (deep ? 0.75 : 0.45) + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.035, 10, 48]} />
        <Mat color="#d7e39a" rough={0.35} />
      </mesh>
      <mesh position={[0, top, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.76, 40]} />
        <Mat color={color} rough={0.6} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.4) * 0.45 * ((i % 3) / 3 + 0.4), top + 0.04, Math.sin(i * 2.4) * 0.45 * ((i % 3) / 3 + 0.4)]} rotation={[0, i, 0]} castShadow>
          <boxGeometry args={[0.09, 0.06, 0.09]} />
          <Mat color={i % 2 ? "#ff8a4c" : "#7fc77a"} />
        </mesh>
      ))}
    </group>
  );
}

/** One shape from the kit, about a unit tall, standing at y = 0. Returns its height (for the label). */
function Shape({ o, color }: { o: SceneObject; color: string }) {
  const c = color;
  switch (o.shape) {
    case "person":
      // The demo's figure: a smooth peg body that widens to the shoulders, and a round head.
      return (
        <group>
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.25, 0.72, 28]} />
            <Mat color={c} rough={0.35} />
          </mesh>
          <mesh position={[0, 0.72, 0]} scale={[1, 0.55, 1]} castShadow>
            <sphereGeometry args={[0.2, 28, 16]} />
            <Mat color={c} rough={0.35} />
          </mesh>
          <mesh position={[0, 0.98, 0]} castShadow>
            <sphereGeometry args={[0.17, 28, 18]} />
            <Mat color={c} rough={0.35} />
          </mesh>
        </group>
      );
    case "crowd":
      return <Crowd color={c} />;
    case "bowl":
      return <Bowl color={c} />;
    case "pot":
      return <Bowl color={c} deep />;
    case "spoon":
      return (
        <group rotation={[0, 0, -0.5]} position={[0, 0.15, 0]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.03, 1.3, 12]} />
            <Mat color="#c9cfd1" rough={0.2} metal={0.9} />
          </mesh>
          <mesh position={[0, 0.06, 0]} scale={[1, 0.45, 1.4]} castShadow>
            <sphereGeometry args={[0.13, 20, 14]} />
            <Mat color="#c9cfd1" rough={0.2} metal={0.9} />
          </mesh>
        </group>
      );
    case "cube":
    case "dice":
    case "crate":
      return (
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <Mat color={o.shape === "dice" ? "#f7f7f2" : o.shape === "crate" ? PALETTE.brown : c} rough={o.shape === "crate" ? 0.8 : 0.45} />
        </mesh>
      );
    case "ball":
      return (
        <mesh position={[0, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.4, 32, 20]} />
          <Mat color={c} rough={0.35} />
        </mesh>
      );
    case "cylinder":
      return (
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.9, 32]} />
          <Mat color={c} />
        </mesh>
      );
    case "cone":
    case "mountain":
      return (
        <mesh position={[0, 0.5, 0]} castShadow>
          <coneGeometry args={[o.shape === "mountain" ? 0.9 : 0.4, 1, o.shape === "mountain" ? 7 : 32]} />
          <Mat color={c} rough={0.7} />
        </mesh>
      );
    case "book":
      return (
        <group position={[0, 0.1, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.2, 0.65]} />
            <Mat color={c} />
          </mesh>
          <mesh position={[0.02, 0, 0]}>
            <boxGeometry args={[0.86, 0.16, 0.66]} />
            <Mat color="#f4efe2" />
          </mesh>
        </group>
      );
    case "coin":
    case "coins":
      return (
        <group>
          {Array.from({ length: o.shape === "coins" ? 5 : 1 }, (_, i) => (
            <mesh key={i} position={[(i % 2) * 0.03, 0.05 + i * 0.1, 0]} rotation={o.shape === "coin" ? [Math.PI / 2, 0, 0] : [0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.09, 32]} />
              <Mat color={PALETTE.gold} rough={0.25} metal={0.8} />
            </mesh>
          ))}
        </group>
      );
    case "card":
    case "phone":
      return (
        <group position={[0, 0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[o.shape === "phone" ? 0.5 : 0.65, 0.95, 0.05]} />
            <Mat color={o.shape === "phone" ? "#111" : PALETTE.cream} rough={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[o.shape === "phone" ? 0.42 : 0.5, o.shape === "phone" ? 0.82 : 0.3]} />
            <Mat color={c} emissive={o.shape === "phone" ? 0.4 : 0} />
          </mesh>
        </group>
      );
    case "clock":
      return (
        <group position={[0, 0.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.1, 40]} />
            <Mat color={c} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <circleGeometry args={[0.38, 40]} />
            <Mat color="#f7f7f2" />
          </mesh>
          <Hand length={0.3} speed={1.2} />
          <Hand length={0.2} speed={0.1} />
        </group>
      );
    case "scale":
      return <Balance color={c} tilt={o.motion === "tilt"} />;
    case "flag":
      return (
        <group>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 10]} />
            <Mat color="#ddd" metal={0.6} rough={0.3} />
          </mesh>
          <mesh position={[0.28, 1.0, 0]} castShadow>
            <boxGeometry args={[0.55, 0.35, 0.02]} />
            <Mat color={c} />
          </mesh>
        </group>
      );
    case "tree":
      return (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 12]} />
            <Mat color={PALETTE.brown} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <sphereGeometry args={[0.42, 24, 16]} />
            <Mat color={c === PALETTE.cream ? PALETTE.green : c} rough={0.7} />
          </mesh>
        </group>
      );
    case "house":
      return (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.6, 0.7]} />
            <Mat color={c} />
          </mesh>
          <mesh position={[0, 0.82, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[0.65, 0.45, 4]} />
            <Mat color="#8a3b2b" />
          </mesh>
        </group>
      );
    case "building":
      return (
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 1.5, 0.6]} />
          <Mat color={c} rough={0.4} metal={0.2} />
        </mesh>
      );
    case "bottle":
    case "flask":
      return (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow>
            {o.shape === "flask" ? <coneGeometry args={[0.35, 0.6, 32, 1, true]} /> : <cylinderGeometry args={[0.22, 0.22, 0.6, 32]} />}
            <Mat color={c} glass rough={0.1} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.25, 16]} />
            <Mat color={c} glass rough={0.1} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[o.shape === "flask" ? 0.25 : 0.2, o.shape === "flask" ? 0.3 : 0.2, 0.3, 24]} />
            <Mat color={c} emissive={0.25} />
          </mesh>
        </group>
      );
    case "heart":
      return <Flat shape={heartShape} color={c} />;
    case "star":
      return <Flat shape={starShape} color={c} />;
    case "arrow":
      return (
        <group position={[0, 0.4, 0]}>
          <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.7, 16]} />
            <Mat color={c} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.35, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.32, 20]} />
            <Mat color={c} />
          </mesh>
        </group>
      );
    case "magnifier":
      return (
        <group position={[0, 0.6, 0]} rotation={[0, 0, 0.5]}>
          <mesh castShadow>
            <torusGeometry args={[0.3, 0.05, 12, 40]} />
            <Mat color={c} metal={0.4} rough={0.3} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.28, 32]} />
            <Mat color="#cfe8ff" glass />
          </mesh>
          <mesh position={[0, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.45, 12]} />
            <Mat color="#2a2f2a" />
          </mesh>
        </group>
      );
    case "target":
      return (
        <group>
          <mesh position={[0, 0.2, -0.12]} rotation={[0.25, 0, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.5, 10]} />
            <Mat color="#8a5a3b" />
          </mesh>
          <group position={[0, 0.58, 0]} rotation={[-0.12, 0, 0]}>
            {[0.5, 0.38, 0.26, 0.14].map((r, i) => (
              <mesh key={i} position={[0, 0, i * 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow={i === 0} receiveShadow>
                <cylinderGeometry args={[r, r, 0.1, 48]} />
                <Mat color={i % 2 ? "#f7f7f2" : c} rough={0.4} />
              </mesh>
            ))}
          </group>
        </group>
      );
    case "lock":
    case "key":
      return o.shape === "lock" ? (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.6, 0.5, 0.25]} />
            <Mat color={c} rough={0.35} metal={0.3} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <torusGeometry args={[0.2, 0.05, 12, 30, Math.PI]} />
            <Mat color="#c9cfd1" metal={0.8} rough={0.25} />
          </mesh>
        </group>
      ) : (
        <group position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <torusGeometry args={[0.16, 0.05, 12, 30]} />
            <Mat color={PALETTE.gold} metal={0.8} rough={0.25} />
          </mesh>
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[0.07, 0.55, 0.05]} />
            <Mat color={PALETTE.gold} metal={0.8} rough={0.25} />
          </mesh>
        </group>
      );
    case "lightbulb":
      return (
        <group>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.25, 20]} />
            <Mat color="#9aa39a" metal={0.6} rough={0.3} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.3, 28, 18]} />
            <Mat color={c === PALETTE.cream ? PALETTE.yellow : c} emissive={0.9} />
          </mesh>
        </group>
      );
    case "cell":
      return (
        <group position={[0, 0.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 20]} />
            <Mat color={c} glass />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.18, 24, 16]} />
            <Mat color="#8a5ad6" />
          </mesh>
        </group>
      );
    case "molecule":
      return (
        <group position={[0, 0.5, 0]}>
          {[
            [0, 0, 0, 0.2],
            [0.38, 0.2, 0, 0.13],
            [-0.36, 0.18, 0.1, 0.13],
            [0, -0.36, 0.15, 0.13],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[r, 20, 14]} />
              <Mat color={i ? "#f7f7f2" : c} rough={0.3} />
            </mesh>
          ))}
        </group>
      );
    case "cloud":
      return (
        <group position={[0, 0.5, 0]}>
          {[
            [0, 0, 0.32],
            [0.32, -0.05, 0.24],
            [-0.32, -0.05, 0.24],
            [0.12, 0.18, 0.22],
          ].map(([x, y, r], i) => (
            <mesh key={i} position={[x, y, 0]} castShadow>
              <sphereGeometry args={[r, 20, 14]} />
              <Mat color={c === PALETTE.cream ? "#ffffff" : c} rough={0.9} />
            </mesh>
          ))}
        </group>
      );
    case "sun":
      return (
        <group position={[0, 0.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.35, 28, 18]} />
            <Mat color={PALETTE.yellow} emissive={1} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[Math.cos((i * Math.PI) / 4) * 0.55, Math.sin((i * Math.PI) / 4) * 0.55, 0]} rotation={[0, 0, (i * Math.PI) / 4 - Math.PI / 2]}>
              <coneGeometry args={[0.06, 0.18, 10]} />
              <Mat color={PALETTE.yellow} emissive={1} />
            </mesh>
          ))}
        </group>
      );
    case "planet":
      return (
        <group position={[0, 0.55, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.4, 32, 20]} />
            <Mat color={c} rough={0.6} />
          </mesh>
          <mesh rotation={[1.2, 0, 0.3]}>
            <torusGeometry args={[0.6, 0.03, 8, 48]} />
            <Mat color="#e8dcb8" />
          </mesh>
        </group>
      );
    case "chart":
      return (
        <group>
          {[0.35, 0.6, 0.85, 1.15].map((h, i) => (
            <mesh key={i} position={[(i - 1.5) * 0.28, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.2, h, 0.2]} />
              <Mat color={i === 3 ? c : "#cfd6c4"} />
            </mesh>
          ))}
        </group>
      );
    default:
      // A shape from an older or newer kit than this player knows: a plain ball, so the object (and its label) still has a body.
      return (
        <mesh position={[0, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.4, 32, 20]} />
          <Mat color={c} rough={0.35} />
        </mesh>
      );
  }
}

const HEIGHT: Partial<Record<SceneObject["shape"], number>> = { crowd: 0.9, bowl: 0.6, pot: 0.85, spoon: 1.2, building: 1.55, flag: 1.2, tree: 1.25, mountain: 1, scale: 1.1, chart: 1.2, coins: 0.55, coin: 0.4, book: 0.25 };
/** Footprint width at size 1 (what a row of objects is packed by). */
const WIDTH: Partial<Record<SceneObject["shape"], number>> = { crowd: 2.1, bowl: 1.7, pot: 1.7, spoon: 0.9, mountain: 1.8, scale: 1.4, chart: 1.1, house: 1.0, flag: 0.85, person: 0.55, building: 0.65, bottle: 0.5, flask: 0.75, key: 0.7, coin: 0.7, coins: 0.7, arrow: 1.0, clock: 0.95, target: 1.05, book: 0.95, planet: 1.25, cloud: 1.15, sun: 1.25 };
export const shapeHeight = (o: SceneObject) => (HEIGHT[o.shape] ?? 1) * o.size;

function Hand({ length, speed }: { length: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = -s.clock.elapsedTime * speed;
  });
  return (
    <group ref={ref} position={[0, 0, 0.08]}>
      <mesh position={[0, length / 2, 0]}>
        <boxGeometry args={[0.03, length, 0.02]} />
        <Mat color="#111" />
      </mesh>
    </group>
  );
}

function Balance({ color, tilt }: { color: string; tilt: boolean }) {
  const beam = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (beam.current) beam.current.rotation.z = tilt ? Math.sin(s.clock.elapsedTime * 1.4) * 0.18 : 0;
  });
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1, 12]} />
        <Mat color="#c9cfd1" metal={0.7} rough={0.3} />
      </mesh>
      <group ref={beam} position={[0, 1.0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.3, 0.05, 0.06]} />
          <Mat color={color} metal={0.4} rough={0.3} />
        </mesh>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, -0.3, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.18, 0.06, 24]} />
            <Mat color={color} metal={0.4} rough={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Crowd({ color }: { color: string }) {
  const N = 8;
  const ref = useRef<THREE.InstancedMesh>(null);
  // The crowd never moves: place it once (it was rebuilt, with a new matrix, every frame).
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < N * N; i++) {
      m.makeTranslation(((i % N) - (N - 1) / 2) * 0.26, 0.2, (Math.floor(i / N) - (N - 1) / 2) * 0.26);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N * N]} castShadow>
      <capsuleGeometry args={[0.07, 0.2, 4, 10]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </instancedMesh>
  );
}

/** Where an object sits once the scene is laid out. */
export type Slot = { x: number; z: number; size: number; height: number };

/**
 * Lay a scene out tidily instead of trusting raw coordinates: the objects keep the writer's left-to-right order
 * but sit in one evenly spaced row (a slight arc), centred, at sizes that read together (the key object, the
 * accent one, a little bigger), and never overlapping.
 */
export function layoutScene(scene: SceneSpec): Slot[] {
  const objs = scene.objects;
  const order = objs.map((o, i) => ({ o, i })).sort((a, b) => a.o.x - b.o.x || a.i - b.i);
  const n = objs.length;
  const maxSize = n === 1 ? 1.9 : n === 2 ? 1.5 : n <= 4 ? 1.15 : 0.9;
  const sizes = order.map(({ o }) => {
    const key = o.color === "accent" || o.motion === "glow" || o.motion === "pulse";
    return Math.max(0.55, Math.min(maxSize, (o.size || 1) * (n === 1 ? 1.4 : 0.9))) * (key && n > 1 ? 1.12 : 1);
  });
  // Packed by real width with a small gap, like the demo's close groupings: spreading objects a fixed 2.3 apart
  // left the camera framing mostly empty floor, so every object came out small.
  const widths = order.map(({ o }, k) => (WIDTH[o.shape] ?? 0.9) * sizes[k]);
  const gap = 0.45;
  const span = widths.reduce((a, w) => a + w, 0) + gap * Math.max(0, n - 1);
  const slots: Slot[] = new Array(n);
  let left = -span / 2;
  order.forEach(({ o, i }, k) => {
    const x = left + widths[k] / 2;
    left += widths[k] + gap;
    const z = n > 2 ? -Math.abs(x) * 0.18 + 0.2 : 0;
    slots[i] = { x, z, size: sizes[k], height: (HEIGHT[o.shape] ?? 1) * sizes[k] };
  });
  return slots;
}

/** One object: pops in the first time it appears, then glides (position and size) when a later beat moves it. */
function Placed({ o, slot, i, accent }: { o: SceneObject; slot: Slot; i: number; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const cur = useRef({ x: slot.x, z: slot.z, size: slot.size });
  const color = o.color === "accent" ? accent : PALETTE[o.color] || PALETTE.cream;
  useFrame((s, dt) => {
    const g = ref.current;
    if (!g) return;
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const t = s.clock.elapsedTime, lt = t - t0.current - i * 0.1;
    const k = 1 - Math.pow(0.004, dt);
    cur.current.x += (slot.x - cur.current.x) * k;
    cur.current.z += (slot.z - cur.current.z) * k;
    cur.current.size += (slot.size - cur.current.size) * k;
    const appear = o.motion === "drop" ? 1 : back(lt / 0.5);
    let scale = cur.current.size * Math.max(0.0001, appear), y = 0, ry = -cur.current.x * 0.08, rz = 0, x = cur.current.x, z = cur.current.z;
    if (o.motion === "drop") y = Math.max(0, 2.4 * (1 - clamp(lt / 0.6)) ** 2);
    if (o.motion === "bob") y = Math.abs(Math.sin(t * 2.2 + i)) * 0.08 * cur.current.size;
    if (o.motion === "spin") ry += t * 0.7;
    if (o.motion === "pulse" || o.motion === "glow") scale *= 1 + Math.sin(t * 3.2) * 0.035;
    if (o.motion === "stir") {
      x += Math.cos(t * 1.4) * 0.18;
      z += Math.sin(t * 1.4) * 0.18;
    }
    if (o.motion === "tilt" && o.shape !== "scale") rz = Math.sin(t * 1.2) * 0.1;
    g.position.set(x, y, z);
    g.rotation.set(0, ry, rz);
    g.scale.setScalar(scale);
  });
  return (
    <group ref={ref} position={[slot.x, 0, slot.z]} scale={0.0001}>
      <Shape o={o} color={color} />
      {o.motion === "glow" && <pointLight position={[0, 1, 0.6]} intensity={2} distance={3} color={color} />}
    </group>
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
export function StoryObjects({ scene, accent, slots }: { scene: SceneSpec; accent: string; slots: Slot[] }) {
  const seen = new Map<string, number>();
  return (
    <>
      {scene.objects.map((o, i) => {
        const n = seen.get(o.shape) ?? 0;
        seen.set(o.shape, n + 1);
        // Not keyed by colour: recolouring an object to "accent" (the script's way to point at it) must glide, not re-pop.
        return <Placed key={`${o.shape}-${n}`} o={o} slot={slots[i]} i={i} accent={accent} />;
      })}
    </>
  );
}
