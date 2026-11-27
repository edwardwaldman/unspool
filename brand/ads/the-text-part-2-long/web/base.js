import * as THREE from "./three/three.module.js";
const DUR = 98.7; window.DUR = DUR;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const outBack = (x) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
await document.fonts.load("40px Arc");

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: true, preserveDrawingBuffer: true });
renderer.setSize(720, 1280, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(42, 720 / 1280, 0.1, 300);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
const box = (w, h, d, mat, x, y, z, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = { c, g }; return t; };
const lights = (scene, warm = false) => { scene.add(new THREE.HemisphereLight("#ffffff", warm ? "#b08a6a" : "#8090a8", 1.5)); const d = new THREE.DirectionalLight(warm ? "#ffe2b8" : "#ffffff", 2.2); d.position.set(4, 9, 7); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); Object.assign(d.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(d); };

// ---------------- faces (drawn on a canvas, swapped per beat) ----------------
const FACE = {};
const drawFace = (name) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, w, h);
  g.lineCap = "round"; g.strokeStyle = "#1a1210"; g.fillStyle = "#1a1210";
  const eye = (x, y, r = 14, open = 1) => { g.save(); g.beginPath(); g.ellipse(x, y, r, r * 1.25 * open, 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(x - 4, y - 6 * open, 4.5, 0, 7); g.fill(); g.restore(); };
  const brow = (x, y, a) => { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 20, y + a); g.lineTo(x + 20, y - a); g.stroke(); };
  const tears = () => { g.fillStyle = "#5ab8ff"; for (const x of [78, 178]) { g.beginPath(); g.moveTo(x, 132); g.quadraticCurveTo(x - 12, 175, x, 200); g.quadraticCurveTo(x + 12, 175, x, 132); g.fill(); } g.fillStyle = "#1a1210"; };
  const sweat = () => { g.fillStyle = "#7ccfff"; g.beginPath(); g.moveTo(214, 40); g.quadraticCurveTo(196, 80, 214, 92); g.quadraticCurveTo(232, 80, 214, 40); g.fill(); g.fillStyle = "#1a1210"; };
  const blush = () => { g.fillStyle = "rgba(240,110,110,.35)"; g.beginPath(); g.ellipse(62, 150, 22, 12, 0, 0, 7); g.ellipse(194, 150, 22, 12, 0, 0, 7); g.fill(); g.fillStyle = "#1a1210"; };
  switch (name) {
    case "happy": eye(88, 110); eye(168, 110); brow(88, 70, 0); brow(168, 70, 0); g.lineWidth = 9; g.beginPath(); g.arc(128, 150, 34, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); blush(); break;
    case "grin": g.lineWidth = 9; for (const x of [88, 168]) { g.beginPath(); g.arc(x, 116, 18, Math.PI, 0); g.stroke(); } g.beginPath(); g.moveTo(84, 150); g.quadraticCurveTo(128, 214, 172, 150); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.fillRect(96, 150, 64, 12); blush(); break;
    case "shock": g.fillStyle = "#fff"; g.lineWidth = 6; for (const x of [88, 168]) { g.beginPath(); g.arc(x, 108, 26, 0, 7); g.fill(); g.stroke(); } g.fillStyle = "#1a1210"; eye(88, 110, 9); eye(168, 110, 9); brow(88, 58, -6); brow(168, 58, 6); g.beginPath(); g.ellipse(128, 176, 18, 26, 0, 0, 7); g.fill(); sweat(); break;
    case "cry": g.lineWidth = 9; for (const x of [88, 168]) { g.beginPath(); g.moveTo(x - 22, 104); g.quadraticCurveTo(x, 122, x + 22, 104); g.stroke(); } brow(88, 72, 8); brow(168, 72, -8); g.beginPath(); g.moveTo(80, 184); g.quadraticCurveTo(128, 136, 176, 184); g.closePath(); g.fill(); tears(); break;
    case "worried": eye(88, 112, 13); eye(168, 112, 13); brow(88, 74, 9); brow(168, 74, -9); g.lineWidth = 8; g.beginPath(); g.moveTo(96, 178); g.quadraticCurveTo(112, 164, 128, 178); g.quadraticCurveTo(144, 192, 160, 178); g.stroke(); sweat(); break;
    case "angry": eye(88, 116, 12); eye(168, 116, 12); brow(88, 80, -10); brow(168, 80, 10); g.lineWidth = 9; g.beginPath(); g.moveTo(92, 182); g.quadraticCurveTo(128, 160, 164, 182); g.stroke(); break;
    case "smug": g.lineWidth = 9; for (const x of [88, 168]) { g.beginPath(); g.moveTo(x - 20, 112); g.lineTo(x + 20, 112); g.stroke(); } eye(88, 120, 10, 0.7); eye(168, 120, 10, 0.7); g.beginPath(); g.moveTo(98, 170); g.quadraticCurveTo(140, 186, 164, 160); g.stroke(); break;
    case "whisper": eye(88, 112, 11); eye(168, 112, 11); brow(88, 76, 4); brow(168, 76, -4); g.beginPath(); g.ellipse(150, 176, 10, 8, 0, 0, 7); g.fill(); break;
    default: eye(88, 110); eye(168, 110); brow(88, 72, 0); brow(168, 72, 0); g.lineWidth = 9; g.beginPath(); g.moveTo(104, 172); g.lineTo(152, 172); g.stroke();
  } });
