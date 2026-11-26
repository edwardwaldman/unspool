// "What if you fell INTO your textbook?" (20s, no voiceover: everything reads on screen so any audio can play over it)
// Beats: hook at the desk -> sucked into page 1 -> history (knight) -> biology (cell) -> math (the word-problem train)
// -> lands on page 600 remembering nothing -> drops the book into unspool.cc, rides the reels back up -> end card.
window.DUR = 20;
const cv = document.getElementById("cv"), g = cv.getContext("2d"), ov = document.getElementById("ov");
const W = 720, H = 1280, INK = "#14141f";
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const outBack = (x) => { x = clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const SH = [["desk", 0], ["suck", 2.2], ["history", 3.4], ["bio", 5.6], ["math", 7.8], ["land", 10.0], ["unspool", 12.0], ["end", 17.5]];

// ---------- drawing helpers ----------
const rr = (x, y, w, h, r, fill, stroke = INK, lw = 5) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
const circ = (x, y, r, fill, stroke = INK, lw = 5) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); } };
const limb = (x1, y1, x2, y2, col, w = 18) => { g.lineCap = "round"; g.strokeStyle = INK; g.lineWidth = w + 9; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
const txt = (s, x, y, size, col = INK, align = "center") => { g.font = `800 ${size}px Arc`; g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y); };

