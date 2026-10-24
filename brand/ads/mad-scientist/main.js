
// ---------- the lab ----------
scene.background = new THREE.Color("#0b1411");
scene.fog = new THREE.FogExp2("#132219", 0.07);
scene.add(new THREE.HemisphereLight("#9fc2b0", "#1b241f", 0.5));
const key = new THREE.SpotLight("#ffe7c4", 30, 14, 0.7, 0.6, 1.4); key.position.set(-1.5, 4.2, 2.5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; scene.add(key, key.target);
const fill = new THREE.DirectionalLight("#b8d0ff", 0.5); fill.position.set(3, 2, 4); scene.add(fill);
const vatLight = new THREE.PointLight("#7dff9a", 6, 6, 1.6); vatLight.position.set(1.6, 1.2, -1.0); scene.add(vatLight);

const floorTex = tex(1024, 1024, (c, w, h) => { c.fillStyle = "#26302b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#141b17"; c.lineWidth = 6; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * w / 8, 0); c.lineTo(i * w / 8, h); c.stroke(); c.beginPath(); c.moveTo(0, i * h / 8); c.lineTo(w, i * h / 8); c.stroke(); } for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
const floor = mesh(new THREE.PlaneGeometry(16, 16), M("#ffffff", { map: floorTex, roughness: 0.55, metalness: 0.2 }), v3(0, 0, 0)); floor.rotation.x = -Math.PI / 2;
const wallTex = tex(1024, 512, (c, w, h) => { c.fillStyle = "#1f3a30"; c.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? "#1b342b" : "#21402f"; c.fillRect(i * w / 14, 0, w / 14 - 4, h); } c.fillStyle = "#2b2f2c"; c.fillRect(0, h * 0.78, w, h * 0.22); });
const wall = mesh(new THREE.PlaneGeometry(16, 6), M("#ffffff", { map: wallTex, roughness: 0.8 }), v3(0, 3, -3.2));
const sideWall = mesh(new THREE.PlaneGeometry(10, 6), M("#ffffff", { map: wallTex, roughness: 0.8 }), v3(-4.2, 3, 0)); sideWall.rotation.y = Math.PI / 2;
// pipes on the back wall
for (let i = 0; i < 3; i++) { const p = mesh(cyl(0.06, 0.06, 12, 14), brass, v3(0, 2.4 + i * 0.25, -3.1)); p.rotation.z = Math.PI / 2; }
// lockers
for (let i = 0; i < 4; i++) { const lk = mesh(new THREE.BoxGeometry(0.55, 1.9, 0.5), M("#5f6b66", { metalness: 0.6, roughness: 0.4 }), v3(-3.3 + i * 0.58, 0.95, -2.9)); mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), ink, v3(0, 0.6, 0.26), lk); mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), ink, v3(0, 0.5, 0.26), lk); }

// the vat: a round tank sunk in a brass rim, full of glowing green liquid
const vat = grp(scene, v3(1.7, 0, -1.0));
mesh(cyl(1.15, 1.2, 0.75, 48), M("#3b4a44", { metalness: 0.7, roughness: 0.35 }), v3(0, 0.375, 0), vat);
mesh(new THREE.TorusGeometry(1.15, 0.07, 12, 64), brass, v3(0, 0.76, 0), vat).rotation.x = Math.PI / 2;
const liquidTex = tex(512, 512, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, "#d6ffcf"); g.addColorStop(0.4, "#6fe08a"); g.addColorStop(1, "#1f7a45"); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 8; for (let r = 40; r < 256; r += 38) { c.beginPath(); c.arc(w / 2, h / 2, r, 0.3, 5.2); c.stroke(); } });
const liquid = mesh(new THREE.CircleGeometry(1.12, 64), new THREE.MeshBasicMaterial({ map: liquidTex, toneMapped: false }), v3(0, 0.7, 0), vat); liquid.rotation.x = -Math.PI / 2; liquid.castShadow = false;
[-1, 1].forEach((s) => { const g = mesh(cyl(0.07, 0.07, 1.4, 16), brass, v3(1.0 * s, 0.7, -0.6), vat); mesh(sph(0.12, 16), M("#c43b2b", { roughness: 0.4 }), v3(0, 0.75, 0), g); });

