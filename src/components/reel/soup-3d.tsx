"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// The soup hook as a real 3D scene: a lathed bowl on a gridded floor, a wobbling soup surface, a spoon
// that dips in and lifts out, steam rising, a pinch of salt near the end. The camera slowly orbits.

const BUTTER = "#f2d36b";

function Bowl({ accent, pulse }: { accent: string; pulse: number }) {
  const group = useRef<THREE.Group>(null);
  const soup = useRef<THREE.Mesh>(null);
  const hit = useRef({ pulse, t: 99 });
  const profile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * (Math.PI / 2);
      pts.push(new THREE.Vector2(0.35 + Math.sin(a) * 1.25, -Math.cos(a) * 0.95 + 0.95));
    }
    pts.push(new THREE.Vector2(1.66, 0.97), new THREE.Vector2(1.66, 1.02));
    return pts;
  }, []);
  const soupGeo = useMemo(() => new THREE.CircleGeometry(1.48, 48, 0, Math.PI * 2), []);
  const base = useRef<Float32Array | null>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (pulse !== hit.current.pulse) hit.current = { pulse, t: 0 };
    hit.current.t += dt;
    const k = Math.exp(-hit.current.t * 6) * Math.sin(hit.current.t * 30);
    if (group.current) group.current.scale.setScalar(1 + k * 0.08);
    const geo = soup.current?.geometry;
    if (!geo) return;
    const pos = geo.attributes.position;
    base.current ??= Float32Array.from(pos.array);
    const b = base.current;
    for (let i = 0; i < pos.count; i++) {
      const x = b[i * 3], y = b[i * 3 + 1];
      const r = Math.hypot(x, y);
      pos.setZ(i, Math.sin(r * 5 - t * 3) * 0.035 + k * 0.08 * Math.cos(r * 4));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[profile, 64]} />
        <meshStandardMaterial color={accent} roughness={0.35} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.12, 40]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh ref={soup} geometry={soupGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.78, 0]} receiveShadow>
        <meshStandardMaterial color={BUTTER} roughness={0.25} metalness={0.05} />
      </mesh>
    </group>
  );
}

function Spoon({ accent }: { accent: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime % 4;
    // 0-1 lower in, 1-1.6 stir, 1.6-2.6 lift out, rest hold
    const dip = t < 1 ? t : t < 1.6 ? 1 : t < 2.6 ? 1 - (t - 1.6) : 0;
    if (!ref.current) return;
    ref.current.position.set(0.7, 2.3 - dip * 1.3, 0.2);
    ref.current.rotation.set(0, state.clock.elapsedTime * 0.3, -0.55 + (t > 1 && t < 1.6 ? Math.sin(t * 20) * 0.1 : 0));
  });
  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.9, 12]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh castShadow scale={[0.32, 0.12, 0.42]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Steam() {
  const puffs = useRef<THREE.Mesh[]>([]);
  const seeds = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: ((i * 37) % 10) / 10 - 0.5, z: ((i * 53) % 10) / 10 - 0.5, o: i / 14 })), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      const m = puffs.current[i];
      if (!m) return;
      const p = (t * 0.35 + s.o) % 1;
      m.position.set(s.x + Math.sin(t * 2 + i) * 0.12 * p, 1 + p * 2.2, s.z);
      m.scale.setScalar(0.1 + p * 0.28);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.sin(p * Math.PI) * 0.28;
    });
  });
  return (
    <>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(m) => void (m && (puffs.current[i] = m))}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#ffffff" transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function Salt({ on }: { on: boolean }) {
  const grains = useRef<THREE.Mesh[]>([]);
  const start = useRef<number | null>(null);
  const seeds = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ x: ((i * 29) % 20) / 20 - 0.5, z: ((i * 41) % 20) / 20 - 0.5, d: (i % 8) * 0.05 })), []);
  useFrame((state) => {
    if (!on) return void (start.current = null);
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    seeds.forEach((s, i) => {
      const g = grains.current[i];
      if (!g) return;
      const k = Math.max(0, t - s.d);
      const y = 3.4 - 4.9 * k * k;
      g.visible = y > 0.8;
      g.position.set(s.x * 0.6, y, s.z * 0.6);
      g.rotation.set(k * 6, k * 4, 0);
    });
  });
  return (
    <>
      {seeds.map((_, i) => (
        <mesh key={i} visible={false} ref={(m) => void (m && (grains.current[i] = m))} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
}

function Rig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.35;
    state.camera.position.set(Math.sin(t) * 6.6, 4 + Math.sin(t * 0.7) * 0.4, Math.cos(t) * 6.6);
    state.camera.lookAt(0, 1.1, 0);
  });
  return null;
}

export default function Soup3D({ accent, pulse, salt }: { accent: string; pulse: number; salt: boolean }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 36, position: [0, 3.4, 5.2] }} gl={{ antialias: true, alpha: true }} style={{ width: "100%", height: "100%" }}>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#ffffff", "#0b1a12", 0.6]} />
      <directionalLight position={[3, 6, 2]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 2, -2]} intensity={6} color={accent} />
      <Rig />
      <Bowl accent={accent} pulse={pulse} />
      <Spoon accent={accent} />
      <Steam />
      <Salt on={salt} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <circleGeometry args={[6, 48]} />
        <shadowMaterial opacity={0.45} />
      </mesh>
      <gridHelper args={[12, 24, accent, accent]} position={[0, -0.07, 0]} material-transparent material-opacity={0.25} />
    </Canvas>
  );
}