// the student: brown hair, orange hoodie, jeans
function kid(x, y, s = 1, { pose = "fall", face = "shock", t = 0, rot = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const wob = Math.sin(t * 14) * 0.12;
  const SK = "#f1c49c", HO = "#ff8a3d", JE = "#3a5aa8";
  // legs
  if (pose === "sit") { limb(-16, 60, -30, 108, JE, 22); limb(16, 60, 30, 108, JE, 22); }
  else { const k = pose === "fall" ? wob * 40 : 0; limb(-16, 60, -24 - k, 118, JE, 22); limb(16, 60, 24 + k, 118, JE, 22); rr(-44 - k, 112, 34, 16, 8, "#fff", INK, 4); rr(10 + k, 112, 34, 16, 8, "#fff", INK, 4); }
  // arms
  if (pose === "fall") { limb(-30, -10, -64, -78 + wob * 30, HO); limb(30, -10, 64, -78 - wob * 30, HO); circ(-64, -84 + wob * 30, 12, SK, INK, 4); circ(64, -84 - wob * 30, 12, SK, INK, 4); }
  else if (pose === "cheer") { limb(-30, -10, -70, -70, HO); limb(30, -10, 58, 30, HO); circ(-72, -76, 12, SK, INK, 4); circ(58, 36, 12, SK, INK, 4); }
  else { limb(-30, -6, -52, 46, HO); limb(30, -6, 52, 46, HO); circ(-52, 52, 12, SK, INK, 4); circ(52, 52, 12, SK, INK, 4); }
  // body
  rr(-40, -30, 80, 98, 26, HO); g.fillStyle = "#e5702a"; g.beginPath(); g.roundRect(-20, 20, 40, 22, 8); g.fill();
  // head
  circ(0, -66, 40, SK);
  g.fillStyle = "#5a3417"; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(0, -70, 41, Math.PI * 1.08, Math.PI * 1.92); g.quadraticCurveTo(20, -96, 0, -92); g.quadraticCurveTo(-24, -98, -38, -82); g.closePath(); g.fill(); g.stroke();
  // face
  const ey = -66;
  if (face === "happy") { g.lineWidth = 5; g.strokeStyle = INK; for (const sx of [-14, 14]) { g.beginPath(); g.arc(sx, ey + 2, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
  else { for (const sx of [-14, 14]) { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(sx, ey, 9, face === "shock" ? 11 : 9, 0, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); circ(sx + 1, ey + 1, 4.5, INK, null); } }
  if (face === "meh") { g.lineWidth = 4; g.strokeStyle = INK; for (const sx of [-14, 14]) { g.beginPath(); g.moveTo(sx - 10, ey - 4); g.lineTo(sx + 10, ey - 4); g.stroke(); } }
  g.lineWidth = 5; g.strokeStyle = INK; g.fillStyle = "#6a1f1f";
  if (face === "shock") { g.beginPath(); g.ellipse(0, -42, 8, 11, 0, 0, 7); g.fill(); g.stroke(); }
  else if (face === "happy") { g.beginPath(); g.arc(0, -46, 13, 0.15, Math.PI - 0.15); g.closePath(); g.fill(); g.stroke(); }
  else if (face === "meh") { g.beginPath(); g.moveTo(-10, -42); g.lineTo(10, -44); g.stroke(); }
  else { g.beginPath(); g.arc(0, -50, 9, 0.3, Math.PI - 0.3); g.stroke(); }
  g.restore();
}
// speed streaks rushing up past a faller
function streaks(t, col = "rgba(255,255,255,.35)", n = 14, v = 2600) { g.lineCap = "round"; g.strokeStyle = col; g.lineWidth = 4;
  for (let i = 0; i < n; i++) { const x = 40 + rnd(i) * 640, len = 60 + rnd(i + 9) * 120, y = ((rnd(i + 3) * H - t * v) % (H + 300) + H + 300) % (H + 300) - 150; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + len); g.stroke(); } }
// a page edge sweeping past (so it reads as "falling through pages")
function pageLines(t, bg, line) { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = line; g.lineWidth = 3; const off = (t * 900) % 56; for (let y = -off; y < H; y += 56) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }
// a big printed page number drifting up in the background
function pageNum(n, t, col) { g.globalAlpha = 0.22; txt(String(n), W / 2, 760 - t * 220, 220, col); g.globalAlpha = 1; }

// ---------- scenes ----------
function textbook(x, y, w, h, open = 0) { // closed/opening giant textbook on the desk
  rr(x, y, w, h, 10, "#2f7d5b"); rr(x + 10, y + h - 26, w - 20, 18, 4, "#fff8e6", INK, 4);
  txt("BIOLOGY", x + w / 2, y + 40, 22, "#fff"); txt("HISTORY", x + w / 2, y + 66, 22, "#fff"); txt("MATH", x + w / 2, y + 92, 22, "#fff"); txt("600 PAGES", x + w / 2, y + h - 60, 30, "#ffd23f");
  if (open > 0) { g.globalAlpha = open; rr(x - 10, y - 10, w + 20, h + 20, 14, "#fff8e6"); g.globalAlpha = 1; }
}
function room(t) {
  g.fillStyle = "#ffe3c4"; g.fillRect(0, 0, W, H); g.fillStyle = "#c98a5a"; g.fillRect(0, 820, W, H - 820); g.fillStyle = "#b07446"; g.fillRect(0, 820, W, 16);
  rr(70, 380, 170, 150, 8, "#bfe4ff"); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(155, 380); g.lineTo(155, 530); g.moveTo(70, 455); g.lineTo(240, 455); g.stroke();
  rr(520, 400, 120, 150, 6, "#2d2a4a"); circ(580, 450, 26, "#ff4d6d", null); rr(545, 500, 70, 10, 4, "#ffd23f", null);
  rr(300, 690, 380, 26, 6, "#8a5a36"); limb(330, 716, 330, 830, "#8a5a36", 14); limb(650, 716, 650, 830, "#8a5a36", 14);
}
const SC = {
  desk(lt) { room(lt); textbook(440, 520, 210, 172); kid(230, 700, 1.15, { pose: "stand", face: lt > 1.0 ? "shock" : "neutral" }); },
  suck(lt) { // the open page swallows you: a white page fills the screen and you spin in
    room(0); const k = ease(lt / 1.0); g.save(); g.translate(545, 606); g.scale(mix(1, 7, k), mix(1, 9, k)); rr(-105, -86, 210, 172, 6, "#fff8e6"); g.restore();
    if (k > 0.6) { pageLines(lt, `rgba(255,248,230,${(k - 0.6) * 2.5})`, `rgba(120,160,220,${(k - 0.6) * 1.5})`); }
    kid(mix(230, 360, k), mix(700, 600, k), mix(1.15, 1.2, k), { pose: "fall", face: "shock", t: lt, rot: lt * 7 * (1 - k * 0.8) });
  },
  history(lt) { // parchment, castle walls rushing up, a knight rides by
    g.fillStyle = "#e8cf9a"; g.fillRect(0, 0, W, H); pageNum(48, lt, "#7a5a2a");
    for (let i = 0; i < 4; i++) { const y = 1300 - ((lt * 520 + i * 360) % 1500); g.fillStyle = "#b99a62"; g.strokeStyle = INK; g.lineWidth = 5; const x = i % 2 ? 560 : -10; g.beginPath(); g.rect(x, y, 170, 220); g.fill(); g.stroke(); for (let c = 0; c < 4; c++) { g.beginPath(); g.rect(x + c * 46, y - 26, 30, 28); g.fill(); g.stroke(); } }
    streaks(lt, "rgba(90,60,20,.25)");
    const kx = mix(820, 470, ease((lt - 0.2) / 0.8)), ky = 640 - lt * 30; // knight on a horse
    g.save(); g.translate(kx, ky); rr(-70, 10, 150, 70, 30, "#f5f5f5"); limb(-50, 70, -55, 130, "#f5f5f5", 16); limb(50, 70, 55, 130, "#f5f5f5", 16); circ(90, 0, 30, "#f5f5f5"); rr(-24, -70, 48, 84, 14, "#a9b4c2"); circ(0, -96, 30, "#a9b4c2"); rr(-20, -104, 40, 8, 3, INK, null); limb(30, -40, 40, -150, "#8a5a36", 8); g.restore();
    kid(330, 600, 1.2, { pose: "fall", face: "shock", t: lt });
  },
  bio(lt) { // inside a cell: green goo, a mitochondrion floats past
    g.fillStyle = "#9fe0a8"; g.fillRect(0, 0, W, H); pageNum(210, lt, "#2a6a3a");
    for (let i = 0; i < 9; i++) { const y = 1350 - ((lt * 600 + i * 170) % 1550), x = 60 + rnd(i) * 600; circ(x, y, 26 + rnd(i + 4) * 30, "rgba(60,160,90,.55)", "rgba(20,90,50,.6)", 4); }
    const mx = mix(800, 520, ease((lt - 0.15) / 0.7)), my = 700 - lt * 40; g.save(); g.translate(mx, my); g.rotate(-0.3); g.beginPath(); g.ellipse(0, 0, 110, 56, 0, 0, 7); g.fillStyle = "#ff8fa3"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    g.lineWidth = 4; g.beginPath(); for (let k = -90; k <= 90; k += 30) { g.moveTo(k, -38); g.quadraticCurveTo(k + 15, 0, k, 38); } g.stroke(); circ(-30, -8, 6, INK, null); circ(10, -8, 6, INK, null); g.beginPath(); g.arc(-10, 10, 12, 0.2, Math.PI - 0.2); g.stroke(); g.restore();
    streaks(lt, "rgba(20,90,50,.25)"); kid(300, 600, 1.2, { pose: "fall", face: "shock", t: lt });
  },
  math(lt) { // graph paper, formulas flying, THE train
    pageLines(lt, "#dfeaff", "rgba(80,120,200,.25)"); g.strokeStyle = "rgba(80,120,200,.25)"; g.lineWidth = 3; for (let x = 0; x < W; x += 56) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    pageNum(455, lt, "#2a4a9a");
    const F = ["a² + b² = c²", "x = ?", "y = mx + b", "π ≈ 3.14", "2x + 3 = 11"]; F.forEach((f, i) => { const y = 1300 - ((lt * 650 + i * 300) % 1500); txt(f, i % 2 ? 560 : 160, y, 40, "rgba(30,50,120,.5)"); });
    const tx = mix(900, -700, clamp((lt - 0.4) / 1.6)); // the train crosses below the kid
    g.save(); g.translate(tx, 760); for (let c = 0; c < 3; c++) { rr(c * 250, 0, 236, 120, 18, c ? "#e94f4f" : "#ffd23f"); for (let w = 0; w < 3; w++) rr(c * 250 + 20 + w * 70, 22, 52, 42, 8, "#bfe4ff", INK, 4); circ(c * 250 + 50, 126, 18, "#444"); circ(c * 250 + 186, 126, 18, "#444"); } txt("3:00 PM · 60 MPH", 118, 92, 20, INK); g.restore();
    kid(360, 560, 1.2, { pose: "fall", face: "shock", t: lt });
  },
  land(lt) { // the back cover. THUD.
    g.fillStyle = "#2b2d42"; g.fillRect(0, 0, W, H); g.fillStyle = "#2f7d5b"; g.fillRect(0, 820, W, H - 820); g.fillStyle = "#256a4b"; g.fillRect(0, 820, W, 18); txt("BACK COVER", W / 2, 900, 30, "rgba(255,255,255,.45)");
    const k = ease(lt / 0.35), sq = lt > 0.35 && lt < 0.6 ? 1 - Math.sin((lt - 0.35) / 0.25 * Math.PI) * 0.12 : 1;
    g.save(); g.translate(360, mix(300, 702, k)); g.scale(1.2, 1.2 * sq); g.translate(-360, -702); kid(360, 702, 1, { pose: lt < 0.35 ? "fall" : "stand", face: lt > 0.9 ? "meh" : "shock", t: lt }); g.restore();
    if (lt > 0.35 && lt < 0.9) { g.globalAlpha = 1 - (lt - 0.35) / 0.55; txt("THUD", 360, 600 - (lt - 0.35) * 120, 64, "#ffd23f"); g.globalAlpha = 1; }
  },
  unspool(lt) { // phone drops in; the book's chapters become reels you ride back up
    g.fillStyle = "#0d1a14"; g.fillRect(0, 0, W, H); streaks(lt, "rgba(182,242,74,.25)", 16, 1800);
    const rise = ease((lt - 1.4) / 4.0);
    // stacked reel cards scrolling down = you rising
    const T = ["CH 3 · MEDIEVAL", "CH 8 · CELLS", "CH 12 · ELEMENTS", "CH 19 · ALGEBRA", "CH 21 · FORCES", "CH 24 · GENETICS"];
    g.save(); g.beginPath(); g.rect(0, 360, W, 560); g.clip(); // cards live between the caption and the stats bar
    for (let i = 0; i < 6; i++) { const yy = 760 - i * 170 + rise * 760, cx = i % 2 ? 495 : 205; if (lt < 1.3) continue; const a = clamp((lt - 1.3 - i * 0.15) / 0.3);
      g.globalAlpha = a; rr(cx - 112, yy, 224, 150, 22, "#13241b", "#b6f24a", 5); txt(T[i], cx, yy + 38, 20, "#b6f24a"); txt("▶ short reel", cx, yy + 76, 22, "#f4f4ea"); rr(cx - 90, yy + 104, 180, 30, 15, quizOn(lt, i) ? "#2bb673" : "rgba(255,255,255,.12)", null); txt(quizOn(lt, i) ? "QUIZ ✓" : "QUIZ", cx, yy + 119, 20, "#fff"); g.globalAlpha = 1; }
    g.restore();
    // the phone falls in during the first beat
    if (lt < 1.6) { const k = outBack(clamp(lt / 0.6)), a = clamp((1.6 - lt) / 0.3); g.globalAlpha = a; g.save(); g.translate(360, mix(-300, 640, k)); rr(-130, -250, 260, 500, 36, "#111", "#2a2a2a", 8); txt("unspool.cc", 0, -190, 30, "#f4f4ea"); rr(-100, -140, 200, 80, 14, "rgba(255,255,255,.1)", null); rr(-86, -126, 40, 52, 6, "#2f7d5b", null); txt("textbook.pdf", 26, -100, 18, "#f4f4ea"); rr(-100, -30, 200 * clamp(lt / 1.2), 12, 6, "#b6f24a", null); txt(lt > 1.1 ? "reels ready ✓" : "making reels…", 0, 20, 22, "#b6f24a"); g.restore(); g.globalAlpha = 1; }
    if (lt >= 1.3) kid(360, 660 - Math.sin(lt * 3) * 8, 1.15, { pose: "cheer", face: "happy", t: lt });
  },
  end(lt) { room(0); textbook(440, 520, 210, 172); rr(330, 650, 120, 44, 6, "#fff", INK, 4); txt("TEST", 390, 672, 22, INK); kid(230, 700, 1.15, { pose: "cheer", face: "happy", t: lt }); },
};
const quizOn = (lt, i) => lt > 2.2 + i * 0.55;

// ---------- overlay ----------
const CAP = [[0, "What if you fell <b>INTO</b> your textbook?"], [2.2, "the page opens… and <b>SWALLOWS</b> you"], [3.4, "page 48: a <b>KNIGHT</b> rides past"], [5.6, "page 210: you fall through a <b>CELL</b>"],
  [7.8, "page 455: <b>THE</b> train from every word problem"], [10.0, "page 600. <b>12 hours</b> later."], [11.0, "and you remember… <b>nothing</b>"], [12.0, "so you drop it into <b>UNSPOOL.CC</b>"],
  [13.6, "every chapter → a <b>short reel</b>"], [15.3, "a <b>quiz</b> after each one"], [16.5, "and this time it <b>sticks</b>"], [17.5, "send this to a friend with a <b>test tomorrow</b>"]];
const BUB = [[0.7, 2.1, "600 pages??", 330, 470, "dl"], [4.0, 5.5, "wrong century, kid", 380, 380, "dl"], [6.1, 7.7, "I'm the powerhouse!", 350, 520, "dl"], [8.5, 9.9, "NOT THIS TRAIN", 120, 360, "dl"],
  [10.9, 12.0, "uh… the cover was green?", 130, 470, "dl"]];
const READ = (t) => { const P = [[0, 0], [3.4, 1], [3.4, 48], [5.6, 120], [5.6, 210], [7.8, 300], [7.8, 455], [10.0, 600]]; let p = 0; for (let i = 0; i < P.length - 1; i++) if (t >= P[i][0] && t < P[i + 1][0]) p = mix(P[i][1], P[i + 1][1], (t - P[i][0]) / Math.max(1e-6, P[i + 1][0] - P[i][0])); if (t >= 10) p = 600; return Math.round(p); };
const fmtT = (m) => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
function hud(t) {
  if (t < 2.2 || t >= 17.5) return "";
  if (t < 12.0) { const p = READ(t); const head = t < 3.4 ? "—" : t < 5.6 ? "ch 3" : t < 7.8 ? "ch 8" : t < 10.0 ? "ch 19" : "nothing";
    return `<div class="hud"><div><small>PAGE</small>${p} / 600</div><div><small>READING</small>${fmtT(p * 1.26)} h</div><div><small>IN YOUR HEAD</small><span style="color:${t >= 10 ? "#ff6b6b" : "#fff"}">${head}</span></div></div>`; }
  const lt = t - 12.0, n = lt < 1.3 ? 0 : Math.min(6, 1 + Math.floor((lt - 1.3) / 0.55)), q = [0, 1, 2, 3, 4, 5].filter((i) => quizOn(lt, i)).length;
  return `<div class="hud" style="border-color:#b6f24a"><div><small style="color:#b6f24a">REELS</small>${n} / 6</div><div><small style="color:#b6f24a">QUIZZES</small>${q} ✓</div><div><small style="color:#b6f24a">IN YOUR HEAD</small><span style="color:${q ? "#b6f24a" : "#fff"}">${q ? `${q} chapter${q > 1 ? "s" : ""}` : "—"}</span></div></div>`;
}
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i]; g.setTransform(1, 0, 0, 1, 0, 0); SC[name](t - t0);
  let h = "";
  // timer chip: reading time (the joke: 12 hours of it), then the unspool.cc badge takes its place
  if (t >= 2.2 && t < 12.0) h += `<div class="chip"><span>⏱ ${fmtT(READ(t) * 1.26)}</span></div>`;
  if (t >= 12.0) { const k = outBack(clamp((t - 12.0) / 0.35)); h += `<div class="chip"><span style="background:#b6f24a;gap:0;transform:scale(${k})">unspool<span style="opacity:.55;padding:0;background:none;box-shadow:none">.cc</span></span></div>`; }
  let c = null; for (const x of CAP) if (t >= x[0]) c = x; if (c) { const k = clamp((t - c[0]) / 0.12); h += `<div class="cap" style="transform:scale(${0.85 + 0.15 * outBack(k)})">${c[1]}</div>`; }
  for (const [a, b, s, x, y, cls] of BUB) if (t >= a && t < b) { const k = outBack(clamp((t - a) / 0.2)); h += `<div class="bub ${cls}" style="left:${x}px;top:${y}px;transform:scale(${k});transform-origin:20px 100%">${s}</div>`; }
  h += hud(t);
  if (t >= 17.5) { const k = outBack(clamp((t - 17.8) / 0.35)); h += `<div style="position:absolute;left:0;right:0;top:870px;text-align:center;transform:scale(${k})"><span style="display:inline-block;background:#fff;border:5px solid ${INK};border-radius:20px;padding:14px 28px;box-shadow:5px 6px 0 ${INK}"><span style="display:block;font:800 52px Arc;color:${INK}">unspool.cc</span><span style="display:block;font:800 24px Arc;color:#2a8a4a">turn your notes into reels</span></span></div>`; }
  ov.innerHTML = h;
};
document.fonts.load("800 40px Arc").then(() => { window.renderAt(0); setTimeout(() => (window.ready = true), 60); });
