// "Uranus facts" (37s): deadpan narrated space explainer, word-by-word captions with pink highlights.
// Every fact is checkable: H2S clouds (Irwin et al., Nature Astronomy 2018), coldest planetary atmosphere ~-224°C
// (Voyager 2), ~98° tilt likely from a giant impact, faint rings, Voyager 2 the only spacecraft to visit (Jan 1986).
// Ends: textbook page -> reel -> unspool.cc. Our kid appears with the magnifying glass and on the end card.
window.DUR = 38;
const PINK = "#ff5fa8", LIME = "#b6f24a";
const SH = [["gas", 0], ["h2s", 5.0], ["cold", 10.7], ["hit", 16.9], ["rings", 22.4], ["voyager", 26.7], ["cta", 32.5]];

function space(t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0a1230"); gr.addColorStop(1, "#141d4a"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { const x = rnd(i) * W, y = rnd(i + 99) * H, tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + rnd(i + 7)) + i)); g.globalAlpha = tw * 0.8; circ(x, y, rnd(i + 3) * 1.8 + 0.6, "#fff", null); }
  g.globalAlpha = 1;
}
// Uranus: pale cyan ball, soft glow, faint bands that tilt with the axis
function uranus(x, y, r, { tilt = 0, axis = false, rings = 0, glow = 1 } = {}) {
  const halo = g.createRadialGradient(x, y, r * 0.8, x, y, r * 1.6); halo.addColorStop(0, `rgba(160,240,240,${0.28 * glow})`); halo.addColorStop(1, "rgba(160,240,240,0)"); g.fillStyle = halo; g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
  if (rings > 0) ringSet(x, y, r, tilt, rings, "back");
  const body = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); body.addColorStop(0, "#d8fbf8"); body.addColorStop(0.6, "#a4e3e0"); body.addColorStop(1, "#6fb9bd");
  circ(x, y, r, body, null);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.translate(x, y); g.rotate(tilt);
  for (let k = -4; k <= 4; k++) { g.fillStyle = k % 2 ? "rgba(255,255,255,.10)" : "rgba(60,140,150,.10)"; g.fillRect(-r, k * r * 0.2 - r * 0.06, r * 2, r * 0.12); }
  g.restore();
  if (axis) { g.save(); g.translate(x, y); g.rotate(tilt); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -r * 1.35); g.lineTo(0, r * 1.35); g.stroke(); g.restore(); }
  if (rings > 0) ringSet(x, y, r, tilt, rings, "front");
}
function ringSet(x, y, r, tilt, a, half) { g.save(); g.translate(x, y); g.rotate(tilt + Math.PI / 2); g.strokeStyle = `rgba(230,250,255,${a})`;
  for (let k = 0; k < 4; k++) { g.lineWidth = (k === 3 ? 3 : 1.6) * (a > 0.9 ? 2.2 : 1); g.beginPath(); g.ellipse(0, 0, r * (1.35 + k * 0.12), r * (0.28 + k * 0.025), 0, half === "back" ? Math.PI : 0, half === "back" ? Math.PI * 2 : Math.PI); g.stroke(); } g.restore(); }
function puff(x, y, r, a) { g.globalAlpha = a; circ(x, y, r, "#b8e986", null); circ(x + r * 0.7, y - r * 0.3, r * 0.8, "#c8f29a", null); circ(x - r * 0.6, y - r * 0.2, r * 0.7, "#a9dc76", null); g.globalAlpha = 1; }
function stink(x, y, t, n = 3, col = "rgba(184,233,134,.9)") { g.strokeStyle = col; g.lineWidth = 5; g.lineCap = "round"; for (let i = 0; i < n; i++) { const ox = x + (i - (n - 1) / 2) * 34; g.beginPath(); for (let k = 0; k <= 12; k++) { const yy = y - k * 7, xx = ox + Math.sin(k * 0.9 + t * 6 + i) * 8; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } }
function voyager(x, y, s, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  limb(-90, 0, 90, 0, "#c9c9c9", 4); limb(20, 0, 60, 60, "#c9c9c9", 3); rr(-18, -14, 36, 28, 4, "#d9a441", INK, 3);
  g.beginPath(); g.ellipse(-4, -40, 46, 16, 0, 0, 7); g.fillStyle = "#f2f2f2"; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); limb(-4, -40, -4, -14, "#c9c9c9", 3); g.restore(); }
