// A small toy world for the "Life of a textbook" ad: soft-lit diorama sets and chunky toy people,
// in the style of the toy-car story reels (Blender-look: rounded shapes, warm sun, deep shadows).
import * as THREE from "three";
export { THREE };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), mix = (a, b, x) => a + (b - a) * x;
export const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const outBack = (x) => { x = clamp(x); const k = 1.7; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function tex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t; }
export const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
export function mesh(g, m, p, parent, shadow = true) { const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = shadow; if (p) x.position.copy(p); if (parent) parent.add(x); return x; }
export function grp(parent, p) { const g = new THREE.Group(); if (p) g.position.copy(p); if (parent) parent.add(g); return g; }
const rbox = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2); return g; };

// ---------- a sky with a sun glow ----------
export const skyTex = (top, bottom, glow) => tex(8, 512, (c, w, h) => { const l = c.createLinearGradient(0, 0, 0, h); l.addColorStop(0, top); l.addColorStop(1, bottom); c.fillStyle = l; c.fillRect(0, 0, w, h); if (glow) { const g = c.createRadialGradient(w / 2, h * 0.75, 0, w / 2, h * 0.75, h * 0.4); g.addColorStop(0, glow); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); } });

export function sunLight(scene, { color = "#fff1d6", intensity = 3, pos = v3(-6, 10, 6), size = 9, hemi = ["#eaf4ff", "#8a7a62", 1.0] } = {}) {
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], hemi[2]));
  const s = new THREE.DirectionalLight(color, intensity); s.position.copy(pos); s.castShadow = true; s.shadow.mapSize.set(1024, 1024);
  Object.assign(s.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: 60 }); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; scene.add(s); scene.add(s.target); return s;
}

