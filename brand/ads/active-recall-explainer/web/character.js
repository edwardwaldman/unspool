// The explainer's character. If PNGs of the real character exist (web/char/neutral.png, talk.png, smile.png,
// wink.png, think.png: transparent background, same size and framing), they are used. Otherwise this draws an
// original placeholder anime girl ("Uni") in SVG with the same five expressions.
// draw(state) returns markup for a 400x560 box: { expr, talk 0..1, blink 0..1, t (seconds), tilt (deg) }.

export const EXPRESSIONS = ["neutral", "talk", "smile", "wink", "think"];
let images = null;
export async function loadCharacter() {
  const found = await Promise.all(EXPRESSIONS.map((e) => new Promise((r) => { const i = new Image(); i.onload = () => r([e, i.src]); i.onerror = () => r(null); i.src = `char/${e}.png`; })));
  const have = Object.fromEntries(found.filter(Boolean));
  if (have.neutral) images = Object.fromEntries(EXPRESSIONS.map((e) => [e, have[e] ?? have.neutral]));
  if (images) images.hasTalk = Boolean(have.talk);
  return images ? "png" : "svg";
}

const HAIR = "#1d2440", HAIR_HI = "#3a4a7a", SKIN = "#f8e1d3", SKIN_SH = "#efc7b5", TOP = "#f4f2ea", TOP_SH = "#dcd8c8", LIME = "#c9e64e", IRIS = "#2b3f86";