function astroKid(x, y, s, t, lens) { // our kid in a space helmet, holding a magnifying glass
  kid(x, y, s, { pose: "stand", face: "shock", t });
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = 0.35; circ(0, -66, 58, "#bfe8ff", "#fff", 5); g.globalAlpha = 1; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 5; g.beginPath(); g.arc(-18, -88, 26, Math.PI * 1.1, Math.PI * 1.5); g.stroke(); g.restore();
  if (lens) { const [lx, ly, lr] = lens; limb(x - 40 * s, y + 20 * s, lx + lr * 0.7, ly + lr * 0.7, "#8a5a36", 12); circ(lx, ly, lr, null, "#2b2b3a", 12); }
}
const SC = {
  gas(lt, t) { space(t); uranus(360, 520, 150, { tilt: 0.1 });
    for (let i = 0; i < 6; i++) { const u = clamp((lt - 1.5 - i * 0.25) / 2.6); if (u <= 0) continue; const ang = -0.5 - i * 0.45; puff(360 + Math.cos(ang) * (160 + u * 170), 520 + Math.sin(ang) * (160 + u * 120) - u * 40, 22 + u * 18, (1 - u) * 0.9); }
    if (lt > 3.0) stink(360, 360, t, 3); },
  h2s(lt, t) { space(t); const k = ease(lt / 0.6); uranus(mix(360, 250, k), mix(520, 470, k), mix(150, 110, k), { tilt: 0.1 }); stink(mix(360, 250, k), mix(360, 345, k), t, 3);
    const m = outBack(clamp((lt - 1.1) / 0.4)); g.save(); g.translate(520, 450); g.scale(m, m); limb(0, 0, -62, 58, "#ddd", 8); limb(0, 0, 62, 58, "#ddd", 8); circ(0, 0, 50, "#f5d33a"); txt("S", 0, 2, 44, INK); circ(-62, 58, 30, "#fff"); txt("H", -62, 60, 30, INK); circ(62, 58, 30, "#fff"); txt("H", 62, 60, 30, INK); g.restore();
    const e = outBack(clamp((lt - 3.8) / 0.4)); if (e > 0) { g.save(); g.translate(560, 700); g.scale(e, e); g.beginPath(); g.ellipse(0, 0, 44, 56, 0, 0, 7); g.fillStyle = "#f6efe2"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.moveTo(-40, -6); for (let i = 0; i < 6; i++) g.lineTo(-40 + i * 16, i % 2 ? -22 : -4); g.stroke(); g.restore(); stink(560, 630, t, 2); } },
  cold(lt, t) { space(t); uranus(280, 520, 140, { tilt: 0.1 });
    for (let i = 0; i < 10; i++) { const a = i * 0.63 + t * 0.2, rr2 = 175 + Math.sin(t * 2 + i) * 8; g.globalAlpha = 0.8; txt("✳", 280 + Math.cos(a) * rr2, 520 + Math.sin(a) * rr2, 22, "#dff6ff"); } g.globalAlpha = 1;
    const k = ease((lt - 1.2) / 2.6); rr(555, 330, 50, 360, 25, "#f4f4f4"); circ(580, 720, 44, "#4aa3ff"); g.fillStyle = "#4aa3ff"; g.fillRect(568, mix(360, 640, k), 24, 720 - mix(360, 640, k)); g.strokeStyle = INK; g.lineWidth = 3; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(555, 370 + i * 45); g.lineTo(575, 370 + i * 45); g.stroke(); }
  },
  hit(lt, t) { space(t); const tilt = 0.1 + ease((lt - 2.3) / 1.9) * (98 * Math.PI / 180 - 0.1), shake = lt > 1.3 && lt < 1.8 ? Math.sin(lt * 90) * 10 * (1.8 - lt) * 2 : 0;
    uranus(360 + shake, 520, 140, { tilt, axis: true });
    if (lt < 1.4) { const u = clamp(lt / 1.4), ax = mix(-80, 250, u), ay = mix(120, 430, u); g.strokeStyle = "rgba(255,200,120,.5)"; g.lineWidth = 10; g.beginPath(); g.moveTo(ax - 120, ay - 110); g.lineTo(ax, ay); g.stroke(); circ(ax, ay, 34, "#8a7a6a"); circ(ax - 10, ay - 8, 7, "#6d5f52", null); }
    if (lt > 1.3 && lt < 2.0) { const f = (lt - 1.3) / 0.7; g.globalAlpha = 1 - f; circ(250, 430, 40 + f * 160, "#fff4c2", null); g.globalAlpha = 1; for (let i = 0; i < 8; i++) { const a = i * 0.8; circ(250 + Math.cos(a) * f * 200, 430 + Math.sin(a) * f * 200, 10 * (1 - f) + 2, "#bba98f", null); } }
    if (lt > 4.3) { g.globalAlpha = clamp((lt - 4.3) * 4); txt("TILTED 98°", 360, 760, 30, "#dff6ff"); g.globalAlpha = 1; } },
  rings(lt, t) { space(t); const tilt = 98 * Math.PI / 180; uranus(330, 520, 140, { tilt, rings: 0.12 });
    if (lt > 1.7) { const k = ease((lt - 1.7) / 0.7), lx = 410, ly = 520, lr = 85; astroKid(mix(820, 590, k), 700, 0.85, t, k > 0.6 ? [lx, ly, lr] : null);
      if (k > 0.6) { g.save(); g.beginPath(); g.arc(lx, ly, lr - 6, 0, 7); g.clip(); g.fillStyle = "rgba(20,30,70,.6)"; g.fillRect(lx - lr, ly - lr, lr * 2, lr * 2); g.translate(lx, ly); g.scale(1.3, 1.3); g.translate(-lx, -ly); g.lineWidth = 4; uranus(330, 520, 140, { tilt, rings: 1, glow: 0 }); ringSet(330, 520, 140, tilt, 1, "front"); ringSet(330, 520, 140, tilt, 1, "back"); g.restore(); circ(lx, ly, lr, null, "#2b2b3a", 12); } } },
  voyager(lt, t) { space(t); uranus(260, 560, 120, { tilt: 98 * Math.PI / 180, rings: 0.18 });
    const u = clamp(lt / 5.6), vx = mix(760, -80, u), vy = mix(380, 470, u) + Math.sin(u * Math.PI) * -30;
    g.setLineDash([6, 12]); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 3; g.beginPath(); g.moveTo(760, 380); g.quadraticCurveTo(360, 360, vx, vy); g.stroke(); g.setLineDash([]);
    voyager(vx, vy, 0.9, -0.15); },
  cta(lt, t) { space(t); const k = ease((lt - 0.2) / 0.7);
    // a textbook page that becomes a phone playing this very reel
    g.save(); g.translate(mix(330, 430, k), 520); g.rotate((1 - k) * -0.12); const w = mix(300, 250, k), h = mix(390, 470, k);
    if (k < 0.5) { rr(-w / 2, -h / 2, w, h, 6, "#fbf7ec"); txt("CH 9 · URANUS", 0, -h / 2 + 40, 22, INK); g.fillStyle = "#9aa0aa"; for (let i = 0; i < 7; i++) g.fillRect(-w / 2 + 24, -h / 2 + 80 + i * 26, w - 48 - (i % 3) * 30, 8); uranus(0, 90, 50, { tilt: 1.7, glow: 0 }); }
    else { rr(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 38, "#111", "#2a2a2a", 8); g.save(); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 30); g.clip(); g.fillStyle = "#0a1230"; g.fillRect(-w / 2, -h / 2, w, h); uranus(0, -30, 70, { tilt: 1.7, rings: 0.6 }); txt("Uranus has had", 0, 110, 20, "#fff"); txt("one visitor.", 0, 138, 20, PINK); g.restore(); }
    g.restore();
    kid(160, 650, 0.85, { pose: "cheer", face: "happy", t }); },
};

