// "What if your textbook turned into REELS?" (20s, no voiceover: everything reads on screen so any audio can play over it)
// The textbook -> reels transformation is the hook at 0s, then repeats six different ways.
window.DUR = 20;
const cv = document.getElementById("cv"), g = cv.getContext("2d"), ov = document.getElementById("ov");
const W = 720, H = 1280, INK = "#14141f";
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const outBack = (x) => { x = clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

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

// ---------- v2: the textbook -> reels transformation, first thing and then six more ways ----------
const SH = [["ribbon", 0], ["history", 2.6], ["bio", 5.0], ["math", 7.4], ["notes", 9.8], ["backpack", 12.2], ["quiz", 14.8], ["end", 17.5]];
const LIME = "#b6f24a";
function book(x, y, w, h, col, title, sub = "") { rr(x, y, w, h, 12, col); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x + 4, y + 4, 18, h - 8); rr(x + 12, y + h - 24, w - 24, 14, 4, "#fff8e6", INK, 3);
  txt(title, x + w / 2 + 8, y + h * 0.36, Math.min(34, w / 6), "#fff"); if (sub) txt(sub, x + w / 2 + 8, y + h * 0.36 + 40, Math.min(22, w / 9), "#ffd23f"); }
// a vertical reel card: progress bars, a title, a picture, a play triangle
function reel(x, y, w, h, title, pic, rot = 0, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot);
  rr(-w / 2, -h / 2, w, h, w * 0.12, "#0d1a14", LIME, Math.max(3, w * 0.03));
  for (let s = 0; s < 3; s++) { g.fillStyle = s === 0 ? LIME : "rgba(255,255,255,.3)"; g.fillRect(-w / 2 + w * 0.1 + s * w * 0.28, -h / 2 + h * 0.05, w * 0.24, Math.max(2, h * 0.012)); }
  txt(title, 0, -h / 2 + h * 0.16, w * 0.13, LIME);
  if (pic) { g.save(); g.translate(0, h * 0.04); g.scale(w / 200, w / 200); pic(); g.restore(); }
  g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.moveTo(-w * 0.07, h * 0.3); g.lineTo(w * 0.09, h * 0.36); g.lineTo(-w * 0.07, h * 0.42); g.fill();
  g.restore(); }
