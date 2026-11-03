// Shared pieces for the "type a prompt" and "paste your homework" ads: the score-club look (light stage, navy,
// one-word captions, punch + shake) with a phone showing the real /go page.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), mix = (a, b, x) => a + (b - a) * x;
export const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const outBack = (x) => { x = clamp(x); const k = 1.7; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
export const NAVY = "#0d2a5c", BLUE = "#2f7de1", PALE = "#d6e7fc", RED = "#e5484d", GREEN = "#1f9d55", LIME = "#d3f05a";
export const PAPER = "#0f1d18", SURF = "#152820", INK = "#e9f0e4", MUTED = "#8ea595";
export const A = (x, y, inner, extra = "") => `<div style="position:absolute;left:${x}px;top:${y}px;${extra}">${inner}</div>`;
export const pop = (k) => `transform:scale(${outBack(k)});opacity:${clamp(k * 3)}`;
export const pill = (txt, k = 1, top = 230) => A(0, top, `<div style="width:720px;text-align:center;opacity:${clamp(k * 3)}"><span style="display:inline-block;background:${PALE};color:${NAVY};font:700 17px Unb;letter-spacing:.5px;padding:8px 18px;border-radius:20px">${txt}</span></div>`);
export const logo = () => A(28, 26, `<div style="display:flex;align-items:center;gap:8px;font:700 22px Unb;color:${NAVY}"><svg width="22" height="24" viewBox="0 0 22 24"><rect x="1" y="1" width="20" height="4" rx="2" fill="${NAVY}"/><rect x="1" y="19" width="20" height="4" rx="2" fill="${NAVY}"/><rect x="5" y="5" width="12" height="14" fill="#c7e34a"/></svg>unspool</div>`);
export const headline = (a, b, k = 1) => A(0, 108, `<div style="width:720px;text-align:center;font:700 40px/1.15 Unb;color:${NAVY};letter-spacing:-1px;opacity:${clamp(k * 3)}">${a}<br><span style="background:#bcd8fb;padding:0 10px">${b}</span></div>`);

// A finger tap: a ring that shrinks onto the spot, then a ripple.
export const tap = (x, y, k) => { if (k <= 0 || k >= 1.4) return ""; const r = k < 0.5 ? mix(46, 26, ease(k / 0.5)) : mix(26, 70, ease((k - 0.5) / 0.9));
  const o = k < 0.5 ? clamp(k * 4) : 1 - clamp((k - 0.5) / 0.9);
  return `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;background:rgba(255,255,255,${k < 0.5 ? 0.35 : 0});border:4px solid rgba(255,255,255,${o});box-shadow:0 0 0 2px rgba(13,42,92,${o * 0.4})"></div>`; };

// The phone. Content is drawn in a 360x760 screen, scaled by s, centred on cx with its top at y.
export function phone(cx, y, s, screen, extra = "") {
  return `<div style="position:absolute;left:${cx - 196 * s}px;top:${y}px;width:392px;height:792px;transform:scale(${s});transform-origin:0 0;${extra}">
    <div style="position:absolute;inset:0;border-radius:58px;background:#111;box-shadow:0 30px 70px rgba(13,42,92,.35),inset 0 0 0 3px #333"></div>
    <div style="position:absolute;left:16px;top:16px;width:360px;height:760px;border-radius:44px;overflow:hidden;background:${PAPER}">${screen}
      <div style="position:absolute;left:130px;top:10px;width:100px;height:28px;border-radius:16px;background:#000"></div></div></div>`;
}

// The real /go page: wordmark, headline, the + (Snap a photo), "or type a prompt" and the box.
// typed: text in the box; caret: show the caret; go: 0..1 the arrow lighting up; paste: 0..1 the Paste bubble.
export function goScreen({ typed = "", caret = false, go = 0, paste = 0, focus = 0 } = {}) {
  const shown = typed.length > 24 ? "…" + typed.slice(-23) : typed;
  return `<div style="position:absolute;inset:0;padding:58px 22px 0;box-sizing:border-box;text-align:center;color:${INK}">
    <div style="font:700 21px Unb;color:${INK}">unspool</div>
    <div style="font:700 31px/1.05 Unb;margin-top:18px;letter-spacing:-.5px">Snap a photo.<br>Get study <span style="color:${LIME}">reels.</span></div>
    <div style="font:600 14px/1.4 Ins;color:${MUTED};margin-top:12px">Snap your notes, pick a PDF, or type a topic.</div>
    <div style="margin:${mix(36, 18, focus)}px auto 0;width:${mix(118, 84, focus)}px;height:${mix(118, 84, focus)}px;border-radius:50%;background:${LIME};box-shadow:0 0 0 10px rgba(211,240,90,.12);display:flex;align-items:center;justify-content:center"><svg width="48" height="48" viewBox="0 0 64 64"><path d="M32 10v44M10 32h44" stroke="${PAPER}" stroke-width="8" stroke-linecap="round"/></svg></div>
    <div style="font:600 18px Ins;margin-top:12px">Snap a photo</div><div style="font:600 13px Ins;color:${MUTED};margin-top:2px">or upload a PDF, slides or notes</div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:${mix(30, 22, focus)}px;font:600 13px Ins;color:${MUTED}"><span style="flex:1;height:1px;background:#28402f"></span>or type a prompt<span style="flex:1;height:1px;background:#28402f"></span></div>
    <div style="position:relative;margin-top:10px;display:flex;align-items:center;gap:8px;border:2px solid ${focus > 0.5 ? LIME : "#28402f"};border-radius:30px;background:${SURF};padding:6px 6px 6px 18px">
      <div style="flex:1;text-align:left;font:600 17px Ins;white-space:nowrap;overflow:hidden;color:${typed ? INK : MUTED + "aa"}">${typed ? shown : "e.g. Photosynthesis, AP Bio"}${caret ? `<span style="display:inline-block;width:2px;height:20px;background:${LIME};vertical-align:-4px;margin-left:1px"></span>` : ""}</div>
      <div style="width:40px;height:40px;border-radius:50%;background:${LIME};opacity:${typed ? 0.55 + 0.45 * go : 0.35};transform:scale(${1 + 0.15 * Math.sin(go * Math.PI)});display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="${PAPER}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      ${paste > 0 ? `<div style="position:absolute;left:40px;top:-58px;${pop(paste)};background:#2b2b2e;color:#fff;font:600 17px Ins;padding:10px 18px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.4)">Paste<div style="position:absolute;left:28px;bottom:-8px;width:16px;height:16px;background:#2b2b2e;transform:rotate(45deg)"></div></div>` : ""}
    </div>
    <div style="font:600 12px Ins;color:${MUTED};margin-top:8px">We research it and turn it into reels.</div></div>`;
}

// The loading screen while Unspool researches: the real status line, sources landing, the notes writing themselves.
export function researchScreen(lt, title, items = []) {
  const SRC = [["Textbook", "#ff8b6c"], ["University", "#9db8ff"], ["Encyclopedia", "#ffc58a"], ["Study guide", "#e59cff"]];
  let h = `<div style="position:absolute;inset:0;padding:64px 22px 0;box-sizing:border-box;color:${INK}">
    <div style="font:700 13px Unb;color:${LIME};letter-spacing:1px">RESEARCHING</div>
    <div style="font:700 22px/1.2 Unb;margin-top:8px">${title}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font:600 14px Ins;color:${MUTED}"><span style="width:10px;height:10px;border-radius:50%;background:${LIME};opacity:${0.4 + 0.6 * Math.abs(Math.sin(lt * 5))}"></span>Researching your topic on the web</div>`;
  // a magnifier sweeping over a little globe
  const gx = 180 + Math.cos(lt * 3) * 26, gy = 250 + Math.sin(lt * 3) * 16;
  h += `<svg style="position:absolute;left:0;top:0" width="360" height="760"><circle cx="180" cy="250" r="62" fill="none" stroke="#28402f" stroke-width="3"/><ellipse cx="180" cy="250" rx="28" ry="62" fill="none" stroke="#28402f" stroke-width="3"/><path d="M118 250h124M126 220h108M126 280h108" stroke="#28402f" stroke-width="3"/>
    <circle cx="${gx}" cy="${gy}" r="26" fill="rgba(211,240,90,.12)" stroke="${LIME}" stroke-width="5"/><path d="M${gx + 18} ${gy + 18} l22 22" stroke="${LIME}" stroke-width="7" stroke-linecap="round"/></svg>`;
  SRC.forEach(([s, c], j) => { const k = (lt - 0.25 - j * 0.28) / 0.3; if (k <= 0) return;
    h += A(j % 2 ? 190 : 22, 352 + Math.floor(j / 2) * 52, `<div style="${pop(k)};display:flex;align-items:center;gap:8px;width:148px;box-sizing:border-box;background:${SURF};border:1px solid #28402f;border-radius:12px;padding:9px 10px;font:600 14px Ins"><span style="width:10px;height:10px;border-radius:3px;background:${c}"></span>${s}<span style="margin-left:auto;color:${LIME}">✓</span></div>`); });
  // the notes, writing themselves
  const n = clamp((lt - 1.0) / 1.6);
  h += A(22, 470, `<div style="width:316px;height:230px;box-sizing:border-box;background:#fbfaf6;border-radius:14px;padding:16px 18px;opacity:${clamp((lt - 0.9) / 0.2)}"><div style="font:700 15px Unb;color:#1a1f2c">Your notes</div>
    ${items.length ? items.map((q, j) => { const on = n > (j + 0.6) / items.length; return `<div style="display:flex;align-items:center;gap:8px;margin-top:12px;font:600 15px Ins;color:#1a1f2c;opacity:${clamp(n * items.length - j + 0.4)}"><span style="width:20px;height:20px;border-radius:50%;background:${on ? GREEN : "#d5d9e6"};color:#fff;font:700 12px Ins;display:flex;align-items:center;justify-content:center">${on ? "✓" : ""}</span>${q}</div>`; }).join("")
      : [92, 80, 95, 64, 88, 90, 70].map((w, j) => `<div style="height:8px;margin:12px 0;border-radius:4px;background:#cfd3cd;width:${w * clamp(n * 7 - j)}%"></div>`).join("")}</div>`);
  return h + `</div>`;
}

// A reel with its quiz up: the reel still behind, the question card over it, the right answer lighting up.
export function quizScreen(lt, img, q, opts, right) {
  const ans = lt > 1.5;
  return `<img src="${img}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(${mix(1, 0.45, clamp(lt / 0.4))})">
    <div style="position:absolute;left:18px;right:18px;top:200px;${pop((lt - 0.1) / 0.35)};background:#fff;border-radius:20px;padding:20px;box-shadow:0 16px 40px rgba(0,0,0,.4)">
      <div style="font:700 13px Unb;color:#8b97ab;letter-spacing:1px">QUIZ</div><div style="font:700 21px/1.3 Ins;color:${NAVY};margin-top:8px">${q}</div>
      ${opts.map((o, x) => { const r = ans && x === right; return `<div style="margin-top:10px;padding:12px 14px;border-radius:12px;border:2px solid ${r ? GREEN : "#d8dde6"};background:${r ? "#e8f6ee" : "#fff"};font:600 18px Ins;color:${r ? GREEN : NAVY}">${String.fromCharCode(65 + x)}. ${o}${r ? " ✓" : ""}</div>`; }).join("")}
    </div>${tap(180, 200 + 120 + right * 58 + 30, (lt - 1.05) / 0.6)}`;
}

// The feed: reels sliding up one after another, like scrolling.
export function feedScreen(lt, imgs, every = 0.9) {
  const p = lt / every, i = Math.floor(p), f = ease(clamp((p - i - 0.55) / 0.45));
  const cur = imgs[i % imgs.length], nxt = imgs[(i + 1) % imgs.length];
  const rail = `<div style="position:absolute;right:12px;top:430px;display:flex;flex-direction:column;gap:22px;align-items:center;color:#fff;font:600 12px Ins">${["♥", "💬", "➤"].map((c) => `<div style="text-align:center"><div style="font-size:26px">${c}</div></div>`).join("")}</div>`;
  return `<div style="position:absolute;inset:0;transform:translateY(${-760 * f}px)"><img src="${cur}.jpg" style="position:absolute;left:0;top:0;width:360px;height:760px;object-fit:cover"><img src="${nxt}.jpg" style="position:absolute;left:0;top:760px;width:360px;height:760px;object-fit:cover"></div>${rail}`;
}

// The cold open: a run of red negatives slammed on one after another.
export function coldOpen(t, NEG, GAP = 0.44) {
  let h = `<div style="position:absolute;inset:0;background:#fff4f3"></div>`;
  const n = Math.min(NEG.length, Math.floor(t / GAP) + 1);
  for (let j = 0; j < n; j++) { const k = (t - j * GAP) / 0.16, rot = [-4, 3, -2, 4, -3, 2][j % 6], big = j === 0;
    h += A(0, 200 + j * 150, `<div style="width:720px;text-align:center;transform:scale(${mix(1.9, 1, ease(clamp(k)))}) rotate(${rot}deg);opacity:${clamp(k * 2) * (j < n - 1 ? 0.55 : 1)}"><span style="display:inline-flex;align-items:center;gap:14px;font:700 ${big ? 60 : 46}px/1.05 Unb;color:${RED};letter-spacing:-1px"><span style="display:inline-flex;flex:none;width:${big ? 58 : 48}px;height:${big ? 58 : 48}px;border-radius:50%;background:${RED};color:#fff;font:700 ${big ? 34 : 28}px Unb;align-items:center;justify-content:center">✗</span>${NEG[j]}</span></div>`); }
  const pulse = Math.max(0, 1 - (t % GAP) / 0.25);
  h += `<div style="position:absolute;inset:0;box-shadow:inset 0 0 ${120 + 80 * pulse}px rgba(229,72,77,${0.25 + 0.3 * pulse})"></div>`;
  const sh = pulse * 10;
  return `<div style="position:absolute;inset:0;transform:translate(${Math.sin(t * 80) * sh}px,${Math.cos(t * 67) * sh}px)">${h}</div>`;
}

// One-word captions with a pop on each word.
export function word(t, L) { if (!L.text) return ["", 1]; const ws = L.text.split(" "); const tot = ws.reduce((a, w) => a + w.length + 1, 0), dur = L.e - L.s; const u = clamp((t - L.s) / dur) * tot; let acc = 0, cur = 0, start = 0; ws.forEach((w, i) => { if (u >= acc) { cur = i; start = acc; } acc += w.length + 1; }); return [ws[cur].replace(/[.,?!]/g, "").toUpperCase(), (u - start) / tot * dur]; }
export function captionWord(t, L, strong) {
  const [w, wl] = word(t, L); if (!w) return "";
  const big = strong.test(w);
  return A(0, 1080, `<div style="width:720px;text-align:center"><span style="display:inline-block;background:${big ? NAVY : "#bcd8fb"};color:${big ? "#fff" : NAVY};font:700 46px Unb;padding:8px 20px;border-radius:14px;box-shadow:0 5px 0 ${NAVY}33;transform:scale(${1 + 0.28 * Math.max(0, 1 - wl / 0.12)}) rotate(${(w.length % 3 - 1) * 1.5}deg)">${w}</span></div>`);
}

// The ending: big line, unspool.cc pill, confetti.
export function endCard(lc, top, sub, pillAt = 1.6) {
  let h = A(0, 360, `<div style="width:720px;text-align:center;font:700 64px/1.1 Unb;color:${NAVY};letter-spacing:-1.5px;transform:scale(${outBack(lc / 0.4)})">${top}</div>`);
  h += A(230, 600, `<div style="width:260px;height:8px;border-radius:4px;background:${BLUE};transform:scaleX(${ease((lc - 0.3) / 0.4)})"></div>`);
  h += A(0, 640, `<div style="width:720px;text-align:center;font:600 30px Ins;color:${NAVY};opacity:${clamp((lc - 0.4) / 0.3)}">${sub}</div>`);
  h += A(0, 760, `<div style="width:720px;text-align:center;transform:scale(${outBack((lc - pillAt) / 0.35)})"><span style="display:inline-block;background:${NAVY};color:#fff;font:700 44px Unb;padding:16px 34px;border-radius:44px">unspool.cc</span><div style="margin-top:14px;font:600 26px Ins;color:#5f6b80">first reel free</div></div>`);
  for (let c = 0; c < 26; c++) { const u = clamp((lc - 0.1) / 1.6); if (u <= 0 || u >= 1) continue; const a = c * 2.4; h += A(360 + Math.cos(a) * 340 * u, 480 + Math.sin(a) * 260 * u + 240 * u * u, `<div style="width:12px;height:7px;background:${[BLUE, RED, "#f2c14e", GREEN][c % 4]};transform:rotate(${c * 40 + lc * 300}deg);opacity:${1 - u}"></div>`); }
  return h;
}

// The stage: a zoom punch on every new shot, a slow push, and a shake on the hits.
export function stage(t, lt, h, hits) {
  const punch = 1 + 0.07 * Math.max(0, 1 - lt / 0.22) ** 2, push = 1 + 0.025 * clamp(lt / 3);
  let sh = 0; for (const [ht, a] of hits) { const d = t - ht; if (d > 0 && d < 0.35) sh = Math.max(sh, a * (1 - d / 0.35)); }
  return `<div style="position:absolute;inset:0;transform:translate(${Math.sin(t * 73) * 9 * sh}px,${Math.cos(t * 59) * 7 * sh}px) scale(${punch * push});transform-origin:50% 45%">${h}</div>`;
}