// ---------- the toy person ----------
export function toy({ skin = "#c98f68", hair = "#2b1d16", top = "#7c4ad6", pants = "#3d5a9e", shoes = "#f4f4f4", style = "pony", smile = true } = {}) {
  const g = new THREE.Group();
  const mSkin = M(skin, { roughness: 0.5 }), mTop = M(top, { roughness: 0.85 }), mPants = M(pants, { roughness: 0.8 }), mShoe = M(shoes, { roughness: 0.5 }), mHair = M(hair, { roughness: 0.7 });
  const mDark = new THREE.MeshStandardMaterial({ color: "#1a1410", roughness: 0.3 });
  const legs = [-1, 1].map((s) => { const l = grp(g, v3(s * 0.21, 1.02, 0)); mesh(new THREE.CapsuleGeometry(0.18, 0.42, 6, 18), mPants, v3(0, -0.3, 0), l);
    const sh = grp(l, v3(0, -0.62, 0)); mesh(new THREE.CapsuleGeometry(0.16, 0.36, 6, 18), mPants, v3(0, -0.22, 0), sh);
    const shoe = mesh(rbox(0.3, 0.17, 0.46), mShoe, v3(0, -0.47, 0.07), sh); return { l, sh, shoe }; });
  const body = grp(g, v3(0, 0, 0));
  mesh(new THREE.CapsuleGeometry(0.42, 0.5, 8, 24), mTop, v3(0, 1.45, 0), body).scale.set(1, 1, 0.78);
  mesh(new THREE.TorusGeometry(0.26, 0.09, 10, 24), mTop, v3(0, 1.96, -0.04), body).rotation.x = Math.PI / 2;      // hood collar
  mesh(new THREE.BoxGeometry(0.4, 0.16, 0.06), M(new THREE.Color(top).multiplyScalar(0.8), { roughness: 0.9 }), v3(0, 1.28, 0.33), body); // pocket
  const head = grp(body, v3(0, 2.38, 0));
  mesh(new THREE.SphereGeometry(0.5, 40, 24), mSkin, v3(0, 0, 0), head);
  // hair: a cap pulled back off the forehead, plus the back and sides (never over the eyes)
  const hairCap = mesh(new THREE.SphereGeometry(0.535, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), mHair, v3(0, 0.03, -0.02), head); hairCap.rotation.x = -0.3;
  mesh(new THREE.SphereGeometry(0.525, 40, 20, Math.PI * 0.92, Math.PI * 1.16, Math.PI * 0.2, Math.PI * 0.5), mHair, v3(0, 0, -0.02), head);
  if (style === "pony") { mesh(new THREE.SphereGeometry(0.17, 20, 12), mHair, v3(0, 0.22, -0.52), head); const p = mesh(new THREE.CapsuleGeometry(0.12, 0.4, 6, 14), mHair, v3(0, -0.12, -0.66), head); p.rotation.x = 0.35; }
  if (style === "bun") mesh(new THREE.SphereGeometry(0.22, 20, 12), mHair, v3(0, 0.5, -0.2), head);
  if (style === "short") hairCap.scale.set(1.02, 0.9, 1.02);
  [-1, 1].forEach((s) => { const e = mesh(new THREE.SphereGeometry(0.058, 16, 10), mDark, v3(s * 0.17, 0.02, 0.46), head, false); e.scale.set(1, 1.25, 0.6);
    const hl = mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: "#fff" }), v3(s * 0.17 + 0.02, 0.05, 0.495), head, false);
    const ck = mesh(new THREE.CircleGeometry(0.07, 18), new THREE.MeshBasicMaterial({ color: "#f08a8a", transparent: true, opacity: 0.45 }), v3(s * 0.27, -0.12, 0.43), head, false); ck.lookAt(head.localToWorld(v3(s * 0.6, -0.25, 2))); });
  const mouth = mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 18, Math.PI), mDark, v3(0, -0.14, 0.47), head, false); mouth.rotation.z = smile ? Math.PI : 0;
  const arms = [-1, 1].map((s) => { const a = grp(body, v3(s * 0.52, 1.82, 0)); mesh(new THREE.SphereGeometry(0.17, 18, 12), mTop, v3(0, 0, 0), a);
    mesh(new THREE.CapsuleGeometry(0.14, 0.36, 6, 16), mTop, v3(0, -0.28, 0), a);
    const fo = grp(a, v3(0, -0.56, 0)); mesh(new THREE.CapsuleGeometry(0.13, 0.32, 6, 16), mTop, v3(0, -0.22, 0), fo);
    const hand = mesh(new THREE.SphereGeometry(0.14, 18, 12), mSkin, v3(0, -0.48, 0), fo); hand.scale.set(0.9, 1.1, 0.8); return { a, fo, hand, s }; });
  g.traverse((o) => { if (o.isMesh && o.castShadow !== false) { o.castShadow = true; o.receiveShadow = true; } });
  const P = { g, body, head, arms, legs, mouth };
  P.pose = (name, k = 0) => posePerson(P, name, k);
  P.pose("stand");
  return P;
}
function posePerson(P, name, k) {
  const [L, R] = P.arms, [LL, RL] = P.legs;
  const set = (o, x = 0, y = 0, z = 0) => o.rotation.set(x, y, z);
  set(P.body); P.body.position.set(0, 0, 0); set(P.head); P.legs.forEach((l) => { set(l.l); set(l.sh); });
  set(L.a, 0, 0, -0.12); set(R.a, 0, 0, 0.12); set(L.fo); set(R.fo);
  if (name === "hold") { set(L.a, -0.9, 0, -0.25); set(R.a, -0.9, 0, 0.25); set(L.fo, -0.6, 0, 0.5); set(R.fo, -0.6, 0, -0.5); }   // a book held at the chest
  if (name === "phone") { set(L.a, -0.5, 0, -0.1); set(R.a, -0.9, 0, 0.35); set(L.fo, -1.0, 0, 0.2); set(R.fo, -1.0, 0, -0.6); set(P.head, 0.35, 0, 0); }
  if (name === "sit" || name === "sitphone" || name === "sitdesk" || name === "sitsad") {
    P.legs.forEach((l) => { set(l.l, -Math.PI / 2 + 0.05); set(l.sh, Math.PI / 2 - 0.05); });
    if (name === "sitphone") { set(L.a, -0.7, 0, -0.1); set(R.a, -0.9, 0, 0.3); set(L.fo, -1.1, 0, 0.3); set(R.fo, -1.0, 0, -0.6); set(P.head, 0.45, 0, 0); }
    if (name === "sitdesk") { set(L.a, -1.1, 0, -0.2); set(R.a, -1.1, 0, 0.2); set(L.fo, -0.7, 0, 0.4); set(R.fo, -0.7, 0, -0.4); set(P.head, 0.25 + 0.05 * Math.sin(k * 6), 0, 0); }
    if (name === "sitsad") { set(L.a, -1.2, 0, -0.3); set(R.a, -1.2, 0, 0.3); set(L.fo, -1.6, 0, 0.6); set(R.fo, -1.6, 0, -0.6); set(P.head, 0.55, 0, 0); P.body.rotation.x = 0.25; }
  }
  if (name === "cheer") { set(L.a, 0, 0, -2.6 - 0.2 * Math.sin(k * 10)); set(R.a, 0, 0, 2.6 + 0.2 * Math.sin(k * 10)); set(L.fo, 0, 0, -0.3); set(R.fo, 0, 0, 0.3); }
  if (name === "walk") { const s = Math.sin(k * 7); set(LL.l, s * 0.5); set(RL.l, -s * 0.5); set(LL.sh, Math.max(0, -s) * 0.6); set(RL.sh, Math.max(0, s) * 0.6); set(L.a, -s * 0.5, 0, -0.12); set(R.a, s * 0.5, 0, 0.12); P.body.position.y = Math.abs(Math.cos(k * 7)) * 0.05; }
  if (name === "facepalm") { set(R.a, -2.3, 0, 0.5); set(R.fo, -1.4, 0, -0.4); set(P.head, 0.3, 0, 0); set(L.a, 0, 0, -0.12); }
}

