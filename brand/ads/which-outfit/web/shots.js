
// ================= "Which outfit looks better?" (86 s) =================
// Same premise and beat-for-beat storyboard as the reference (a deadpan narrator, your girlfriend's two dresses, every answer
// is wrong), plus one new beat: the twenty minutes she spends changing, you turn your bio chapter into reels with Unspool.
const SH = [["ask", 0], ["boyC", 2.86], ["gfLook", 6.48], ["gfHold", 7.88], ["boyC", 9.32], ["wide", 11.88], ["boyC", 13.66], ["wide", 19.46], ["boyC", 21.4],
  ["boySmile", 25.88], ["gfHold", 27.82], ["boyWide", 29.74], ["wide", 31.36], ["boyC", 34.5], ["boySmile", 37.38], ["gfSigh", 39.84], ["leave", 42.24],
  ["alone", 44.4], ["boyPhone", 47.22], ["phone", 51.28], ["boyPhone", 59.06], ["green", 61.2], ["boyC", 64.98], ["gfCross", 66.74], ["boyC", 67.7],
  ["redDress", 69.84], ["boyC", 75.86], ["boyPhone", 80.0], ["end", 83.7]];
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const cam = (p, l, fov = 40) => { camera.position.copy(p); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(l); };
const drift = (k, p0, p1, l0, l1, fov = 40) => cam(lerpV(p0, p1, ease(k)), lerpV(l0, l1, ease(k)), fov);
const sit = (P, on) => { P.legs.forEach((l) => (l.rotation.x = on ? -1.45 : 0)); P.g.position.y = on ? -0.32 : 0; };

// ---------- living room ----------
const room = mkScene("#7fa6d6"); lights(room, true);
box(40, 0.1, 40, M("#c9c2b8"), 0, -0.05, 0, room); box(40, 14, 0.2, M("#6f98cf"), 0, 7, -4, room); box(0.2, 14, 40, M("#6890c8"), -7, 7, 0, room);
{ const rug = box(7, 0.04, 4.6, M("#efe8dc"), 0.4, 0.02, 1.6, room); }
const paint = canvasTex(400, 260, (g) => { g.fillStyle = "#cfe7f7"; g.fillRect(0, 0, 400, 260); g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(300, 70, 30, 0, 7); g.fill();
  g.fillStyle = "#4f8fb0"; g.beginPath(); g.moveTo(0, 190); g.lineTo(120, 90); g.lineTo(240, 190); g.fill(); g.fillStyle = "#3f7a5a"; g.beginPath(); g.moveTo(100, 260); g.lineTo(260, 110); g.lineTo(400, 230); g.lineTo(400, 260); g.fill();
  g.fillStyle = "#6fae6a"; g.fillRect(0, 210, 400, 50); g.strokeStyle = "#a0763e"; g.lineWidth = 18; g.strokeRect(0, 0, 400, 260); });
{ const p = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), new THREE.MeshBasicMaterial({ map: paint })); p.position.set(0.9, 5.4, -3.88); room.add(p); }
// sofa
const sofa = new THREE.Group(); room.add(sofa); sofa.position.set(0.9, 0, -2.6); const mS = M("#3d5f9e");
box(5.4, 0.9, 1.6, mS, 0, 0.45, 0.1, sofa); box(5.4, 1.5, 0.5, mS, 0, 1.4, -0.6, sofa); for (const x of [-2.8, 2.8]) box(0.5, 1.4, 1.7, mS, x, 0.8, 0.1, sofa);
for (const x of [-1.3, 1.3]) box(2.5, 0.25, 1.4, M("#4a6fb0"), x, 1.0, 0.2, sofa);
// lamp + side table
box(0.9, 1.2, 0.9, M("#a0763e"), -2.6, 0.6, -2.6, room); box(0.08, 1.2, 0.08, M("#c8b48a"), -2.6, 1.8, -2.6, room);
{ const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.6, 16, 1, true), M("#fff1c8", { side: THREE.DoubleSide, emissive: "#ffe9a8", emissiveIntensity: 0.6 })); sh.position.set(-2.6, 2.6, -2.6); room.add(sh); }
// coffee table
box(3.4, 0.16, 1.5, M("#c08850"), 0.9, 1.0, 1.4, room); for (const x of [-1.5, 1.5]) for (const z of [-0.6, 0.6]) box(0.14, 1.0, 0.14, M("#a8743e"), 0.9 + x, 0.5, 1.4 + z, room);
// door
box(1.8, 4.6, 0.12, M("#ffffff"), -5.0, 2.3, -3.88, room); box(1.5, 4.3, 0.14, M("#e9eef5"), -5.0, 2.15, -3.86, room);