for (const n of ["neutral", "happy", "grin", "shock", "cry", "worried", "angry", "smug", "whisper"]) FACE[n] = drawFace(n);
// a deadpan "determined" face for the hero (flat brows angled in, flat mouth)
FACE.determined = drawFace("angry");
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------- blocky characters (toy-figure proportions) ----------------
function blockyOld({ skin = "#f1c9a0", shirt = "#ffffff", pants = "#24345c", hair = "#5a3a22", style = "short", cap = null, partyHat = null, topHat = false, sash = null, tie = null, apron = null, mustache = false, scale = 1 } = {}) {
  const g = new THREE.Group(), mSkin = M(skin), mShirt = M(shirt), mPants = M(pants), mHair = M(hair, { roughness: 0.6 });
  const hip = new THREE.Group(); hip.position.y = 1.1; g.add(hip);
  const legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.26, 0, 0); hip.add(p); box(0.5, 1.1, 0.56, mPants, 0, -0.55, 0, p); box(0.52, 0.16, 0.64, M("#2a2a2a"), 0, -1.05, 0.04, p); return p; });
  const torso = box(1.2, 1.2, 0.66, mShirt, 0, 1.7, 0, g);
  if (tie) box(0.18, 0.75, 0.03, M(tie), 0, 1.8, 0.34, g);
  if (apron) box(0.9, 1.0, 0.04, M(apron), 0, 1.45, 0.35, g);
  if (sash) { const s = box(0.22, 1.5, 0.04, M(sash), 0, 1.7, 0.35, g); s.rotation.z = 0.7; }
  const arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.82, 2.2, 0); g.add(p); box(0.42, 0.5, 0.5, mShirt, 0, -0.2, 0, p); box(0.4, 0.7, 0.46, mSkin, 0, -0.75, 0, p); return p; });
  const head = new THREE.Group(); head.position.y = 2.84; g.add(head);
  const hd = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.95, 0.95), mSkin); hd.position.y = 0.42; hd.castShadow = true; head.add(hd);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), new THREE.MeshBasicMaterial({ map: FACE.neutral, transparent: true })); face.position.set(0, 0.4, 0.478); head.add(face);
  if (style === "short") { box(1.06, 0.3, 1.0, mHair, 0, 0.95, -0.02, head); box(1.06, 0.6, 0.18, mHair, 0, 0.65, -0.44, head); [-1, 1].forEach((s) => box(0.1, 0.45, 0.85, mHair, s * 0.53, 0.72, -0.06, head)); }
  if (style === "spiky") { for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 4), mHair); c.position.set(-0.42 + i * 0.14, 1.02, -0.1 + (i % 2) * 0.18); c.rotation.z = (i - 3) * 0.15; head.add(c); } box(1.06, 0.2, 1.0, mHair, 0, 0.9, -0.02, head); }
  if (style === "curly") { for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), mHair); s.position.set(-0.36 + (i % 3) * 0.36, 0.98, -0.32 + Math.floor(i / 3) * 0.3); head.add(s); } }
  if (style === "bun") { box(1.06, 0.3, 1.0, mHair, 0, 0.95, -0.02, head); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mHair); b.position.set(0, 1.25, -0.15); head.add(b); }
  if (style === "white") { const mw = M("#eeeeee"); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), mw); s.position.set(-0.3 + (i % 3) * 0.3, 1.0, -0.2 + Math.floor(i / 3) * 0.3); head.add(s); } }
  if (cap) { const mc = M(cap); box(1.1, 0.34, 1.04, mc, 0, 1.02, -0.02, head); box(1.0, 0.07, 0.5, mc, 0, 0.86, 0.68, head); box(0.16, 0.12, 0.16, mc, 0, 1.24, 0, head); }
  if (partyHat) { const ph = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 16), M(partyHat)); ph.position.set(0.05, 1.3, 0); ph.rotation.z = -0.12; head.add(ph); const pom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M("#ffffff")); pom.position.set(0.1, 1.72, 0); head.add(pom); }
  if (topHat) { const mt = M("#1b1d2a", { roughness: 0.4 }); const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.06, 20), mt); brim.position.y = 0.92; head.add(brim); const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.8, 20), mt); crown.position.y = 1.32; head.add(crown); box(0.94, 0.12, 0.94, M("#7a2bd6"), 0, 1.0, 0, head).visible = false; }
  if (mustache) box(0.5, 0.1, 0.04, M("#3a2416"), 0, 0.2, 0.49, head);
  g.scale.setScalar(scale);
  const P = { g, head, face, arms, legs, hip, torso };
  P.setFace = (n) => { face.material.map = FACE[n] || FACE.neutral; };
  P.pose = ({ la = [0, 0.06], ra = [0, -0.06], headTilt = 0, headTurn = 0, ll = 0, rl = 0 } = {}) => {
    arms[0].rotation.set(la[0], 0, la[1]); arms[1].rotation.set(ra[0], 0, ra[1]); legs[0].rotation.x = ll; legs[1].rotation.x = rl; head.rotation.set(0, headTurn, headTilt); };
  P.dance = (t, k = 1, ph = 0) => { const s = Math.sin(t * 9 + ph); P.pose({ la: [-2.6 - s * 0.35 * k, 0.4], ra: [-2.6 + s * 0.35 * k, -0.4], headTilt: s * 0.12 * k }); g.position.y = Math.abs(Math.sin(t * 9 + ph)) * 0.25 * k; };
  P.pose(); return P;
}
const clockTex = canvasTex(256, 256, () => {});
function drawClock(sec, red = false) { const { g } = clockTex.userData; g.clearRect(0, 0, 256, 256); g.fillStyle = red ? "#e6402e" : "#2bb673"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(128, 128, 100, 0, 7); g.fill();
  g.strokeStyle = "#222"; g.lineWidth = 6; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(128 + Math.sin(a) * 84, 128 - Math.cos(a) * 84); g.lineTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); g.stroke(); }
  const a = sec / 60 * Math.PI * 2; g.lineWidth = 8; g.strokeStyle = "#e6402e"; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * 82, 128 - Math.cos(a) * 82); g.stroke(); g.fillStyle = "#222"; g.beginPath(); g.arc(128, 128, 10, 0, 7); g.fill(); clockTex.needsUpdate = true; }
const makeClock = (parent, x, y, z, s = 1) => { const c = new THREE.Group(); c.position.set(x, y, z); c.scale.setScalar(s); parent.add(c); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.24, 28), M("#e6402e")); body.rotation.x = Math.PI / 2; c.add(body);
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.46, 28), new THREE.MeshBasicMaterial({ map: clockTex })); f.position.z = 0.125; c.add(f); for (const s2 of [-1, 1]) { const bell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8, 0, 7, 0, Math.PI / 2), M("#e6402e")); bell.position.set(s2 * 0.3, 0.48, 0); bell.rotation.z = -s2 * 0.5; c.add(bell); } return c; };
const mkScene = (bg) => { const s = new THREE.Scene(); s.background = new THREE.Color(bg); return s; };