// captions: short chunks with pink highlights, timed to the voice
const CAP = [[0.22, "Uranus is"], [1.2, "full of <b>gas.</b>"], [3.1, "And Uranus <b>smells.</b>"], [5.06, "Its clouds are made of"], [6.12, "<b>hydrogen sulfide,</b>"], [7.56, "the same gas that makes"], [8.84, "<b>rotten eggs</b> stink."],
  [10.72, "Uranus is also"], [12.08, "the <b>coldest</b> planet."], [13.5, "<b>−224°C.</b>"], [16.98, "Scientists think"], [17.8, "something <b>hit</b> Uranus"], [19.06, "so <b>hard,</b>"], [19.9, "it's been <b>lying on its side</b>"], [21.24, "ever since."],
  [22.52, "Uranus does have <b>rings.</b>"], [24.38, "You just have to"], [24.96, "look really <b>closely.</b>"], [26.78, "And Uranus has had"], [27.96, "exactly <b>one visitor.</b>"], [29.94, "<b>Voyager 2,</b> 1986."],
  [32.69, "Turn any <b>textbook page</b>"], [34.05, "into a <b>reel</b> like this"], [35.49, "at <b>unspool.cc</b>"]];
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; SC[name](t - t0, t);
  const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  let h = "";
  let c = null; for (const x of CAP) if (t >= x[0] - 0.03) c = x;
  if (c && t < 37.6) { const k = clamp((t - c[0]) / 0.12); h += `<div class="cap" style="opacity:${0.4 + 0.6 * k};transform:translateY(${(1 - k) * 8}px)">${c[1]}</div>`; }
  if (name === "voyager" && t > 29.9) h += `<div class="tag" style="top:250px;opacity:${clamp((t - 29.9) * 4)}"><span>VOYAGER 2 · JANUARY 1986</span></div>`;
  if (t >= 35.4) { const k = outBack(clamp((t - 35.4) / 0.35)); h += `<div style="position:absolute;left:0;right:0;top:120px;text-align:center;transform:scale(${k})"><span style="display:inline-block;background:${LIME};color:#08110e;font:800 54px Arc;padding:10px 28px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.45)">unspool<span style="opacity:.55">.cc</span></span><div style="margin-top:12px;color:#fff;font:800 26px Arc">turn your notes into reels</div></div>`; }
  ov.innerHTML = h;
};
document.fonts.load("800 40px Arc").then(() => { window.renderAt(0); setTimeout(() => (window.ready = true), 60); });