// the console: a slab with glowing buttons and dials
const con = grp(scene, v3(-1.25, 0, -0.6));
mesh(new THREE.BoxGeometry(1.5, 0.95, 0.75), M("#d7d2c4", { roughness: 0.5 }), v3(0, 0.475, 0), con);
const top = mesh(new THREE.BoxGeometry(1.55, 0.06, 0.8), M("#a8a294", { roughness: 0.5 }), v3(0, 0.98, 0), con);
const btnCols = ["#ff5a4a", "#ffd34a", "#6fe08a", "#5aa0ff", "#e59cff"];
const buttons = [];
for (let i = 0; i < 10; i++) { const b = mesh(cyl(0.045, 0.05, 0.04, 16), new THREE.MeshStandardMaterial({ color: btnCols[i % 5], emissive: btnCols[i % 5], emissiveIntensity: 0.6 }), v3(-0.55 + (i % 5) * 0.16, 1.03, 0.12 + Math.floor(i / 5) * 0.16), con); buttons.push(b); }
[-1, 1].forEach((s, i) => { const d = mesh(cyl(0.12, 0.12, 0.03, 24), M("#f2efe6"), v3(0.45 + i * 0.0, 0.7 + i * 0.0, 0.38), con); d.rotation.x = Math.PI / 2; d.position.x = 0.3 + i * 0.32; mesh(new THREE.BoxGeometry(0.01, 0.09, 0.01), ink, v3(0, 0.02, 0.04), d).rotation.z = 0.6 * s; });
const screen = mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ color: "#5cff8a", toneMapped: false }), v3(0.4, 1.05, -0.2), con); screen.rotation.x = -0.6;

// steam over the vat
const steamTex = tex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
const steam = Array.from({ length: 26 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: "#c9ffd6", transparent: true, depthWrite: false, opacity: 0.4 })); sp.userData = { a: rnd() * 6.28, r: rnd() * 0.9, ph: rnd() }; scene.add(sp); return sp; });
function steamAt(t, boost = 0) { steam.forEach((sp) => { const { a, r, ph } = sp.userData; const k = (t * (0.18 + boost * 0.3) + ph) % 1; sp.position.set(vat.position.x + Math.cos(a + t * 0.2) * r, 0.75 + k * (2.2 + boost * 1.5), vat.position.z + Math.sin(a + t * 0.2) * r); const s = 0.6 + k * (1.6 + boost); sp.scale.set(s, s, 1); sp.material.opacity = Math.sin(k * Math.PI) * (0.28 + boost * 0.4); }); }

