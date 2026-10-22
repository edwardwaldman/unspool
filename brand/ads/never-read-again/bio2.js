(() => {
// A feed of four biology reels + a quick check, drawn in HTML at 360x640. T = seconds into the feed.
const FEED = [
  { s: 0, d: 2.853, tag: "BIO · UNIT 4", title: "MITOCHONDRIA", say: "Mitochondria make ATP. That's your cell's energy.", art: "mito", n: 12 },
  { s: 3.303, d: 2.339, tag: "BIO · UNIT 6", title: "TRANSCRIPTION", say: "DNA to mRNA? That's transcription.", art: "dna", n: 19 },
  { s: 6.092, d: 2.314, tag: "BIO · UNIT 6", title: "TRANSLATION", say: "mRNA to protein? That's translation.", art: "ribo", n: 20 },
  { s: 8.856, d: 2.91, tag: "BIO · UNIT 3", title: "PHOTOSYNTHESIS", say: "Light plus CO2 makes glucose. Photosynthesis.", art: "leaf", n: 9 },
];
const QUIZ_AT = 12.0, FEED_DUR = 14.6;
const _c = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), _e = (x) => { x = _c(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const _b = (x) => { x = _c(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const KEY = /mitochondria|ATP|energy|DNA|mRNA|transcription|translation|protein|glucose|photosynthesis|light|CO2/i;
function art(kind, r) {
  if (kind === "mito") {
    const atp = Array.from({ length: 7 }, (_, i) => { const q = (r * 0.7 + i / 7) % 1, a = i * 0.9 + r * 0.3; return `<div style="position:absolute;left:${158 + Math.cos(a) * q * 150}px;top:${290 + Math.sin(a) * q * 160}px;background:#c9e64a;color:#10200f;font:800 15px 'DejaVu Sans';padding:3px 7px;border-radius:8px;opacity:${(1 - q) * _c(r / 0.6)}">ATP</div>`; }).join("");
    return `<svg style="position:absolute;left:40px;top:200px;transform:scale(${(1 + Math.sin(r * 5) * 0.03) * _b(r / 0.35)})" width="280" height="170" viewBox="0 0 280 170"><ellipse cx="140" cy="85" rx="130" ry="72" fill="#e08a4a" stroke="#ffd1a6" stroke-width="6"/><ellipse cx="140" cy="85" rx="110" ry="54" fill="#f2a564"/><path d="M40 85 q15 -40 30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#b5552a" stroke-width="7" fill="none" stroke-linecap="round"/></svg>${atp}`;
  }
  if (kind === "dna") {
    const helix = (y, ph) => { let p = ""; for (let x = 0; x <= 280; x += 4) p += `${x ? "L" : "M"}${x + 40} ${y + Math.sin(x / 22 + ph + r * 3) * 22}`; return p; };
    const m = _e((r - 0.7) / 0.8); let mr = ""; for (let x = 0; x <= 280 * m; x += 4) mr += `${x ? "L" : "M"}${x + 40} ${390 + Math.sin(x / 22 + r * 3) * 10}`;
    return `<svg style="position:absolute;inset:0" width="360" height="640"><path d="${helix(250, 0)}" stroke="#7ab8ff" stroke-width="6" fill="none"/><path d="${helix(250, Math.PI)}" stroke="#ff8fb3" stroke-width="6" fill="none"/>${Array.from({ length: 13 }, (_, i) => `<line x1="${50 + i * 22}" x2="${50 + i * 22}" y1="${250 + Math.sin((i * 22 + 10) / 22 + r * 3) * 22}" y2="${250 + Math.sin((i * 22 + 10) / 22 + Math.PI + r * 3) * 22}" stroke="#ffffff" stroke-opacity=".5" stroke-width="3"/>`).join("")}
      <text x="180" y="318" text-anchor="middle" font-family="DejaVu Sans" font-weight="800" font-size="30" fill="#c9e64a" opacity="${_c((r - 0.4) / 0.2)}">↓</text>
      ${mr ? `<path d="${mr}" stroke="#c9e64a" stroke-width="7" fill="none" stroke-linecap="round"/>` : ""}
      <text x="40" y="215" font-family="DejaVu Sans" font-weight="800" font-size="18" fill="#cfe">DNA</text><text x="40" y="430" font-family="DejaVu Sans" font-weight="800" font-size="18" fill="#c9e64a" opacity="${m}">mRNA</text></svg>`;
  }
  if (kind === "ribo") {
    const n = Math.floor(_c((r - 0.3) / 1.6) * 7);
    const beads = Array.from({ length: n }, (_, i) => `<circle cx="${170 - i * 24}" cy="${235 - i * 14}" r="11" fill="${["#ff8fb3", "#7ab8ff", "#c9e64a", "#ffc58a", "#e59cff"][i % 5]}"/>`).join("");
    return `<svg style="position:absolute;inset:0" width="360" height="640"><line x1="10" x2="350" y1="330" y2="330" stroke="#c9e64a" stroke-width="6"/>${Array.from({ length: 14 }, (_, i) => `<line x1="${20 + i * 24 - ((r * 40) % 24)}" x2="${20 + i * 24 - ((r * 40) % 24)}" y1="330" y2="318" stroke="#c9e64a" stroke-width="4"/>`).join("")}
      <ellipse cx="180" cy="300" rx="80" ry="45" fill="#8a6bd1"/><ellipse cx="180" cy="355" rx="95" ry="40" fill="#6f52b8"/>${beads}
      <text x="180" y="425" text-anchor="middle" font-family="DejaVu Sans" font-weight="800" font-size="18" fill="#fff">ribosome</text><text x="40" y="200" font-family="DejaVu Sans" font-weight="800" font-size="18" fill="#ffc58a" opacity="${_c(n / 3)}">protein</text></svg>`;
  }
  const k = _c((r - 0.3) / 0.8);
  return `<svg style="position:absolute;inset:0" width="360" height="640">${Array.from({ length: 8 }, (_, i) => { const a = i * 0.785 + r; return `<line x1="${292 + Math.cos(a) * 30}" y1="${215 + Math.sin(a) * 30}" x2="${292 + Math.cos(a) * 42}" y2="${215 + Math.sin(a) * 42}" stroke="#ffd34a" stroke-width="5" stroke-linecap="round"/>`; }).join("")}<circle cx="292" cy="215" r="22" fill="#ffd34a"/>
    <path d="M90 360 Q180 180 280 330 Q190 430 90 360 Z" fill="#3aa65a" stroke="#1f6e38" stroke-width="5"/><path d="M95 358 Q190 300 270 333" stroke="#1f6e38" stroke-width="4" fill="none"/>
    <text x="30" y="250" font-family="DejaVu Sans" font-weight="800" font-size="17" fill="#7ab8ff" opacity="${k}">H₂O + CO₂ →</text>
    <text x="180" y="470" text-anchor="middle" font-family="DejaVu Sans" font-weight="800" font-size="20" fill="#c9e64a" opacity="${_c((r - 1.2) / 0.3)}">→ glucose + O₂</text></svg>`;
}
function reelCard(R, r) {
  const words = R.say.split(" "), k = _c(r / R.d) * words.length;
  const cap = words.map((w, i) => `<span style="color:${i < k ? (KEY.test(w) ? "#c9e64a" : "#fff") : "rgba(255,255,255,.35)"}">${w}</span>`).join(" ");
  return `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#2f4f5a,#0e1418);overflow:hidden">
    <div style="position:absolute;left:16px;top:20px;background:#111;color:#fff;font:800 13px 'DejaVu Sans';padding:5px 9px;border-left:3px solid #c9e64a">${R.tag}</div>
    <div style="position:absolute;right:16px;top:22px;color:#cfe;font:700 13px 'DejaVu Sans';opacity:.8">unspool</div>
    <div style="position:absolute;left:0;right:0;top:120px;text-align:center;color:#c9e64a;font:900 ${R.title.length > 12 ? 24 : 28}px 'DejaVu Sans';transform:scale(${_b(r / 0.25)})">${R.title}</div>
    ${art(R.art, r)}
    <div style="position:absolute;left:18px;right:56px;bottom:110px;text-align:center;font:800 23px/1.25 'DejaVu Sans';text-shadow:0 2px 4px #000">${cap}</div>
    <div style="position:absolute;right:12px;bottom:200px;display:flex;flex-direction:column;gap:22px;color:#fff;font-size:30px;text-shadow:0 1px 3px #000">&#9829;<br>&#9993;<br>&#10148;</div>
    <div style="position:absolute;left:16px;bottom:24px;color:#fff;font:700 17px 'DejaVu Sans';text-shadow:0 1px 3px #000">unspool · Reel ${R.n} of 38</div>
    <div style="position:absolute;left:0;bottom:0;height:4px;width:${_c(r / R.d) * 100}%;background:#fff"></div></div>`;
}
function quizCard(r) {
  const pick = r > 1.3, opts = ["Translation", "Transcription", "Photosynthesis"];
  return `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#2a3f5c,#0d1320)">
    <div style="position:absolute;left:16px;top:20px;background:#111;color:#fff;font:800 13px 'DejaVu Sans';padding:5px 9px;border-left:3px solid #c9e64a">QUICK CHECK</div>
    <div style="position:absolute;left:24px;right:24px;top:120px;color:#fff;font:800 26px/1.25 'DejaVu Sans';transform:scale(${_b(r / 0.3)})">Which process makes mRNA from DNA?</div>
    ${opts.map((o, i) => `<div style="position:absolute;left:24px;right:24px;top:${270 + i * 78}px;border:3px solid ${pick && i === 1 ? "#3aa65a" : "rgba(255,255,255,.3)"};background:${pick && i === 1 ? "rgba(58,166,90,.3)" : "rgba(255,255,255,.06)"};border-radius:14px;padding:14px 16px;color:#fff;font:700 22px 'DejaVu Sans';transform:scale(${_b((r - 0.2 - i * 0.12) / 0.25)})">${String.fromCharCode(65 + i)}. ${o}${pick && i === 1 ? " ✓" : ""}</div>`).join("")}
    ${pick ? `<div style="position:absolute;left:0;right:0;top:530px;text-align:center;color:#3aa65a;font:900 30px 'DejaVu Sans';transform:scale(${_b((r - 1.3) / 0.25)})">Correct! 🔥</div>` : ""}</div>`;
}
/** The whole feed at time T: each reel, swiping up into the next, then the quiz. */
function bioFeed(T) {
  T = Math.max(0, Math.min(T, FEED_DUR));
  const cards = [...FEED.map((R) => ({ s: R.s, render: (r) => reelCard(R, r) })), { s: QUIZ_AT, render: quizCard }];
  let i = 0; for (let j = 0; j < cards.length; j++) if (T >= cards[j].s - 0.3) i = j;
  const cur = cards[i], prev = cards[i - 1], sw = i > 0 ? _e((T - (cur.s - 0.3)) / 0.3) : 1;
  let h = `<div style="position:absolute;inset:0;transform:translateY(${(1 - sw) * 640}px)">${cur.render(Math.max(0, T - cur.s))}</div>`;
  if (prev && sw < 1) h = `<div style="position:absolute;inset:0;transform:translateY(${-sw * 640}px)">${prev.render(T - prev.s)}</div>` + h;
  return `<div style="position:absolute;inset:0;overflow:hidden">${h}</div>`;
}
window.bioFeed = bioFeed; window.FEED_DUR = FEED_DUR;
})();