// ---------- characters ----------
const BOY = blocky({ shirt: "#f47b20", pants: "#2050c8", hair: "#e8b48a", style: "none", skin: "#f0bf90", nose: false, iris: "#2a1a10" });
const GF = blocky({ shirt: "#8a4fd0", pants: "#24485a", hair: "#6b3f22", style: "long", skin: "#f1c9a0", nose: false, iris: "#3a2410" });
const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.95, 1.25, 20), M("#d32f3a")); skirt.position.y = 0.55; skirt.castShadow = true; GF.g.add(skirt);
const outfit = (kind) => { const top = { purple: "#8a4fd0", green: "#5f8a5a", red: "#d32f3a" }[kind], bot = { purple: "#24485a", green: "#5f8a5a", red: "#f1c9a0" }[kind];
  GF.torso.material.color.set(top); GF.arms.forEach((a) => a.children[0].material.color.set(top)); GF.legs.forEach((l) => l.children[0].material.color.set(bot)); skirt.visible = kind === "red"; };
// dresses on hangers
const dress = (col) => { const d = new THREE.Group(); const m = M(col); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.62, 1.5, 20), m); body.scale.z = 0.35; body.position.y = -0.95; body.castShadow = true; d.add(body);
  box(0.62, 0.36, 0.22, m, 0, -0.18, 0, d); const hk = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI * 1.4), M("#888")); hk.position.y = 0.08; d.add(hk); box(0.7, 0.04, 0.04, M("#888"), 0, -0.02, 0, d); return d; };
const BLACK = dress("#1b1b1f"), RED = dress("#d32f3a");
const holdUp = (arm, d) => { arm.add(d); d.position.set(0, -1.25, 0.2); d.rotation.set(-arm.rotation.x, 0, -arm.rotation.z); };

