const lerpV = (a, b, k) => a.clone().lerp(b, k);
const cam = (p, l, fov = 40) => { camera.position.copy(p); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(l); };
const drift = (k, p0, p1, l0, l1, fov = 40) => cam(lerpV(p0, p1, ease(k)), lerpV(l0, l1, ease(k)), fov);
const hood = (P, c) => { box(1.12, 0.42, 0.5, M(c), 0, 2.42, -0.36, P.g); box(0.16, 0.5, 0.04, M("#ffffff"), -0.2, 1.95, 0.34, P.g); box(0.16, 0.5, 0.04, M("#ffffff"), 0.2, 1.95, 0.34, P.g); };
const sit = (P, on) => { P.legs.forEach((l) => (l.rotation.x = on ? -1.45 : 0)); P.g.position.y = on ? -0.42 : 0; };

// ---------- the three characters ----------
const YOU = blocky({ shirt: "#2f6fd6", pants: "#2a2f3a", hair: "#4a2c1a", style: "short" }); hood(YOU, "#2a62c0");
const JAKE = blocky({ shirt: "#d6453a", pants: "#30323a", hair: "#151515", style: "spiky", skin: "#e2b08a" }); hood(JAKE, "#bd3b31");
const MS = blocky({ shirt: "#3f7d5a", pants: "#3b3b4a", hair: "#6b4a2a", style: "bun", skin: "#d9a27a", glasses: true });
const put = (P, scene, x, z, ry = 0) => { scene.add(P.g); P.g.position.x = x; P.g.position.z = z; P.g.rotation.y = ry; };

// ---------- classroom ----------
const cls = mkScene("#d9dfe3"); lights(cls, true);
box(40, 0.1, 40, M("#b98a5e"), 0, -0.05, 0, cls); box(40, 14, 0.2, M("#ece4cf"), 0, 7, -6, cls); box(0.2, 14, 40, M("#e3dac2"), -9, 7, 0, cls);
for (const z of [-2, 3]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.4), new THREE.MeshBasicMaterial({ color: "#bfe6ff" })); w.position.set(-8.88, 5.2, z); w.rotation.y = Math.PI / 2; cls.add(w); }
const boardTex = canvasTex(1024, 360, () => {});
const drawBoard = (txt) => { const { g } = boardTex.userData; g.fillStyle = "#24493a"; g.fillRect(0, 0, 1024, 360); g.strokeStyle = "#8a6a3a"; g.lineWidth = 22; g.strokeRect(0, 0, 1024, 360);
  g.fillStyle = "#f4f4ea"; g.font = "800 66px Arc"; g.textAlign = "center"; txt.split("\n").forEach((l, i) => g.fillText(l, 512, 110 + i * 100)); boardTex.needsUpdate = true; };
drawBoard("ESSAY DUE TODAY");
{ const b = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), new THREE.MeshBasicMaterial({ map: boardTex })); b.position.set(0, 4.6, -5.88); cls.add(b); }
box(3.4, 1.4, 1.5, M("#7a5232"), 2.6, 0.7, -3.4, cls); box(1.2, 0.1, 0.9, M("#ffffff"), 2.2, 1.45, -3.2, cls); // teacher desk + papers
const desk = (x, z) => { box(1.9, 0.12, 1.2, M("#c8a070"), x, 1.45, z, cls); for (const sx of [-0.8, 0.8]) for (const sz of [-0.5, 0.5]) box(0.08, 1.4, 0.08, M("#555"), x + sx, 0.7, z + sz, cls); box(1.2, 0.1, 1.0, M("#3a6ea5"), x, 0.9, z + 1.1, cls); box(0.9, 0.04, 0.6, M("#ffffff"), x, 1.53, z, cls); };
for (const x of [-4, 0, 4]) for (const z of [0, 3.6]) desk(x, z);
const ex1 = blocky({ shirt: "#f0b429", hair: "#2a1a12", style: "curly", skin: "#8d5a3b" }); sit(ex1, true); put(ex1, cls, 4, 4.7, 0);
const ex2 = blocky({ shirt: "#8e5bd6", hair: "#d8b26a", style: "bun" }); sit(ex2, true); put(ex2, cls, -4, 4.7, 0);
const wallClock = makeClock(cls, -5.4, 7.6, -5.84, 1.3);

