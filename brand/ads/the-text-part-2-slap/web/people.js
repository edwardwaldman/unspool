
// ---------------- rounded people (the look of the reference videos) ----------------
// Egg-shaped heads with the face painted onto the sphere, big eyes with whites and highlights, brows, a small nose and ears,
// capsule bodies, round hands and shoes. Same interface as the old cube people: { g, head, face, arms, legs, hip, torso,
// setFace, pose }, so every shot keeps working. arms[i].children[0] = sleeve, [1] = forearm; legs[i].children[0] = trouser leg.
const FACECACHE = {};
const drawExpr = (g, kind, iris) => {
  g.lineCap = "round"; g.lineJoin = "round";
  const eye = (x, y, { r = 21, open = 1, look = 0, tear = false } = {}) => {
    g.save(); g.beginPath(); g.ellipse(x, y, r, r * 1.18 * open, 0, 0, 7); g.fillStyle = "#fbfaf6"; g.fill(); g.clip();
    g.fillStyle = iris; g.beginPath(); g.arc(x + look, y + 2, r * 0.62, 0, 7); g.fill(); g.fillStyle = "#120a06"; g.beginPath(); g.arc(x + look, y + 2, r * 0.32, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x + look - r * 0.25, y - r * 0.3, r * 0.2, 0, 7); g.fill(); g.restore();
    g.strokeStyle = "#2a1a12"; g.lineWidth = 3.5; g.beginPath(); g.ellipse(x, y, r + 1, r * 1.18 * open + 1, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    if (tear) { g.fillStyle = "rgba(120,190,255,.9)"; g.beginPath(); g.moveTo(x - 4, y + r); g.quadraticCurveTo(x - 14, y + r + 34, x - 4, y + r + 52); g.quadraticCurveTo(x + 6, y + r + 34, x - 4, y + r); g.fill(); } };
  const lid = (x, y, r = 21) => { g.strokeStyle = "#2a1a12"; g.lineWidth = 6; g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + 10, x + r, y); g.stroke(); };
  const brow = (x, y, tilt, arch = 0) => { g.strokeStyle = "#3a2216"; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 24, y + tilt); g.quadraticCurveTo(x, y - 8 - arch, x + 24, y - tilt); g.stroke(); };
  const mouth = (k) => { g.strokeStyle = "#5a2a1e"; g.fillStyle = "#6a2020"; g.lineWidth = 6;
    if (k === "smile") { g.beginPath(); g.moveTo(98, 182); g.quadraticCurveTo(128, 204, 158, 182); g.stroke(); }
    else if (k === "grin") { g.beginPath(); g.moveTo(92, 178); g.quadraticCurveTo(128, 226, 164, 178); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.fillRect(100, 179, 56, 10); }
    else if (k === "o") { g.beginPath(); g.ellipse(128, 192, 13, 18, 0, 0, 7); g.fill(); }
    else if (k === "sad") { g.beginPath(); g.moveTo(102, 196); g.quadraticCurveTo(128, 178, 154, 196); g.stroke(); }
    else if (k === "cry") { g.beginPath(); g.moveTo(98, 200); g.quadraticCurveTo(128, 168, 158, 200); g.closePath(); g.fill(); }
    else if (k === "smirk") { g.beginPath(); g.moveTo(104, 188); g.quadraticCurveTo(136, 196, 158, 176); g.stroke(); }
    else if (k === "wavy") { g.beginPath(); g.moveTo(102, 190); g.quadraticCurveTo(115, 180, 128, 190); g.quadraticCurveTo(141, 200, 154, 190); g.stroke(); }
    else if (k === "small") { g.beginPath(); g.ellipse(146, 190, 8, 6, 0, 0, 7); g.fill(); }
    else { g.beginPath(); g.moveTo(108, 190); g.lineTo(148, 190); g.stroke(); } };
  const blush = () => { g.fillStyle = "rgba(235,110,100,.22)"; g.beginPath(); g.ellipse(70, 160, 20, 11, 0, 0, 7); g.ellipse(186, 160, 20, 11, 0, 0, 7); g.fill(); };
  const sweat = () => { g.fillStyle = "rgba(124,207,255,.95)"; g.beginPath(); g.moveTo(206, 52); g.quadraticCurveTo(192, 86, 206, 96); g.quadraticCurveTo(220, 86, 206, 52); g.fill(); };
  switch (kind) {
    case "happy": eye(90, 116); eye(166, 116); brow(90, 78, 0, 4); brow(166, 78, 0, 4); mouth("smile"); blush(); break;
    case "grin": lid(90, 118); lid(166, 118); brow(90, 82, 0, 6); brow(166, 82, 0, 6); mouth("grin"); blush(); break;
    case "shock": eye(90, 112, { r: 25, open: 1.1 }); eye(166, 112, { r: 25, open: 1.1 }); brow(90, 64, -2, 10); brow(166, 64, -2, 10); mouth("o"); sweat(); break;
    case "cry": eye(90, 118, { open: 0.75, tear: true }); eye(166, 118, { open: 0.75, tear: true }); brow(90, 84, 8); brow(166, 84, -8); mouth("cry"); break;
    case "worried": eye(90, 118); eye(166, 118); brow(90, 82, 9); brow(166, 82, -9); mouth("wavy"); sweat(); break;
    case "angry": eye(90, 120, { open: 0.8 }); eye(166, 120, { open: 0.8 }); brow(90, 92, -10); brow(166, 92, 10); mouth("sad"); break;
    case "determined": eye(90, 120, { open: 0.8 }); eye(166, 120, { open: 0.8 }); brow(90, 92, -6); brow(166, 92, 6); mouth(); break;
    case "smug": eye(90, 120, { open: 0.55, look: 5 }); eye(166, 120, { open: 0.55, look: 5 }); brow(90, 90, 0); brow(166, 84, 0, 6); mouth("smirk"); break;
    case "whisper": eye(90, 118, { look: 6 }); eye(166, 118, { look: 6 }); brow(90, 84, 4); brow(166, 84, -4); mouth("small"); break;
    default: eye(90, 118); eye(166, 118); brow(90, 82, 0); brow(166, 82, 0); mouth();
  } };