// ---------- props ----------
export function coverTex(title = "BIOLOGY", sub = "", col = "#1f8a70") {
  return tex(512, 680, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(0,0,0,.2)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = "#d3f05a"; c.lineWidth = 10; for (let i = 0; i < 2; i++) { c.beginPath(); for (let x = 60; x <= 450; x += 4) { const y = 360 + Math.sin((x - 60) / 50 + i * Math.PI) * 70; x === 60 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.strokeStyle = "#ffffff"; }
    c.fillStyle = "#ffffff"; for (let x = 80; x < 440; x += 34) { const a = 360 + Math.sin((x - 60) / 50) * 70, b = 360 + Math.sin((x - 60) / 50 + Math.PI) * 70; c.fillRect(x - 2, Math.min(a, b), 4, Math.abs(a - b)); }
    c.fillStyle = "#fff"; c.font = "bold 74px Unb, sans-serif"; c.textAlign = "center"; c.fillText(title, w / 2, 140); c.font = "600 30px Ins, sans-serif"; c.fillText(sub, w / 2, 600); });
}
export function pageTex(lines = 18, opts = {}) {
  return tex(512, 680, (c, w, h) => { c.fillStyle = opts.bg ?? "#fbf8ef"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2f3a"; c.font = "bold 30px Ins, sans-serif"; c.fillText(opts.title ?? "Chapter 4", 40, 64);
    for (let i = 0; i < lines; i++) { const y = 110 + i * 31, len = [400, 380, 410, 300, 395, 360, 405, 250][i % 8]; c.fillStyle = "#9aa1ad"; c.fillRect(40, y, len, 9); } });
}
export function book(parent, { title = "BIOLOGY", col = "#1f8a70", w = 1.5, h = 2.0, d = 0.42 } = {}) {
  const side = M("#f6f1e2", { roughness: 0.9, map: tex(64, 64, (c) => { c.fillStyle = "#f6f1e2"; c.fillRect(0, 0, 64, 64); c.fillStyle = "#ddd5bf"; for (let y = 0; y < 64; y += 3) c.fillRect(0, y, 64, 1); }) });
  const cover = M("#ffffff", { map: coverTex(title, "Twelfth edition", col), roughness: 0.45 }), plain = M(col, { roughness: 0.5 });
  const b = mesh(new THREE.BoxGeometry(w, d, h), [side, plain, cover, plain, side, side], null, parent); return b;
}
export function phone(parent, screenTex) {
  const g = grp(parent);
  mesh(new THREE.BoxGeometry(0.62, 1.24, 0.07), M("#16181d", { roughness: 0.3, metalness: 0.4 }), v3(0, 0, 0), g);
  const scr = mesh(new THREE.PlaneGeometry(0.56, 1.18), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), v3(0, 0, 0.037), g, false);
  g.userData.screen = scr; return g;
}
export function tree(parent, p, s = 1, col = "#4f9a4a") {
  const t = grp(parent, p); t.scale.setScalar(s);
  mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 12), M("#7a5236"), v3(0, 0.8, 0), t);
  [[0, 2.1, 0, 0.9], [0.5, 1.8, 0.2, 0.65], [-0.45, 1.85, -0.1, 0.7], [0.1, 2.6, 0, 0.6]].forEach(([x, y, z, r]) => mesh(new THREE.SphereGeometry(r, 20, 14), M(col, { roughness: 0.9 }), v3(x, y, z), t));
  return t;
}
export function bunting(parent, a, b, n = 14) {
  const cols = ["#e5484d", "#f2c14e", "#2f7de1", "#1f9d55", "#7c4ad6", "#ff8b6c"];
  for (let i = 0; i <= n; i++) { const u = i / n, p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * 0.6;
    const f = mesh(new THREE.ConeGeometry(0.16, 0.36, 3), M(cols[i % cols.length], { side: THREE.DoubleSide }), p, parent); f.rotation.x = Math.PI; f.position.y -= 0.16; }
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => { const u = i / 11, p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * 0.6; return p; }));
  mesh(new THREE.TubeGeometry(curve, 40, 0.012, 6), M("#333"), null, parent, false);
}