// ---------- bedroom at night ----------
const room = mkScene("#141a33"); room.add(new THREE.HemisphereLight("#8090d0", "#303040", 1.3));
box(30, 0.1, 30, M("#4a3a52"), 0, -0.05, 0, room); box(30, 14, 0.2, M("#2c3358"), 0, 7, -4, room);
const moonTex = canvasTex(256, 256, (g) => { g.fillStyle = "#0d1430"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#fff"; for (let i = 0; i < 30; i++) g.fillRect(rnd(i) * 256, rnd(i + 7) * 256, 2, 2); g.fillStyle = "#fff6cf"; g.beginPath(); g.arc(170, 80, 34, 0, 7); g.fill(); g.strokeStyle = "#6a5040"; g.lineWidth = 12; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); });
{ const w = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: moonTex })); w.position.set(-3.2, 5.6, -3.88); room.add(w); }
box(3.6, 0.12, 1.6, M("#7a5232"), 0.6, 1.5, 1.0, room); for (const sx of [-1.6, 1.6]) box(0.12, 1.5, 1.4, M("#5a3a22"), 0.6 + sx, 0.75, 1.0, room);
const pages = new THREE.Group(); room.add(pages); pages.position.set(1.7, 1.56, 1.0); for (let i = 0; i < 12; i++) { const p = box(0.85, 0.035, 1.1, M(i % 2 ? "#ffffff" : "#f1f1ea"), (rnd(i) - 0.5) * 0.1, i * 0.04, (rnd(i + 3) - 0.5) * 0.1, pages); p.rotation.y = (rnd(i + 5) - 0.5) * 0.25; }
const lamp = new THREE.PointLight("#ffcf8a", 9, 9, 1.6); lamp.position.set(-0.7, 3.4, 1.3); lamp.castShadow = true; room.add(lamp);
{ const sh = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.5, 18, 1, true), M("#e6c34a", { side: THREE.DoubleSide })); sh.position.set(-0.7, 3.5, 1.0); room.add(sh); box(0.08, 1.9, 0.08, M("#333"), -0.7, 2.5, 0.8, room); }
box(3.2, 0.8, 5, M("#3a5a9a"), -5, 0.4, 0.5, room); box(3.2, 0.3, 1.2, M("#f2f2f2"), -5, 0.95, -1.4, room); // bed
const glow = new THREE.PointLight("#9fffe0", 0, 4, 1.5); room.add(glow);