const phoneTex = canvasTex(360, 740, () => {});
const phone = new THREE.Group(); { box(0.95, 1.9, 0.09, M("#111", { roughness: 0.3 }), 0, 0, 0, phone); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.78), new THREE.MeshBasicMaterial({ map: phoneTex })); s.position.z = 0.05; phone.add(s); }
const wrapLines = (g, txt, x, y, w, lh) => { let line = ""; for (const wd of txt.split(" ")) { if (g.measureText(line + wd).width > w) { g.fillText(line, x, y); line = ""; y += lh; } line += wd + " "; } g.fillText(line, x, y); };
const REELS = [["MITOSIS", "One cell copies its DNA, then splits into two identical cells"], ["MEIOSIS", "Two divisions make four sex cells, each with half the chromosomes"], ["THE CELL CYCLE", "Interphase, then mitosis, then cytokinesis. Repeat"]];
const drawPhone = (mode, k) => { const { g } = phoneTex.userData; g.fillStyle = "#08110e"; g.fillRect(0, 0, 360, 740); g.textAlign = "left";
  if (mode === "upload") { g.fillStyle = "#f4f4ea"; g.font = "800 30px Arc"; g.fillText("unspool.cc", 26, 70); g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.roundRect(22, 120, 316, 150, 18); g.fill();
    g.fillStyle = "#e6402e"; g.fillRect(44, 150, 54, 70); g.fillStyle = "#fff"; g.font = "800 18px Arc"; g.fillText("PDF", 52, 192); g.fillStyle = "#f4f4ea"; g.font = "700 24px Arc"; g.fillText("Bio_Ch7_Cells.pdf", 112, 180); g.fillStyle = "#9aa"; g.font = "700 20px Arc"; g.fillText("40 pages", 112, 212);
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(22, 320, 316, 14); g.fillStyle = "#b6f24a"; g.fillRect(22, 320, 316 * clamp(k * 1.3), 14);
    g.fillStyle = "#f4f4ea"; g.font = "700 24px Arc"; g.fillText(k > 0.8 ? "12 reels ready ✓" : "Making your reels…", 22, 380);
    g.textAlign = "center"; g.fillStyle = "#b6f24a"; g.font = "800 120px Arc"; g.fillText(String(Math.min(12, Math.floor(clamp(k * 1.3) * 12))), 180, 560); g.font = "800 34px Arc"; g.fillText("REELS", 180, 610); g.textAlign = "left"; phoneTex.needsUpdate = true; return; }
  if (mode === "quiz") { g.fillStyle = "#b6f24a"; g.font = "800 26px Arc"; g.fillText("unspool.cc · QUIZ", 26, 70); const Q = ["What does mitosis make?", "How many cells from meiosis?", "What comes after interphase?"];
    Q.forEach((q, j) => { const y = 120 + j * 170, on = k > 0.2 + j * 0.25; g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.roundRect(22, y, 316, 140, 16); g.fill(); g.fillStyle = "#f4f4ea"; g.font = "700 22px Arc"; wrapLines(g, q, 40, y + 40, 280, 28);
      if (on) { g.fillStyle = "#2bb673"; g.beginPath(); g.roundRect(40, y + 82, 280, 40, 10); g.fill(); g.fillStyle = "#fff"; g.font = "800 20px Arc"; g.fillText(["2 identical cells  ✓", "4 cells  ✓", "Mitosis  ✓"][j], 54, y + 109); } });
    if (k > 0.9) { g.fillStyle = "#b6f24a"; g.font = "800 40px Arc"; g.textAlign = "center"; g.fillText("3/3 ✓", 180, 680); } phoneTex.needsUpdate = true; return; }
  const n = Math.min(2, Math.floor(k * 3)), f = k * 3 - n, slide = n < 2 && f > 0.8 ? ease((f - 0.8) / 0.2) : 0;
  for (let j = 0; j < 2; j++) { const idx = Math.min(2, n + j), y = (j - slide) * 740; if (y > 740) continue; const [h, body] = REELS[idx]; g.save(); g.translate(0, y); g.fillStyle = "#08110e"; g.fillRect(0, 0, 360, 740);
    for (let s = 0; s < 3; s++) { g.fillStyle = s <= idx ? "#b6f24a" : "rgba(255,255,255,.25)"; g.fillRect(16 + s * 112, 22, 104, 6); }
    g.fillStyle = "#b6f24a"; g.font = "800 32px Arc"; g.fillText(h, 26, 120); g.fillStyle = "#f4f4ea"; g.font = "800 36px Arc"; wrapLines(g, body, 26, 190, 300, 48);
    // a little cell diagram
    g.strokeStyle = "#b6f24a"; g.lineWidth = 5; const cx = 180, cy = 560, sp = idx === 2 ? 0 : 40 * clamp(f * 2); g.beginPath(); g.ellipse(cx - sp, cy, 60, 60, 0, 0, 7); g.stroke(); if (sp > 2) { g.beginPath(); g.ellipse(cx + sp, cy, 60, 60, 0, 0, 7); g.stroke(); } g.restore(); }
  phoneTex.needsUpdate = true; };
const signTex = canvasTex(640, 400, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 640, 400); g.strokeStyle = "#08110e"; g.lineWidth = 14; g.strokeRect(7, 7, 626, 386); g.textAlign = "center"; g.fillStyle = "#3a3a3a"; g.font = "800 44px Arc"; g.fillText("Made with", 320, 100);
  g.fillStyle = "#08110e"; g.font = "800 78px Arc"; g.fillText("UNSPOOL.CC", 320, 215); g.fillStyle = "#2a8a4a"; g.font = "800 38px Arc"; g.fillText("turn your notes into reels", 320, 300); });
const sign = new THREE.Group(); { box(2.7, 1.7, 0.06, M("#ffffff"), 0, 0, 0, sign); const s = new THREE.Mesh(new THREE.PlaneGeometry(2.62, 1.64), new THREE.MeshBasicMaterial({ map: signTex })); s.position.z = 0.04; sign.add(s); }

