import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// The 3D kit's building blocks, in one consistent look: soft-edged, matte-plastic toys (as in the hand-made demo
// reels), never raw primitives. Geometries and materials are made once per page and shared by every scene and
// every object that uses them, so a beat change or a reel swipe never rebuilds (or leaks) GPU buffers: a
// shared geometry or material is only uploaded once per canvas, and freed with the canvas's context.

const geos = new Map<string, THREE.BufferGeometry>();
const mats = new Map<string, THREE.Material>();
const texs = new Map<string, THREE.Texture>();

function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geos.get(key) as T | undefined;
  if (!g) {
    g = make();
    g.computeBoundingBox();
    geos.set(key, g);
  }
  return g;
}

/** A box with rounded edges and corners. */
export const rbox = (w: number, h: number, d: number, r = 0.08) => cached(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)));

/** A cylinder with rounded top and bottom edges, standing on y = 0 (its base) up to y = h. Optional taper (top radius). */
export const rcyl = (r: number, h: number, bevel = 0.06, top = r, seg = 48) =>
  cached(`rc${r}|${h}|${bevel}|${top}|${seg}`, () => {
    const b = Math.min(bevel, r * 0.5, top * 0.5, h * 0.5);
    const p: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2);
      p.push(new THREE.Vector2(r - b + Math.cos(a) * b, b + Math.sin(a) * b));
    }
    for (let i = 0; i <= 5; i++) {
      const a = (i / 5) * (Math.PI / 2);
      p.push(new THREE.Vector2(top - b + Math.cos(a) * b, h - b + Math.sin(a) * b));
    }
    p.push(new THREE.Vector2(0, h));
    return new THREE.LatheGeometry(p, seg);
  });

/** A surface of revolution from a profile of [radius, y] points. */
export const lathe = (key: string, pts: [number, number][], seg = 48) => cached(`la${key}|${seg}`, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg));
export const sphere = (r: number, w = 32, h = 20) => cached(`sp${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
export const torus = (R: number, t: number, arc = Math.PI * 2, rs = 14, ts = 48) => cached(`to${R}|${t}|${arc}|${rs}|${ts}`, () => new THREE.TorusGeometry(R, t, rs, ts, arc));
export const capsule = (r: number, len: number) => cached(`ca${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 8, 20));
export const cone = (r: number, h: number, seg = 40) => cached(`co${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const cyl = (r: number, h: number, seg = 24, top = r, open = false) => cached(`cy${r}|${h}|${seg}|${top}|${open}`, () => new THREE.CylinderGeometry(top, r, h, seg, 1, open));
/** A wedge of a sphere (for two-tone striped balls). */
export const wedge = (r: number, start: number, len: number) => cached(`we${r}|${start}|${len}`, () => new THREE.SphereGeometry(r, 12, 24, start, len));
/** A unit box standing on y = 0 (the invisible stand-in the camera frames an object by). */
export const unitBox = () => cached("unitbox", () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
export const plane = (w: number, h: number) => cached(`pl${w}|${h}`, () => new THREE.PlaneGeometry(w, h));
export const disc = (r: number, seg = 48) => cached(`di${r}|${seg}`, () => new THREE.CircleGeometry(r, seg));
export const ring = (r0: number, r1: number) => cached(`ri${r0}|${r1}`, () => new THREE.RingGeometry(r0, r1, 64, 1));

/** A flat shape pushed out into a soft, bevelled slab (heart, star, arrow, card), centred on the origin. */
export const slab = (key: string, shape: () => THREE.Shape, depth: number, bevel = 0.05) =>
  cached(`sl${key}|${depth}|${bevel}`, () => {
    const g = new THREE.ExtrudeGeometry(shape(), { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: 24 });
    g.center();
    g.computeVertexNormals();
    return g;
  });

export function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(w / 2, h / 2 - r);
  s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h / 2);
  s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w / 2, -h / 2 + r);
  s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export type Finish = "plastic" | "matte" | "metal" | "glass" | "glow" | "ink" | "screen" | "cloth" | "facet";

/**
 * The kit's materials. One finish everywhere (soft matte plastic with a faint satin coat), so objects from
 * different beats read as one designed set; metal, glass and glow are the only exceptions.
 */
export function mat(color: string, finish: Finish = "plastic"): THREE.Material {
  const key = `${color}|${finish}`;
  let m = mats.get(key);
  if (m) return m;
  const c = new THREE.Color(color);
  switch (finish) {
    case "metal":
      m = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.3 });
      break;
    case "glass":
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
      break;
    case "glow":
      m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.85, roughness: 0.4 });
      break;
    case "screen":
      m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.25 });
      break;
    case "ink":
      m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
      break;
    case "cloth":
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.7, sheen: 0.5, sheenRoughness: 0.7, sheenColor: new THREE.Color("#ffffff"), side: THREE.DoubleSide });
      break;
    case "facet":
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.6, clearcoat: 0.15, flatShading: true });
      break;
    case "matte":
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.78, clearcoat: 0.05, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color("#ffffff") });
      break;
    default:
      m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.52, clearcoat: 0.3, clearcoatRoughness: 0.45, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") });
  }
  mats.set(key, m);
  return m;
}

/** The same hue, lighter (+) or darker (-): the second and third tones of an object. */
export function tone(color: string, dl: number, ds = 0) {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, THREE.MathUtils.clamp(hsl.s + ds, 0, 1), THREE.MathUtils.clamp(hsl.l + dl, 0.03, 0.97));
  return `#${c.getHexString()}`;
}

/** A soft round shadow (radial falloff) to lay under an object: the blurred contact shadow the demo has. */
export function blobTexture() {
  let t = texs.get("blob");
  if (!t) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,1)");
    grd.addColorStop(0.35, "rgba(0,0,0,.7)");
    grd.addColorStop(0.7, "rgba(0,0,0,.2)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    texs.set("blob", t);
  }
  return t;
}

let blobMat: THREE.MeshBasicMaterial | null = null;
export function contactMaterial() {
  if (!blobMat) blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.55, toneMapped: false });
  return blobMat;
}

/** Easing: a quick rise with one small overshoot that settles (pop-ins). */
export function popEase(x: number) {
  x = Math.min(1, Math.max(0, x));
  if (x >= 1) return 1;
  // Damped spring: overshoots ~8%, settles by x = 1.
  return 1 - Math.exp(-5 * x) * Math.cos(x * Math.PI * 1.9) * (1 - x * 0.15) * (1 - x) ** 0.35;
}