// the phone, with a live Unspool screen
const phoneTex = canvasTex(360, 740, () => {});
const REELS = [["THESIS", "Britain industrialised first: coal, capital and colonies"], ["PARAGRAPH 2", "Coal sat next to iron, so factories grew fast"], ["PARAGRAPH 3", "Cheap capital paid for the machines"]];
const drawPhone = (k) => { const { g } = phoneTex.userData; g.fillStyle = "#08110e"; g.fillRect(0, 0, 360, 740);
  const n = Math.min(2, Math.floor(k * 3)), f = k * 3 - n, slide = n < 2 && f > 0.82 ? ease((f - 0.82) / 0.18) : 0;
  for (let j = 0; j < 2; j++) { const idx = Math.min(2, n + j), y = (j - slide) * 740; if (y > 740) continue; const [h, body] = REELS[idx];
    g.save(); g.translate(0, y); g.fillStyle = "#08110e"; g.fillRect(0, 0, 360, 740);
    for (let s = 0; s < 3; s++) { g.fillStyle = s <= idx ? "#b6f24a" : "rgba(255,255,255,.25)"; g.fillRect(16 + s * 112, 22, 104, 6); }
    g.fillStyle = "#b6f24a"; g.font = "800 30px Arc"; g.textAlign = "left"; g.fillText(h, 26, 120);
    g.fillStyle = "#f4f4ea"; g.font = "800 40px Arc"; const words = body.split(" "); let line = "", ly = 190; for (const w of words) { if (g.measureText(line + w).width > 300) { g.fillText(line, 26, ly); line = ""; ly += 52; } line += w + " "; } g.fillText(line, 26, ly);
    g.strokeStyle = "#b6f24a"; g.lineWidth = 6; g.beginPath(); g.moveTo(26, ly + 34); g.lineTo(26 + 260 * clamp(f * 1.4), ly + 34); g.stroke();
    g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(20, 560, 320, 90); g.fillStyle = "#f4f4ea"; g.font = "700 22px Arc"; g.fillText("Tap to answer the quiz ▸", 40, 614); g.restore(); }
  g.fillStyle = "rgba(255,255,255,.7)"; g.font = "800 20px Arc"; g.textAlign = "center"; g.fillText("unspool.cc", 180, 712); phoneTex.needsUpdate = true; };
const phone = new THREE.Group(); { box(0.95, 1.9, 0.09, M("#111", { roughness: 0.3 }), 0, 0, 0, phone); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.78), new THREE.MeshBasicMaterial({ map: phoneTex })); s.position.z = 0.05; phone.add(s); }

// ---------- school hallway ----------
const hall = mkScene("#cfe0ea"); lights(hall, false);
const tileTex = canvasTex(256, 256, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#e9e6dc" : "#d4cfc0"; g.fillRect(i * 64, j * 64, 64, 64); } }); tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(10, 10);
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; hall.add(f); }
box(40, 14, 0.2, M("#f1ead8"), 0, 7, -3.6, hall);
const lockTex = canvasTex(128, 512, (g) => { g.fillStyle = "#2f6db0"; g.fillRect(0, 0, 128, 512); g.fillStyle = "#24568c"; for (let i = 0; i < 6; i++) g.fillRect(30, 40 + i * 14, 68, 6); g.fillStyle = "#c9d2da"; g.fillRect(96, 240, 10, 40); g.strokeStyle = "#1d4672"; g.lineWidth = 6; g.strokeRect(0, 0, 128, 512); });
for (let i = -10; i <= 10; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.4, 0.6), new THREE.MeshStandardMaterial({ map: lockTex, roughness: 0.5 })); l.position.set(i * 1.02, 2.2, -3.2); l.castShadow = l.receiveShadow = true; hall.add(l); }
box(2.2, 4.8, 0.3, M("#8a5a32"), 5.2, 2.4, -3.0, hall); box(0.8, 0.9, 0.32, M("#bfe6ff"), 5.2, 3.4, -2.98, hall); // classroom door

// sign for the end card
const signTex = canvasTex(640, 400, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 640, 400); g.strokeStyle = "#08110e"; g.lineWidth = 14; g.strokeRect(7, 7, 626, 386); g.textAlign = "center"; g.fillStyle = "#3a3a3a"; g.font = "800 44px Arc"; g.fillText("Made with", 320, 100);
  g.fillStyle = "#08110e"; g.font = "800 78px Arc"; g.fillText("UNSPOOL.CC", 320, 215); g.fillStyle = "#2a8a4a"; g.font = "800 38px Arc"; g.fillText("turn your notes into reels", 320, 300); });
const sign = new THREE.Group(); { box(2.7, 1.7, 0.06, M("#ffffff"), 0, 0, 0, sign); const s = new THREE.Mesh(new THREE.PlaneGeometry(2.62, 1.64), new THREE.MeshBasicMaterial({ map: signTex })); s.position.z = 0.04; sign.add(s); }