function eye(cx, cy, s, mode) {
  // s = 1 left, -1 right (mirrors the lash flick)
  if (mode === "closed") return `<path d="M${cx - 24} ${cy + 2} Q${cx} ${cy + 12} ${cx + 24} ${cy + 2}" stroke="${HAIR}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (mode === "happy") return `<path d="M${cx - 22} ${cy + 8} Q${cx} ${cy - 14} ${cx + 22} ${cy + 8}" stroke="${HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return `<g>
    <path d="M${cx - 25} ${cy - 4} Q${cx} ${cy - 30} ${cx + 25} ${cy - 4} Q${cx + 22} ${cy + 26} ${cx} ${cy + 28} Q${cx - 22} ${cy + 26} ${cx - 25} ${cy - 4}Z" fill="#fff"/>
    <ellipse cx="${cx}" cy="${cy + 6}" rx="15" ry="20" fill="url(#iris)"/>
    <ellipse cx="${cx}" cy="${cy + 9}" rx="7" ry="10" fill="#141a33"/>
    <ellipse cx="${cx - 6 * s}" cy="${cy - 2}" rx="5.5" ry="7" fill="#fff"/>
    <circle cx="${cx + 6 * s}" cy="${cy + 15}" r="2.6" fill="#fff" opacity=".9"/>
    <path d="M${cx - 28} ${cy - 2} Q${cx} ${cy - 34} ${cx + 28} ${cy - 4} L${cx + 28 + 6 * s} ${cy - 10}" stroke="${HAIR}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

export function drawCharacter({ expr = "neutral", talk = 0, blink = 0, t = 0, tilt = 0 } = {}) {
  if (images) { const open = talk > 0.35 && expr === "neutral", bob = images.hasTalk ? 0 : talk * 6;
    return `<img src="${images[open ? "talk" : expr]}" style="width:400px;height:560px;object-fit:contain;transform:rotate(${tilt}deg) translateY(${Math.sin(t * 2.2) * 3 - bob}px) scaleY(${1 + bob * 0.004});transform-origin:50% 90%">`; }
  const sway = Math.sin(t * 1.7) * 3 + tilt * 0.6, breathe = Math.sin(t * 2.2) * 2.2;
  const eyesMode = blink > 0.5 || expr === "smile" ? (expr === "smile" ? "happy" : "closed") : "open";
  const leftEye = expr === "wink" ? "closed" : eyesMode, rightEye = eyesMode;
  const mouthOpen = expr === "smile" ? 0.6 : talk;
  const mouth = mouthOpen > 0.15
    ? `<path d="M186 296 Q200 ${300 + 14 * mouthOpen} 214 296 Q200 ${292 + 3 * mouthOpen} 186 296Z" fill="#a8434f"/><path d="M190 ${297 + 8 * mouthOpen} Q200 ${300 + 11 * mouthOpen} 210 ${297 + 8 * mouthOpen}" stroke="#e98a96" stroke-width="3" fill="none"/>`
    : expr === "think" ? `<path d="M190 298 L210 296" stroke="#a8434f" stroke-width="3.5" stroke-linecap="round"/>` : `<path d="M188 295 Q200 302 212 295" stroke="#a8434f" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  const brows = expr === "think" ? `<path d="M142 192 L174 184" stroke="${HAIR}" stroke-width="4" stroke-linecap="round"/><path d="M226 186 L258 190" stroke="${HAIR}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M142 188 Q158 180 174 186" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M226 186 Q242 180 258 188" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return `<svg width="400" height="560" viewBox="0 0 400 560" style="overflow:visible">
  <defs>
    <radialGradient id="iris" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#6f8fe0"/><stop offset=".6" stop-color="${IRIS}"/><stop offset="1" stop-color="#18224f"/></radialGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${HAIR_HI}"/><stop offset=".35" stop-color="${HAIR}"/><stop offset="1" stop-color="#141a33"/></linearGradient>
  </defs>
  <g transform="translate(0 ${breathe - 28})">
    <!-- shoulders: an oversized tee with a lime unspool tag -->
    <path d="M60 560 Q66 430 140 404 Q200 388 260 404 Q334 430 340 560Z" fill="${TOP}"/>
    <path d="M140 404 Q200 440 260 404 Q246 420 200 426 Q154 420 140 404Z" fill="${TOP_SH}"/>
    <rect x="222" y="470" width="58" height="18" rx="9" fill="${LIME}"/><text x="251" y="483" font-family="Ins" font-size="11" font-weight="700" text-anchor="middle" fill="#1d3a1f">unspool</text>
    <path d="M178 350 L178 404 Q200 416 222 404 L222 350Z" fill="${SKIN_SH}"/>
  </g>
  <g transform="rotate(${sway * 0.6} 200 380)">
    <!-- back hair -->
    <path d="M86 210 Q80 90 200 70 Q320 90 314 210 Q330 330 300 420 Q260 380 250 330 L150 330 Q140 380 100 420 Q70 330 86 210Z" fill="url(#hair)"/>
    <!-- face -->
    <path d="M118 200 Q118 120 200 116 Q282 120 282 200 Q282 280 236 316 Q214 332 200 334 Q186 332 164 316 Q118 280 118 200Z" fill="${SKIN}"/>
    <ellipse cx="148" cy="262" rx="18" ry="9" fill="#f4a0a8" opacity=".45"/><ellipse cx="252" cy="262" rx="18" ry="9" fill="#f4a0a8" opacity=".45"/>
    ${brows}
    ${eye(158, 224, 1, leftEye)}${eye(242, 224, -1, rightEye)}
    <path d="M200 252 L197 262 L202 263" stroke="${SKIN_SH}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${mouth}
    <!-- bangs -->
    <path d="M112 196 Q104 96 200 88 Q296 96 288 196 L272 150 L258 196 L236 140 L216 182 L200 132 L182 184 L160 140 L146 194 L128 152Z" fill="url(#hair)"/>
    <path d="M150 104 Q200 92 246 104" stroke="${HAIR_HI}" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
    <!-- side locks, swaying a beat behind the head -->
    <path d="M114 190 Q${100 + sway} 300 ${108 + sway * 1.6} 392 L132 386 Q${126 + sway * 0.8} 300 132 200Z" fill="url(#hair)"/>
    <path d="M286 190 Q${300 + sway} 300 ${292 + sway * 1.6} 392 L268 386 Q${274 + sway * 0.8} 300 268 200Z" fill="url(#hair)"/>
    <!-- ahoge -->
    <path d="M200 74 Q${214 + sway * 2} 40 ${234 + sway * 3} 46 Q${214 + sway * 2} 52 204 80Z" fill="${HAIR}"/>
    <!-- a lime clip -->
    <rect x="252" y="128" width="26" height="9" rx="4" fill="${LIME}" transform="rotate(-24 265 132)"/>
  </g>
</svg>`;
}