// ---------- staging helpers ----------
const boyOnSofa = (face = "neutral", pose = {}) => { room.add(BOY.g); sit(BOY, true); BOY.g.position.set(2.0, BOY.g.position.y + 0.4, -2.2); BOY.g.rotation.y = -0.15; BOY.setFace(face); BOY.pose({ la: [-0.5, 0.15], ra: [-0.5, -0.15], ...pose }); };
const gfStanding = (x = -0.3, z = -0.9, ry = 0.2) => { room.add(GF.g); sit(GF, false); GF.g.position.set(x, 0, z); GF.g.rotation.y = ry; };
const gfDresses = (focusRed = false, t = 0) => { GF.pose({ la: [-0.95, -0.38], ra: [focusRed ? -1.45 : -0.95, 0.38], headTurn: focusRed ? -0.45 : 0, headTilt: Math.sin(t * 2) * 0.04 }); holdUp(GF.arms[0], BLACK); holdUp(GF.arms[1], RED); };
const WIDE = [v3(0.8, 4.0, 12.6), v3(0.8, 2.7, -1.2)];
const SC = {
  ask(lt) { outfit("purple"); gfStanding(); GF.setFace("neutral"); gfDresses(false, lt); boyOnSofa("neutral"); drift(lt / 2.86, v3(0.4, 4.2, 12.4), WIDE[0], WIDE[1], WIDE[1], 42); return room; },
  wide(lt) { outfit("purple"); gfStanding(); GF.setFace(lt > 0.8 ? "angry" : "neutral"); gfDresses(lt > 0.4, lt); boyOnSofa("neutral", { headTurn: 0.3 }); cam(WIDE[0], WIDE[1], 42); return room; },
  boyC(lt, name, t) { boyOnSofa(t > 64 && t < 70 ? "worried" : t > 13 && t < 19 ? "smug" : t > 23 && t < 26 ? "smug" : t > 75 ? "neutral" : "neutral", { headTurn: 0.25 + (t > 23 && t < 26 ? 0.35 : 0) }); outfit("purple");
    const k = lt / 4; cam(v3(1.2, 3.3, 3.9 - k * 0.3), v3(2.0, 2.85, -2.2), 34); return room; },
  boySmile(lt) { boyOnSofa("happy", { headTurn: 0.3 }); cam(v3(1.2, 3.3, 3.7), v3(2.0, 2.85, -2.2), 34); return room; },
  boyWide(lt) { outfit("purple"); boyOnSofa("happy", { headTurn: 0.3 }); gfStanding(); GF.setFace("neutral"); GF.pose({ ra: [-1.3, 0.38], la: [0, 0.06] }); holdUp(GF.arms[1], RED); cam(v3(1.6, 3.6, 7.0), v3(1.2, 2.6, -1.8), 40); return room; },
  gfLook(lt) { outfit("purple"); gfStanding(); GF.setFace("neutral"); gfDresses(lt > 0.3, lt); boyOnSofa(); cam(v3(-0.2, 3.4, 8.2), v3(-0.3, 2.6, -0.9), 40); return room; },
  gfHold(lt) { outfit("purple"); gfStanding(); GF.setFace(lt > 0.5 ? "angry" : "neutral"); GF.pose({ ra: [-1.45, 0.38], la: [-0.95, -0.38] }); holdUp(GF.arms[1], RED); holdUp(GF.arms[0], BLACK); boyOnSofa(); cam(v3(-0.2, 3.5, 7.4 - lt * 0.15), v3(-0.3, 2.8, -0.9), 40); return room; },
  gfSigh(lt) { outfit("purple"); gfStanding(); GF.setFace(lt > 1.0 ? "angry" : "neutral"); GF.pose({ la: [-0.4, 0.15 + Math.max(0, Math.sin(lt * 2)) * 0.1], ra: [-0.4, -0.15], headTilt: Math.sin(lt * 1.5) * 0.08 }); holdUp(GF.arms[0], BLACK); holdUp(GF.arms[1], RED); boyOnSofa(); cam(v3(-0.2, 3.5, 7.0), v3(-0.3, 2.8, -0.9), 40); return room; },
  leave(lt) { outfit("purple"); const k = ease(lt / 2.0); gfStanding(mix(-0.3, -5.0, k), mix(-0.9, -3.2, k), mix(0.25, -2.6, clamp(lt * 2))); const s = Math.sin(lt * 9); GF.setFace("angry"); GF.pose({ ll: s * 0.4, rl: -s * 0.4, la: [-0.8, 0.5], ra: [-0.8, -0.5] }); holdUp(GF.arms[0], BLACK); holdUp(GF.arms[1], RED); GF.g.visible = lt < 1.9; boyOnSofa("neutral", { headTurn: 0.7 }); cam(WIDE[0], WIDE[1], 42); return room; },
  alone(lt) { boyOnSofa("neutral", { headTurn: lt > 1.4 ? 0 : 0.7 }); drift(lt / 2.82, WIDE[0], v3(1.6, 3.6, 7.0), WIDE[1], v3(1.8, 2.6, -2.0), 42); return room; },
  boyPhone(lt, name, t) { boyOnSofa(t > 80 ? "happy" : t > 59 ? "grin" : "worried", { la: [-1.3, 0.3], ra: [-1.3, -0.3], headTilt: 0.1 }); room.add(phone); phone.position.set(2.0, 1.75, -1.25); phone.rotation.set(-1.25, Math.PI + 0.15, 0); drawPhone("reel", 0.2);
    cam(v3(1.2, 3.5, 4.0 - lt * 0.05), v3(2.0, 2.75, -2.2), 34); return room; },
  phone(lt, name, t) { boyOnSofa("neutral", { la: [-1.3, 0.3], ra: [-1.3, -0.3] }); // the screen itself is shown full-size in the overlay
    if (t < 55.42) drawPhone("upload", (t - 51.28) / 3.4); else if (t < 58.14) drawPhone("reel", (t - 55.42) / 2.72); else drawPhone("quiz", (t - 58.14) / 0.9);
    cam(v3(1.2, 3.5, 4.0 - lt * 0.05), v3(2.0, 2.75, -2.2), 36); return room; },
  green(lt) { outfit("green"); const k = ease(lt / 1.4); gfStanding(mix(-5.0, -0.3, k), mix(-3.2, -0.9, k), 0.2); const s = Math.sin(lt * 9) * (1 - k); GF.pose({ ll: s * 0.4, rl: -s * 0.4, la: [0, 0.06], ra: [0, -0.06] }); GF.setFace("happy"); boyOnSofa("shock", { headTurn: 0.4 }); cam(WIDE[0], WIDE[1], 42); return room; },
  gfCross(lt) { outfit("green"); gfStanding(); GF.setFace("angry"); GF.pose({ la: [-1.4, -0.9], ra: [-1.4, 0.9] }); boyOnSofa(); cam(v3(-0.2, 3.6, 5.0), v3(-0.3, 3.0, -0.9), 38); return room; },
  redDress(lt) { outfit("red"); gfStanding(); GF.setFace("happy"); GF.pose({ la: [0, 0.1], ra: [0, -0.1], headTilt: Math.sin(lt * 1.5) * 0.05 }); boyOnSofa("neutral", { headTurn: 0.35 }); lt < 3.3 ? cam(WIDE[0], WIDE[1], 42) : cam(v3(0.6, 3.8, 8.0), v3(0.4, 2.8, -1.4), 40); return room; },
  end(lt) { room.add(BOY.g); sit(BOY, false); BOY.g.position.set(0.4, 0, 0.4); BOY.g.rotation.y = 0; BOY.setFace("happy"); BOY.pose({ la: [-1.45, -0.15], ra: [-1.45, 0.15] });
    room.add(sign); sign.position.set(0.4, 2.05 + Math.sin(lt * 4) * 0.02 - 0.3 * (1 - outBack(lt / 0.3)), 1.95); sign.scale.setScalar(0.82); cam(v3(0.4, 3.0, 9.4 - lt * 0.3), v3(0.4, 3.2, 0.2), 40); return room; },
};