// ---------- the student at her desk ----------
const stu = grp(scene, v3(-2.5, 0, 1.0)); stu.rotation.y = 0.75;
const desk = grp(stu, v3(0, 0, 0.45));
mesh(new THREE.BoxGeometry(1.1, 0.05, 0.6), M("#7a5636", { roughness: 0.6 }), v3(0, 0.75, 0), desk);
[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([x, z]) => mesh(cyl(0.025, 0.025, 0.75, 8), ink, v3(x, 0.375, z), desk));
const openBook = mesh(new THREE.BoxGeometry(0.55, 0.03, 0.38), M("#f4efe2"), v3(0, 0.79, 0.02), desk);
const hlTex = tex(512, 360, (c, w, h) => { c.fillStyle = "#f4efe2"; c.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { c.fillStyle = "#fff35a"; c.fillRect(20, 18 + i * 21, i % 3 === 2 ? 180 : 210, 13); c.fillRect(276, 18 + i * 21, i % 4 === 3 ? 150 : 215, 13); c.fillStyle = "#555"; c.fillRect(24, 22 + i * 21, i % 3 === 2 ? 170 : 200, 4); c.fillRect(280, 22 + i * 21, i % 4 === 3 ? 140 : 205, 4); } c.fillStyle = "#c9c2b0"; c.fillRect(w / 2 - 2, 0, 4, h); });
const page = mesh(new THREE.PlaneGeometry(0.54, 0.37), M("#ffffff", { map: hlTex }), v3(0, 0.806, 0.02), desk); page.rotation.x = -Math.PI / 2;
for (let i = 0; i < 6; i++) { const fc = mesh(new THREE.BoxGeometry(0.16, 0.012, 0.1), M(["#ffd6e0", "#d6f0ff", "#fff3b0"][i % 3]), v3(0.38, 0.785 + i * 0.012, -0.12), desk); fc.rotation.y = i * 0.15; }
const sweater = M("#e8e6e1", { roughness: 0.8 }), skin2 = M("#9a6648", { roughness: 0.55 }), hair2 = M("#1c1412", { roughness: 0.5 }), jeans = M("#4b6a9a", { roughness: 0.8 });
const stuBody = grp(stu, v3(0, 0, 0));
mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), ink, v3(0, 0.46, 0), stuBody);                 // stool seat
mesh(cyl(0.03, 0.03, 0.46, 8), ink, v3(0, 0.23, 0), stuBody);
mesh(cyl(0.14, 0.16, 0.5, 20), sweater, v3(0, 0.75, 0), stuBody, v3(1, 1, 0.8));
[-1, 1].forEach((s) => { const th = mesh(cyl(0.065, 0.06, 0.38, 12), jeans, v3(0.08 * s, 0.5, 0.18), stuBody); th.rotation.x = Math.PI / 2; mesh(cyl(0.055, 0.05, 0.42, 12), jeans, v3(0.08 * s, 0.27, 0.37), stuBody); });
const stuHead = grp(stuBody, v3(0, 1.13, 0.02));
mesh(sph(0.11, 32), skin2, v3(0, 0, 0), stuHead, v3(0.92, 1.1, 0.98));
mesh(sph(0.122, 32), hair2, v3(0, 0.03, -0.03), stuHead);
mesh(sph(0.1, 24), hair2, v3(0, -0.1, -0.08), stuHead, v3(1.1, 1.6, 0.7));
[-1, 1].forEach((s) => { mesh(sph(0.014, 10), ink, v3(0.04 * s, 0.0, 0.1), stuHead); });
const stuArm = grp(stuBody, v3(0.17, 0.95, 0));
mesh(cyl(0.045, 0.04, 0.5, 12), sweater, v3(0, -0.2, 0.12), stuArm).rotation.x = -1.0;
const hlPen = mesh(cyl(0.018, 0.018, 0.14, 10), M("#ffe600", { emissive: "#806f00", emissiveIntensity: 0.3 }), v3(0, -0.36, 0.42), stuArm);
[-1].forEach((s) => { const a = mesh(cyl(0.045, 0.04, 0.5, 12), sweater, v3(-0.17, 0.75, 0.12), stuBody); a.rotation.x = -1.0; });

// ---------- props ----------
const bookCover = tex(512, 700, (c, w, h) => { c.fillStyle = "#b8322a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2d36b"; c.fillRect(30, 30, w - 60, 6); c.fillRect(30, h - 36, w - 60, 6); c.font = "bold 70px DejaVu Sans"; c.textAlign = "center"; c.fillText("BIOLOGY", w / 2, 190); c.font = "bold 40px DejaVu Sans"; c.fillText("THE COMPLETE", w / 2, 110); c.font = "bold 150px DejaVu Sans"; c.fillText("400", w / 2, 430); c.font = "bold 52px DejaVu Sans"; c.fillText("PAGES", w / 2, 500); c.font = "28px DejaVu Sans"; c.fillText("12th edition", w / 2, 620); });
const pagesTex = tex(256, 64, (c, w, h) => { c.fillStyle = "#f2ecdc"; c.fillRect(0, 0, w, h); c.strokeStyle = "#c8bfa8"; for (let i = 0; i < h; i += 2) { c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
const coverM = M("#ffffff", { map: bookCover, roughness: 0.5 }), pagesM = M("#ffffff", { map: pagesTex, roughness: 0.8 }), redM = M("#b8322a", { roughness: 0.5 });
const book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.41, 0.11), [pagesM, redM, pagesM, pagesM, coverM, redM]); book.castShadow = true; scene.add(book);

const REELS = ["reel-1.jpg", "reel-2.jpg", "reel-3.jpg"].map((f) => { const t = new THREE.TextureLoader().load(f); t.colorSpace = THREE.SRGBColorSpace; return t; });
const phone = new THREE.Group(); scene.add(phone);
mesh(new THREE.BoxGeometry(0.2, 0.4, 0.02), M("#0b0b0d", { roughness: 0.25, metalness: 0.5 }), v3(0, 0, 0), phone);
const phoneScreen = mesh(new THREE.PlaneGeometry(0.186, 0.38), new THREE.MeshBasicMaterial({ map: REELS[0], toneMapped: false }), v3(0, 0, 0.011), phone); phoneScreen.castShadow = false;
const phoneGlow = new THREE.PointLight("#d3f05a", 0, 2, 2); phone.add(phoneGlow); phoneGlow.position.set(0, 0, 0.3);

// splash drops
const drops = Array.from({ length: 40 }, () => { const m = mesh(sph(0.03 + rnd() * 0.03, 8), new THREE.MeshBasicMaterial({ color: "#9dffb0", toneMapped: false }), v3(0, -9, 0)); m.castShadow = false; m.userData.d = v3(rnd() - 0.5, 1.2 + rnd() * 1.6, rnd() - 0.5); return m; });
const beam = mesh(cyl(0.35, 0.6, 4, 32, true), new THREE.MeshBasicMaterial({ color: "#e8ffd0", transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }), v3(1.7, 2.6, -1.0)); beam.castShadow = false;
const dust = Array.from({ length: 16 }, (_, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: "#d8d0c0", transparent: true, depthWrite: false, opacity: 0 })); sp.userData.a = i / 16 * 6.28; scene.add(sp); return sp; });

