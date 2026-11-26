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