// ---------------- overlay ----------------
const ov = document.getElementById("ov"), glc = document.getElementById("gl");
glc.style.filter = "contrast(1.05) saturate(1.1)";
const capAt = (t) => { let c = null; for (const x of CAPS) if (t >= x[0] - 0.03) c = x; return c && t < 83.7 ? c : null; };
const tag = (txt, lt) => `<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><span style="background:#ffd23f;color:#111;font:800 34px Arc;padding:8px 18px;border-radius:10px;opacity:${clamp(lt * 4)}">${txt}</span></div>`;
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i], lt = t - t0;
  [BOY.g, GF.g, phone, sign, BLACK, RED].forEach((o) => o.removeFromParent()); GF.g.visible = true;
  renderer.render(SC[name](lt, name, t), camera);
  let h = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 60%,rgba(0,0,0,.28) 100%)"></div>`;
  if (t >= 44.4 && t < 47.22) h += tag("20 MINUTES, MINIMUM", t - 44.4);
  if (t >= 47.22 && t < 51.28) h += tag("BIO TEST TOMORROW · 40 PAGES", t - 47.22);
  if (t >= 69.84 && t < 71.76) h += tag("20 MINUTES LATER", t - 69.84);
  // the Unspool beat, made unmissable: the app fills the screen, logo up top, the PDF drops in
  const U0 = 51.28, U1 = 59.06, inU = t >= U0 - 0.25 && t < U1; let phoneEl = null;
  if (inU) { const a = clamp((t - (U0 - 0.25)) / 0.3) * clamp((U1 - t) / 0.25), pop = 0.8 + 0.2 * outBack(clamp((t - (U0 - 0.25)) / 0.35));
    h += `<div style="position:absolute;inset:0;background:rgba(6,10,8,${0.62 * a})"></div>`;
    const lg = t >= 52.45 && t < 53.2 ? 1 + 0.12 * Math.sin(clamp((t - 52.45) / 0.75) * Math.PI) : 1;
    h += `<div style="position:absolute;left:0;right:0;top:96px;text-align:center;opacity:${a}"><span style="display:inline-block;transform:scale(${lg});background:#b6f24a;color:#08110e;font:800 40px Arc;padding:8px 22px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45)">unspool<span style="opacity:.55">.cc</span></span></div>`;
    h += `<div id="ph" style="position:absolute;left:218px;top:178px;width:284px;height:584px;border-radius:38px;background:#000;border:5px solid #2a2a2a;box-shadow:0 20px 50px rgba(0,0,0,.6);overflow:hidden;opacity:${a};transform:scale(${pop});transform-origin:50% 50%"></div>`;
    if (t >= U0 && t < 52.6) { const k = ease(clamp((t - U0) / 1.2)); const y = mix(-30, 300, k), sc = mix(1.1, 0.5, k), op = clamp((52.6 - t) / 0.2);
      h += `<div style="position:absolute;left:0;right:0;top:${y}px;text-align:center;opacity:${op * a}"><span style="display:inline-flex;align-items:center;gap:16px;transform:scale(${sc});background:#fff;color:#111;font:800 28px Arc;padding:12px 20px;border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.5)"><span style="background:#e6402e;color:#fff;font:800 18px Arc;padding:12px 8px;border-radius:6px">PDF</span>Bio chapter · 40 pages</span></div>`; }
    phoneEl = true; }
  const c = capAt(t);
  if (c) { const k = clamp((t - c[0]) / 0.1); h += `<div class="cap" style="${inU ? "top:790px;" : ""}transform:scale(${0.85 + 0.15 * outBack(k)})">${c[1]}</div>`; }
  if (name === "end") h += `<div style="position:absolute;left:0;right:0;top:190px;text-align:center;color:#fff;font:800 44px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;opacity:${clamp((lt - 0.2) * 4)}">THE NIGHT WASN'T A TOTAL LOSS</div>`;
  ov.innerHTML = h;
  if (phoneEl) { const cv = phoneTex.userData.c; cv.style.cssText = "width:100%;height:100%;display:block"; document.getElementById("ph").appendChild(cv); }
};
const st = document.createElement("style"); st.textContent = `.cap{position:absolute;left:100px;right:100px;top:860px;text-align:center;color:#fff;font:800 50px/1.18 Arc;-webkit-text-stroke:9px #000;paint-order:stroke fill;text-shadow:0 4px 0 #000}
.cap .hl{background:#d81e1e;-webkit-text-stroke:0;padding:0 8px;border-radius:6px;box-decoration-break:clone;-webkit-box-decoration-break:clone;text-shadow:none}`; document.head.appendChild(st);
window.renderAt(0); setTimeout(() => (window.ready = true), 80);