// diving helmet joins the suit: brass dome with a round glass port
const helmet = grp(sci.head, v3(0, 0.0, 0)); helmet.visible = false;
mesh(sph(0.21, 40), brass, v3(0, 0.0, -0.01), helmet);
mesh(new THREE.TorusGeometry(0.1, 0.022, 12, 32), brass, v3(0, 0.0, 0.2), helmet);
const port = mesh(new THREE.CircleGeometry(0.1, 32), new THREE.MeshPhysicalMaterial({ color: "#cfe9e2", transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1 }), v3(0, 0, 0.205), helmet); port.castShadow = false;
mesh(cyl(0.19, 0.23, 0.08, 32), brass, v3(0, -0.2, 0), helmet);
[-1, 1].forEach((s) => { const sp = mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 20), brass, v3(0.2 * s, 0, 0.04), helmet); sp.rotation.y = Math.PI / 2; });
// helmet comes down over the head (cut off below a neck ring, so remove the inner sphere clipping by scaling face away)

// ---------- posing ----------
function stand(t, talk, gest = 0) {
  const s = sci, b = Math.sin(t * 2.0);
  R(s.legR.hip, 0, 0, -0.04); R(s.legR.knee, 0.02, 0, 0); R(s.legL.hip, 0, 0, 0.04); R(s.legL.knee, 0.02, 0, 0);
  R(s.armL.sh, 0.05 + talk * 0.15, 0, 0.18 + b * 0.02); R(s.armL.el, -0.25 - talk * 0.5, 0, 0);
  R(s.armR.sh, 0.05, 0, -0.18); R(s.armR.el, -0.2, 0, 0);
  pose("face", t, talk);
  R(s.torso, 0.03 + b * 0.012, Math.sin(t * 0.6) * 0.05, 0); R(s.head, Math.sin(t * 1.7) * 0.03 - talk * 0.05, Math.sin(t * 0.9) * 0.08, Math.sin(t * 1.3) * 0.03 * talk);
}
const holdUp = () => { R(sci.armR.sh, -1.9, 0.3, -0.45); R(sci.armR.el, -0.9, 0, 0); };
const holdOut = () => { R(sci.armR.sh, -1.3, 0.1, -0.15); R(sci.armR.el, -0.5, 0, 0); };
const point = () => { R(sci.armL.sh, -1.55, -0.3, 0.1); R(sci.armL.el, 0, 0, 0); };
const lines = TL.lines, DUR = TL.dur, ENV = TL.env;
const lineAt = (t) => { let k = 0; for (let i = 0; i < lines.length; i++) if (t >= lines[i].s - 0.2) k = i; return k; };
const shotStart = (name) => lines.find((l) => l.shot === name).s - 0.2;
const shotEnd = (name) => { const i = lines.map((l) => l.shot).lastIndexOf(name); return lines[i + 1] ? lines[i + 1].s - 0.2 : DUR; };
const talkAt = (t) => { const L = lines[lineAt(t)]; if (!L.text || t < L.s || t > L.e) return 0; return ENV[Math.min(ENV.length - 1, Math.floor(t * 30))] || 0; };
const wp = (o, off = v3(0, 0, 0)) => o.localToWorld(off.clone());
function cam(pos, look, fov) { camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; camera.updateProjectionMatrix(); }
function armorK(k) { armor.forEach((a, i) => { const kk = clamp(k * 1.6 - (i % 7) * 0.08); a.m.visible = kk > 0; a.m.position.copy(a.home).addScaledVector(a.from, (1 - outBack(kk)) * 1.0); a.m.rotation.set(a.rot.x + (1 - kk) * 3, a.rot.y + (1 - kk) * 2, a.rot.z); }); const hk = clamp((k - 0.55) / 0.45); helmet.visible = hk > 0; helmet.position.y = (1 - ease(hk)) * 0.9; }
const shake = (t, k) => v3(Math.sin(t * 61) * k, Math.cos(t * 47) * k, 0);
const HOME = v3(0.1, 0.91, 0.3);