const faceTex = (skin, kind, iris = "#4a2e1a") => { const key = skin + kind + iris; if (FACECACHE[key]) return FACECACHE[key];
  return (FACECACHE[key] = canvasTex(1024, 512, (g) => { g.fillStyle = skin; g.fillRect(0, 0, 1024, 512); g.save(); g.translate(256 - 118, 256 - 112); g.scale(236 / 256, 236 / 256); drawExpr(g, kind, iris); g.restore(); })); };

function blocky({ skin = "#f1c9a0", shirt = "#ffffff", pants = "#24345c", hair = "#5a3a22", style = "short", scale = 1, nose = true, glasses = false, shoes = "#2a2a2a", iris = "#4a2e1a" } = {}) {
  const g = new THREE.Group(), mSkin = M(skin, { roughness: 0.6 }), mShirt = M(shirt, { roughness: 0.75 }), mPants = M(pants, { roughness: 0.8 }), mHair = M(hair, { roughness: 0.7 });
  const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const hip = new THREE.Group(); hip.position.y = 1.1; g.add(hip);
  const legs = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.27, 0, 0); hip.add(p);
    mesh(new THREE.CapsuleGeometry(0.24, 0.62, 6, 14), mPants, 0, -0.5, 0, p); const sh = mesh(new THREE.SphereGeometry(0.26, 16, 12), M(shoes, { roughness: 0.4 }), 0, -1.0, 0.1, p); sh.scale.set(1, 0.55, 1.5); return p; });
  mesh(new THREE.CapsuleGeometry(0.34, 0.2, 6, 14), mPants, 0, 1.12, 0, g).scale.set(1.5, 0.8, 0.95);
  const torso = mesh(new THREE.CapsuleGeometry(0.5, 0.42, 8, 18), mShirt, 0, 1.74, 0, g); torso.scale.set(1.12, 0.9, 0.68);
  mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.3, 16), mSkin, 0, 2.47, 0, g);
  const arms = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 0.7, 2.24, 0); g.add(p);
    mesh(new THREE.CapsuleGeometry(0.19, 0.38, 6, 12), mShirt, 0, -0.26, 0, p); mesh(new THREE.CapsuleGeometry(0.15, 0.4, 6, 12), mSkin, 0, -0.76, 0, p); mesh(new THREE.SphereGeometry(0.19, 14, 10), mSkin, 0, -1.12, 0.02, p); return p; });
  const head = new THREE.Group(); head.position.y = 2.74; g.add(head);
  const hd = mesh(new THREE.SphereGeometry(0.6, 48, 32), new THREE.MeshStandardMaterial({ map: faceTex(skin, "neutral", iris), roughness: 0.6 }), 0, 0.45, 0, head); hd.scale.set(0.92, 1.0, 0.95);
  if (nose) { const n = mesh(new THREE.SphereGeometry(0.085, 14, 10), mSkin, 0, 0.36, 0.565, head); n.scale.set(1, 1.25, 1.1); }
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.12, 12, 10), mSkin, s * 0.54, 0.42, 0, head); e.scale.set(0.45, 1, 0.8); }
  const cap = (r = 0.625, tilt = -0.3, cover = 0.4) => { const c = mesh(new THREE.SphereGeometry(r, 36, 20, 0, Math.PI * 2, 0, Math.PI * cover), mHair, 0, 0.45, 0, head); c.scale.set(0.95, 1, 0.98); c.rotation.x = tilt; return c; };
  if (style === "short") cap();
  if (style === "spiky") { cap(); for (let i = 0; i < 9; i++) { const c = mesh(new THREE.ConeGeometry(0.13, 0.32, 6), mHair, -0.4 + (i % 5) * 0.2, 1.0 - (i > 4 ? 0.04 : 0), (i > 4 ? -0.18 : 0.05), head); c.rotation.set(i > 4 ? -0.5 : 0.2, 0, (i % 5 - 2) * 0.22); } }
  if (style === "curly" || style === "white") { const mh = style === "white" ? M("#eeeeee") : mHair; cap(0.62); for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, rr = i % 2 ? 0.42 : 0.26; mesh(new THREE.SphereGeometry(0.15, 10, 8), mh, Math.cos(a) * rr, 0.98 + (i % 2 ? -0.06 : 0.04), Math.sin(a) * rr - 0.1, head); } }
  if (style === "bun") { cap(); mesh(new THREE.SphereGeometry(0.24, 16, 12), mHair, 0, 1.0, -0.42, head); }
  if (style === "long") { cap(0.635, -0.5, 0.5); const b = mesh(new THREE.CapsuleGeometry(0.42, 0.7, 8, 16), mHair, 0, 0.05, -0.3, head); b.scale.set(1.35, 1, 0.55);
    for (const s of [-1, 1]) { const st = mesh(new THREE.CapsuleGeometry(0.13, 0.75, 6, 10), mHair, s * 0.5, 0.08, 0.1, head); st.rotation.z = -s * 0.08; } }
  if (glasses) { const mg = M("#1d1d22", { roughness: 0.3 }); for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(0.115, 0.018, 8, 24), mg, s * 0.2, 0.47, 0.545, head); r.rotation.y = s * 0.22; } mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), mg, 0, 0.5, 0.585, head); }
  g.scale.setScalar(scale);
  const P = { g, head, face: hd, arms, legs, hip, torso };
  P.setFace = (n) => { hd.material.map = faceTex(skin, FACEALIAS[n] || n, iris); };
  P.pose = ({ la = [0, 0.06], ra = [0, -0.06], headTilt = 0, headTurn = 0, ll = 0, rl = 0 } = {}) => {
    arms[0].rotation.set(la[0], 0, la[1]); arms[1].rotation.set(ra[0], 0, ra[1]); legs[0].rotation.x = ll; legs[1].rotation.x = rl; head.rotation.set(head.rotation.x, headTurn, headTilt); };
  P.pose(); return P;
}
const FACEALIAS = {};