const PIC = {
  castle() { g.fillStyle = "#b99a62"; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.rect(-60, -30, 120, 80); g.fill(); g.stroke(); for (let c = 0; c < 4; c++) { g.beginPath(); g.rect(-60 + c * 34, -52, 22, 24); g.fill(); g.stroke(); } rr(-14, 14, 28, 36, 12, INK, null); },
  knight() { rr(-26, -10, 52, 70, 14, "#a9b4c2"); circ(0, -36, 28, "#a9b4c2"); rr(-18, -44, 36, 8, 3, INK, null); limb(30, 10, 40, -80, "#8a5a36", 8); },
  cell() { g.beginPath(); g.ellipse(0, 0, 80, 46, -0.3, 0, 7); g.fillStyle = "#ff8fa3"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.lineWidth = 4; g.beginPath(); for (let k = -60; k <= 60; k += 30) { g.moveTo(k, -30); g.quadraticCurveTo(k + 12, 0, k, 30); } g.stroke(); },
  train() { rr(-80, -30, 160, 70, 12, "#ffd23f"); for (let w = 0; w < 3; w++) rr(-66 + w * 48, -18, 36, 28, 6, "#bfe4ff", INK, 4); circ(-50, 46, 13, "#444"); circ(50, 46, 13, "#444"); },
  atom() { g.lineWidth = 5; g.strokeStyle = LIME; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(0, 0, 70, 24, k * 1.05, 0, 7); g.stroke(); } circ(0, 0, 12, "#ff6b6b"); },
  globe() { circ(0, 0, 56, "#4aa3ff"); g.fillStyle = "#3cc46b"; g.beginPath(); g.ellipse(-14, -10, 22, 16, 0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(22, 20, 16, 12, -0.3, 0, 7); g.fill(); },
  check() { circ(0, 0, 54, "#2bb673"); g.strokeStyle = "#fff"; g.lineWidth = 14; g.lineCap = "round"; g.beginPath(); g.moveTo(-24, 0); g.lineTo(-6, 20); g.lineTo(28, -20); g.stroke(); },
  scribble() { g.strokeStyle = "#2a3a8a"; g.lineWidth = 5; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-70, -40 + k * 26); for (let x = -70; x < 70; x += 14) g.lineTo(x, -40 + k * 26 + Math.sin(x * 0.3 + k) * 6); g.stroke(); } },
};
const sidekid = (lt, face, pose = "stand") => kid(120, 770, 0.92, { pose, face, t: lt });
const bg = (col) => { g.fillStyle = col; g.fillRect(0, 0, W, H); };
const SC = {
  ribbon(lt) { // 1. the textbook opens and a ribbon of reels spools straight out of it
    bg("#ffe3c4"); g.fillStyle = "#c98a5a"; g.fillRect(0, 880, W, H - 880);
    const open = ease((lt - 0.25) / 0.35), bx = 390, by = 690;
    book(bx - 100, by - 150 - open * 10, 220, 270, "#2f7d5b", "TEXTBOOK", "600 PAGES");
    if (open > 0) { g.save(); g.globalAlpha = open; rr(bx - 96, by - 158, 212, 36, 8, "#fff8e6", INK, 4); g.restore(); }
    const T = [["CH 1", PIC.globe], ["CH 2", PIC.castle], ["CH 3", PIC.cell], ["CH 4", PIC.atom], ["CH 5", PIC.train]];
    for (let i = 4; i >= 0; i--) { const u = ease((lt - 0.45 - i * 0.18) / 0.5); if (u <= 0) continue; const fx = 610 - i * 108, fy = 455;
      const cx = mix(bx, fx, 0.5), cy = 360, x = (1 - u) * (1 - u) * bx + 2 * (1 - u) * u * cx + u * u * fx, y = (1 - u) * (1 - u) * (by - 170) + 2 * (1 - u) * u * cy + u * u * fy;
      reel(x, y, mix(50, 100, u), mix(50, 100, u) * 1.75, T[i][0], T[i][1], (1 - u) * 0.6 * (i % 2 ? 1 : -1) + Math.sin(lt * 3 + i) * 0.04, clamp(u * 4)); }
    sidekid(lt, lt > 0.6 ? "shock" : "neutral");
  },
  history(lt) { // 2. pages tear out one by one and snap into a row of reels
    bg("#e8cf9a"); g.fillStyle = "#cfb27a"; for (let i = 0; i < 6; i++) g.fillRect(0, 120 + i * 190, W, 4);
    book(250, 760, 200, 120, "#8a4a2a", "HISTORY");
    const SL = [[230, 560, "1066", PIC.castle], [400, 560, "KNIGHTS", PIC.knight], [570, 560, "EMPIRES", PIC.globe]];
    SL.forEach(([x, y, t, p], i) => { const k = ease((lt - 0.15 - i * 0.35) / 0.45); if (k <= 0) return;
      const sx = mix(350, x, k), sy = mix(800, y, k), w = mix(150, 140, k), h = mix(100, 245, k);
      if (k < 1) { g.save(); g.translate(sx, sy); g.rotate((1 - k) * 0.8 * (i - 1)); rr(-w / 2, -h / 2, w, h, 8, k < 0.5 ? "#fff8e6" : "#0d1a14", k < 0.5 ? INK : LIME, 4); g.restore(); }
      else reel(x, y, 140, 245, t, p); });
    sidekid(lt, "happy");
  },
  bio(lt) { // 3. the book morphs into a phone that's already playing the reel
    bg("#9fe0a8"); for (let i = 0; i < 7; i++) circ(60 + rnd(i) * 600, 140 + rnd(i + 5) * 800, 20 + rnd(i + 2) * 26, "rgba(60,160,90,.4)", null);
    const k = ease((lt - 0.2) / 0.6), cx = 400, cy = 600, w = mix(240, 250, k), h = mix(300, 450, k);
    g.save(); g.translate(cx, cy); g.rotate((1 - k) * -0.25 + Math.sin(k * Math.PI) * 0.4);
    if (k < 0.5) book(-w / 2, -h / 2, w, h, "#2f9a58", "BIOLOGY"); else { rr(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 40, "#111", "#2a2a2a", 8); reel(0, 0, w, h, "THE CELL", PIC.cell); }
    g.restore();
    sidekid(lt, k > 0.5 ? "happy" : "shock");
  },
  math(lt) { // 4. the word-problem train drives off the worksheet and into a reel
    bg("#dfeaff"); g.strokeStyle = "rgba(80,120,200,.25)"; g.lineWidth = 3; for (let x = 0; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    rr(150, 380, 300, 380, 8, "#fff"); txt("WORKSHEET 4", 300, 420, 24, INK); g.fillStyle = "#555"; g.font = "800 18px Arc"; g.textAlign = "left"; ["A train leaves at 3:00 PM", "going 60 mph. Another", "leaves at 4:00 PM going", "80 mph. When does…"].forEach((l, i) => g.fillText(l, 172, 470 + i * 30));
    const k = ease((lt - 0.3) / 0.9); g.save(); g.translate(mix(300, 540, k), mix(660, 600, k)); g.scale(mix(0.9, 0.6, k), mix(0.9, 0.6, k)); if (k < 1) PIC.train(); g.restore();
    if (k > 0.7) reel(540, 600, 160, 280, "TRAINS", PIC.train, 0, clamp((k - 0.7) * 4));
    sidekid(lt, k > 0.8 ? "happy" : "neutral");
  },
  notes(lt) { // 5. snap your messy notes; they become a feed you swipe
    bg("#f6f3ea"); g.strokeStyle = "rgba(90,140,220,.35)"; g.lineWidth = 3; for (let y = 120; y < H; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.strokeStyle = "rgba(230,80,80,.4)"; g.beginPath(); g.moveTo(90, 0); g.lineTo(90, H); g.stroke();
    if (lt < 0.7) { rr(220, 400, 320, 420, 6, "#fff"); g.save(); g.translate(380, 610); g.scale(1.6, 1.6); PIC.scribble(); g.restore(); txt("my notes", 380, 440, 24, "#2a3a8a"); }
    if (lt > 0.55 && lt < 0.8) { g.fillStyle = `rgba(255,255,255,${1 - Math.abs(lt - 0.67) * 8})`; g.fillRect(0, 0, W, H); }
    if (lt >= 0.7) { const sw = (lt - 0.7) * 1.6, n = Math.floor(sw), f = ease((sw - n) / 0.35), P = [["NOTES 1", PIC.scribble], ["NOTES 2", PIC.atom], ["NOTES 3", PIC.globe], ["NOTES 4", PIC.cell]];
      rr(260, 330, 280, 560, 40, "#111", "#2a2a2a", 8); g.save(); g.beginPath(); g.roundRect(268, 338, 264, 544, 34); g.clip();
      for (let j = 0; j < 2; j++) { const idx = Math.min(3, n + j); reel(400, 610 + (j - f) * 544, 264, 544, P[idx][0], P[idx][1]); } g.restore(); }
    sidekid(lt, lt > 0.8 ? "happy" : "neutral");
  },
  backpack(lt) { // 6. a whole backpack of books gets pulled into unspool.cc; reels fountain out
    bg("#12131f"); streaks(lt, "rgba(182,242,74,.2)", 12, 1500);
    rr(290, 520, 220, 380, 34, "#111", "#2a2a2a", 8); txt("unspool.cc", 400, 580, 28, "#f4f4ea"); circ(400, 720, 54 + Math.sin(lt * 10) * 4, null, LIME, 6);
    const B = [["#2f7d5b", "BIO"], ["#8a4a2a", "HIST"], ["#3a5aa8", "MATH"], ["#a33a7a", "CHEM"], ["#d08a1a", "ENG"]];
    B.forEach(([c, t], i) => { const k = ease((lt - i * 0.22) / 0.6), a0 = i * 1.25, r = mix(300, 0, k), ang = a0 + k * 4; if (k >= 1) return; g.save(); g.translate(400 + Math.cos(ang) * r, 720 + Math.sin(ang) * r * 0.8); g.rotate(ang); g.scale(1 - k * 0.8, 1 - k * 0.8); book(-55, -70, 110, 140, c, t); g.restore(); });
    for (let i = 0; i < 8; i++) { const u = clamp((lt - 0.7 - i * 0.12) / 1.0); if (u <= 0) continue; const dir = (i % 2 ? 1 : -1) * (0.4 + rnd(i) * 0.9); reel(400 + dir * u * 230, 520 - u * 90 + u * u * 60, 90 + u * 30, (90 + u * 30) * 1.75, ["BIO", "HIST", "MATH", "CHEM", "ENG"][i % 5], [PIC.cell, PIC.castle, PIC.train, PIC.atom, PIC.globe][i % 5], dir * u * 0.5, clamp(u * 4) * clamp((1 - u) * 4 + 0.3)); }
    sidekid(lt, "shock");
  },
  quiz(lt) { // 7. every reel flips over into a quiz you get right
    bg("#0d1a14"); const C = [[230, "1066", PIC.castle], [400, "THE CELL", PIC.cell], [570, "TRAINS", PIC.train]];
    C.forEach(([x, t, p], i) => { const k = clamp((lt - 0.3 - i * 0.55) / 0.35), sx = Math.abs(Math.cos(k * Math.PI)); g.save(); g.translate(x, 600); g.scale(Math.max(0.02, sx), 1);
      if (k < 0.5) reel(0, 0, 140, 245, t, p); else { rr(-70, -122, 140, 245, 18, "#13241b", LIME, 4); txt("QUIZ", 0, -84, 22, LIME); g.save(); g.scale(0.9, 0.9); PIC.check(); g.restore(); txt("correct", 0, 86, 18, "#f4f4ea"); } g.restore(); });
    sidekid(lt, "happy", "cheer");
  },
  end(lt) { bg("#ffe3c4"); g.fillStyle = "#c98a5a"; g.fillRect(0, 880, W, H - 880);
    book(150, 600, 180, 220, "#2f7d5b", "TEXTBOOK"); g.save(); g.translate(250, 0); g.strokeStyle = INK; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(140, 710); g.lineTo(200, 710); g.moveTo(180, 690); g.lineTo(202, 710); g.lineTo(180, 730); g.stroke(); g.restore();
    const k = outBack(clamp(lt / 0.4)); g.save(); g.translate(540, 700); g.scale(k, k); rr(-95, -170, 190, 340, 30, "#111", "#2a2a2a", 7); reel(0, 0, 170, 320, "CH 1", PIC.globe); g.restore();
    kid(400, 820, 0.62, { pose: "cheer", face: "happy", t: lt }); },
};

// ---------- overlay ----------
const A = `<svg width="46" height="30" viewBox="0 0 46 30" style="vertical-align:middle;margin:0 6px"><path d="M4 15h34M26 4l12 11-12 11" fill="none" stroke="#14141f" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15h34M26 4l12 11-12 11" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CAP = [[0, "What if your textbook turned into <b>REELS?</b>"], [2.6, `History${A}<b>reels</b>`], [5.0, `Biology${A}<b>a reel</b>`], [7.4, `Math${A}<b>a reel</b>`],
  [9.8, `your messy notes${A}<b>reels</b>`], [12.2, `your whole backpack${A}<b>one feed</b>`], [14.8, "and every reel ends in a <b>quiz</b>"], [17.5, "turn your textbook into <b>reels</b>"]];
const BUB = [[0.9, 2.5, "wait WHAT", 70, 610, "dl"], [3.4, 4.9, "follow for part 2, peasant", 290, 380, "dl"], [5.8, 7.3, "I'm the powerhouse!", 400, 340, "dl"], [8.4, 9.7, "ohh, THAT's when they meet", 60, 600, "dl"],
  [12.9, 14.6, "my whole semester??", 60, 600, "dl"]];
const HUD = [[0, "TEXTBOOK", "600"], [2.6, "HISTORY", "212"], [5.0, "BIOLOGY", "340"], [7.4, "MATH", "180"], [9.8, "MY NOTES", "6"], [12.2, "5 BOOKS", "1,640"]];
const reelsShown = (t) => { if (t < 0.45) return 0; if (t < 2.6) return Math.min(5, Math.floor((t - 0.45) / 0.18) + 1); if (t < 5.0) return Math.min(3, Math.max(0, Math.ceil((t - 2.6 - 0.6) / 0.35))); if (t < 7.4) return t > 5.5 ? 1 : 0; if (t < 9.8) return t > 8.0 ? 1 : 0; if (t < 12.2) return t > 10.5 ? Math.min(4, 1 + Math.floor((t - 10.5) * 1.6)) : 0; return Math.min(8, Math.max(0, Math.ceil((t - 12.9) / 0.12))); };
function hud(t) {
  if (t >= 17.5) return "";
  if (t >= 14.8) { const q = [0, 1, 2].filter((i) => t - 14.8 > 0.3 + i * 0.55 + 0.18).length; return `<div class="hud" style="border-color:${LIME}"><div><small style="color:${LIME}">REELS</small>3</div><div><small style="color:${LIME}">QUIZZES</small>${q} / 3 ✓</div></div>`; }
  let h = HUD[0]; for (const x of HUD) if (t >= x[0]) h = x;
  return `<div class="hud"><div><small>BOOK</small>${h[1]}</div><div><small>PAGES</small>${h[2]}</div><div><small style="color:${LIME}">REELS</small><span style="color:${LIME}">${reelsShown(t)}</span></div></div>`;
}
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; SC[name](t - t0);
  let h = "";
  if (t < 12.2) h += `<div class="chip"><span>⏱ 0:${String(Math.floor(t)).padStart(2, "0")}</span></div>`;
  else { const k = outBack(clamp((t - 12.2) / 0.35)); h += `<div class="chip"><span style="background:${LIME};gap:0;transform:scale(${k})">unspool<span style="opacity:.55;padding:0;background:none;box-shadow:none">.cc</span></span></div>`; }
  let c = null; for (const x of CAP) if (t >= x[0]) c = x; if (c) { const k = clamp((t - c[0]) / 0.12); h += `<div class="cap" style="transform:scale(${0.85 + 0.15 * outBack(k)})">${c[1]}</div>`; }
  for (const [a, b, s, x, y, cls] of BUB) if (t >= a && t < b) { const k = outBack(clamp((t - a) / 0.2)); h += `<div class="bub ${cls}" style="left:${x}px;top:${y}px;transform:scale(${k});transform-origin:20px 100%">${s}</div>`; }
  h += hud(t);
  if (t >= 17.5) { const k = outBack(clamp((t - 17.8) / 0.35)); h += `<div style="position:absolute;left:0;right:0;top:930px;text-align:center;transform:scale(${k})"><span style="display:inline-block;background:#fff;border:5px solid ${INK};border-radius:20px;padding:12px 28px;box-shadow:5px 6px 0 ${INK}"><span style="display:block;font:800 52px Arc;color:${INK}">unspool.cc</span><span style="display:block;font:800 24px Arc;color:#2a8a4a">turn your notes into reels</span></span></div>`; }
  ov.innerHTML = h;
};
document.fonts.load("800 40px Arc").then(() => { window.renderAt(0); setTimeout(() => (window.ready = true), 60); });