const ov = document.getElementById("ov");
window.renderAt = (t) => {
  const li = lineAt(t), L = lines[li], shot = L.shot, talk = talkAt(t), st = shotStart(shot), se = shotEnd(shot), u = clamp((t - st) / (se - st)), lt = t - st;
  sci.root.position.copy(HOME); sci.root.rotation.set(0, 0, 0); stand(t, talk);
  armorK(0); jets.forEach((j) => (j.visible = false)); jetLight.intensity = 0;
  book.visible = true; phone.visible = false; beam.material.opacity = 0; phoneGlow.intensity = 0;
  drops.forEach((d) => d.position.set(0, -9, 0)); dust.forEach((d) => (d.material.opacity = 0));
  let boost = 0; vatLight.intensity = 6 + Math.sin(t * 3) * 0.8;
  const inHand = () => { scene.updateMatrixWorld(true); const g = wp(sci.armR.grip, v3(0, -0.05, 0.12)); book.position.copy(g); book.quaternion.copy(sci.armR.grip.getWorldQuaternion(new THREE.Quaternion())); book.rotateX(-Math.PI / 2 + 0.2); };
  const onConsole = () => { book.position.set(-1.15, 1.09, -0.45); book.rotation.set(-Math.PI / 2, 0, 0.25); };
  stu.visible = true;
  buttons.forEach((b, i) => (b.material.emissiveIntensity = 0.4 + 0.5 * (Math.sin(t * 4 + i * 1.3) > 0.6 ? 1 : 0)));
  stuArm.rotation.set(0, Math.sin(t * 7) * 0.12, 0); stuHead.rotation.set(0.35, 0, 0);

  let faceBook = false, facePhone = false;
  if (shot === "hook") {
    R(sci.armR.sh, -1.0, 0.1, -0.45); R(sci.armR.el, -1.0, 0.2, 0); inHand(); faceBook = true; sci.root.rotation.y = -0.1;
    const hp = wp(sci.head); cam(v3(hp.x + 0.15, hp.y - 0.12, hp.z + 2.05 - u * 0.3), v3(hp.x - 0.22, hp.y - 0.22, hp.z), 46);
  } else if (shot === "drop") {
    sci.root.position.set(-0.75, 0.91, 0.25); sci.root.rotation.y = -0.5;
    const k = clamp(lt / 0.35);
    if (k < 1) { R(sci.armR.sh, mix(-2.4, -0.9, ease(k)), 0.3, -0.3); R(sci.armR.el, -0.6, 0, 0); inHand(); }
    else { R(sci.armR.sh, -0.8, 0.2, -0.25); R(sci.armR.el, -0.4, 0, 0); onConsole(); const d = lt - 0.35; dust.forEach((sp) => { const a = sp.userData.a; sp.position.set(-1.15 + Math.cos(a) * (0.2 + d * 0.8), 1.08 + d * 0.15, -0.45 + Math.sin(a) * (0.2 + d * 0.6)); const s = 0.25 + d * 0.6; sp.scale.set(s, s, 1); sp.material.opacity = clamp(0.6 - d * 0.6); }); }
    const sh = lt > 0.35 && lt < 0.7 ? shake(t, 0.03 * (1 - (lt - 0.35) / 0.35)) : v3(0, 0, 0);
    cam(v3(0.6, 1.55, 2.9).add(sh), v3(-0.7, 1.05, -0.3), 46);
  } else if (shot === "student") {
    sci.root.position.set(-0.75, 0.91, 0.25); sci.root.rotation.y = -1.6 + 0.3; onConsole(); point();
    stuHead.rotation.set(0.45 + Math.sin(t * 2) * 0.05, Math.sin(t * 1.3) * 0.1, 0);
    cam(v3(-1.0 - u * 0.2, 1.35, 2.6), v3(-2.3, 0.85, 1.35), 44);
  } else if (shot === "eyes") {
    sci.root.position.set(-0.75, 0.91, 0.25); onConsole();
    pose("face", t, talk * 0.35); const hp = wp(sci.head, v3(0, 0.03, 0.1)); cam(v3(hp.x, hp.y + 0.01, hp.z + 0.36 - u * 0.08), hp, 40);
  } else if (shot === "vat") {
    sci.root.position.set(0.35, 0.91, 0.05); sci.root.rotation.y = 0.9; holdOut(); inHand();
    boost = 0.2;
    cam(v3(0.7 + u * 0.15, 1.5, 2.7 - u * 0.2), v3(0.95, 1.15, -0.45), 48);
  } else if (shot === "suit") {
    sci.root.position.set(0.35, 0.91, 0.05); sci.root.rotation.y = 0.4; R(sci.armR.sh, -0.7, 0.1, -0.3); R(sci.armR.el, -0.6, 0, 0); inHand();
    const k = clamp((lt - 0.4) / 1.6); armorK(k); boost = 0.6 * Math.sin(clamp(lt / 2.4) * Math.PI);
    const sh = k > 0.05 && k < 0.95 ? shake(t, 0.008) : v3(0, 0, 0);
    cam(v3(0.6 + Math.sin(u * 1.2) * 0.8, 1.2, 2.6 - u * 0.4).add(sh), v3(0.35, 1.25, 0.05), 44);
  } else if (shot === "dunk") {
    sci.root.position.set(0.35, 0.91, 0.05); sci.root.rotation.y = 0.9; armorK(1); holdOut();
    const rel = 0.5;
    if (lt < rel) inHand();
    else { scene.updateMatrixWorld(true); const g0 = wp(sci.armR.grip, v3(0, -0.05, 0.12)); const d = lt - rel; book.position.set(mix(g0.x, 1.5, clamp(d / 0.6)), g0.y - 4.9 * d * d, mix(g0.z, -0.8, clamp(d / 0.6))); book.rotation.set(d * 3, d * 1.5, d * 2); if (book.position.y < 0.7) book.visible = false; }
    const sp = lt - (rel + 0.48);
    if (sp > 0) { drops.forEach((m) => { const dd = m.userData.d; m.position.set(1.5 + dd.x * sp * 1.5, 0.72 + dd.y * sp - 4.9 * sp * sp, -0.8 + dd.z * sp * 1.5); if (m.position.y < 0.7) m.position.y = -9; }); vatLight.intensity = 6 + 18 * Math.exp(-sp * 3); boost = 1.2 * Math.exp(-sp * 1.2); }
    cam(v3(1.0, 1.75, 2.8), v3(1.15, 0.95, -0.55), 50);
  } else if (shot === "reveal") {
    sci.root.position.set(0.35, 0.91, 0.05); sci.root.rotation.y = 0.9; armorK(1); book.visible = false;
    const rise = clamp(lt / 1.4);
    phone.visible = true; beam.material.opacity = 0.18 * Math.sin(clamp(lt / 3) * Math.PI); phoneGlow.intensity = 3;
    phone.position.set(1.6, 0.75 + ease(rise) * 1.0, -0.85); phone.rotation.set(0, -0.6 + (1 - rise) * 6, 0);
    phoneScreen.material.map = REELS[Math.floor(lt / 1.15) % 3];
    vatLight.intensity = 10; boost = 0.5;
    if (lt < 2.2) cam(v3(2.6, 1.4, 1.2), v3(1.6, 1.4, -0.85), 44);
    else { const p = wp(phone); const k2 = ease((lt - 2.2) / 0.6); cam(v3(mix(2.6, p.x + 0.25, k2), mix(1.4, p.y + 0.02, k2), mix(1.2, p.z + 0.7, k2)), p, mix(44, 36, k2)); }
    facePhone = true;
  } else if (shot === "offer") {
    sci.root.position.set(0.35, 0.91, 0.6); sci.root.rotation.y = 0; armorK(1); book.visible = false; holdOut();
    phone.visible = true; phoneGlow.intensity = 2; scene.updateMatrixWorld(true);
    phone.position.copy(wp(sci.armR.grip, v3(0, -0.02, 0.06))); phone.quaternion.identity(); phone.rotation.set(0, 0.15, 0);
    phoneScreen.material.map = REELS[Math.floor(t / 1.15) % 3];
    helmet.visible = false; const hp = wp(sci.head); cam(v3(hp.x - 0.15, hp.y - 0.2, hp.z + 1.75 - u * 0.25), v3(hp.x - 0.15, hp.y - 0.25, hp.z), 44); facePhone = true;
  } else if (shot === "cta") {
    sci.root.position.set(0.35, 0.91, 0.6); armorK(1); book.visible = false; point(); holdOut();
    R(sci.armL.sh, -1.5, 0.15, 0.05);
    phone.visible = true; scene.updateMatrixWorld(true); phone.position.copy(wp(sci.armR.grip, v3(0, -0.02, 0.06))); phone.rotation.set(0, 0.15, 0); phoneScreen.material.map = REELS[Math.floor(t / 1.15) % 3];
    helmet.visible = false; cam(v3(0.4, 1.35, 3.3 - u * 0.4), v3(0.35, 1.2, 0.6), 44); facePhone = true;
  } else {
    sci.root.position.set(0.35, 0.91, 0.6); armorK(1); book.visible = false; phone.visible = true; scene.updateMatrixWorld(true); phone.position.copy(wp(sci.armR.grip, v3(0, -0.02, 0.06))); phone.rotation.set(0, 0.15, 0);
    helmet.visible = false; cam(v3(0.4, 1.35, 2.9), v3(0.35, 1.2, 0.6), 44);
  }
  if (faceBook) { book.lookAt(camera.position); book.rotateY(0.25); }
  if (facePhone && phone.visible) { phone.lookAt(camera.position); phone.rotateZ(-0.05); }
  steamAt(t, boost);
  scene.updateMatrixWorld(true);
  renderer.render(scene, camera);

  // overlay
  let h = "";
  if (L.text && t >= L.s - 0.1 && t <= L.e + 0.25) {
    const words = L.text.split(" ");
    h += `<div style="position:absolute;left:60px;right:60px;top:830px;text-align:center;font:700 46px/1.12 'Ins';color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke fill;text-shadow:0 3px 10px rgba(0,0,0,.7)">${L.text}</div>`;
  }
  if (shot === "offer" && lt > 0.3) { const k = outBack((lt - 0.3) / 0.4); h += `<div style="position:absolute;left:50%;top:120px;transform:translateX(-50%) rotate(-6deg) scale(${k});background:#d3f05a;color:#0f1d18;font:700 44px 'Unb';padding:14px 26px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.5)">1ST REEL FREE</div>`; }
  if (shot === "end") { const k = clamp(lt / 0.4); h += `<div style="position:absolute;inset:0;background:rgba(15,29,24,${0.92 * k})"></div><img src="lockup-horizontal.svg" style="position:absolute;left:130px;width:460px;top:${500 - (1 - k) * 20}px;opacity:${k}"><div style="position:absolute;left:0;right:0;top:640px;text-align:center;font:600 30px 'Ins';color:#b9c7b5;opacity:${clamp((lt - 0.4) / 0.4)}">Turn any document into study reels.</div><div style="position:absolute;left:50%;top:720px;transform:translateX(-50%);opacity:${clamp((lt - 0.8) / 0.4)};background:#d3f05a;color:#0f1d18;font:600 30px 'Ins';padding:18px 34px;border-radius:40px;white-space:nowrap">Try it free · unspool.cc</div>`; }
  h += `<div style="position:absolute;right:24px;top:${shot === "end" ? -100 : 1180}px;font:600 22px 'Ins';color:rgba(255,255,255,.7);text-shadow:0 1px 3px #000">@unspoolcc</div>`;
  if (t < 0.25) h += `<div style="position:absolute;inset:0;background:#000;opacity:${1 - t / 0.25}"></div>`;
  ov.innerHTML = h;
};
window.DUR = DUR;
Promise.all([document.fonts.load("700 40px Unb"), document.fonts.load("600 20px Ins")]).then(() => { window.renderAt(0); setTimeout(() => (window.ready = true), 500); });
