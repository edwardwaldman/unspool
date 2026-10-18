#!/usr/bin/env node
/**
 * Unspool brand kit generator.
 *
 * Builds every brand asset as an SVG master (all text outlined to paths with
 * opentype.js, so the SVGs render the same everywhere), then rasterises the
 * PNGs with headless Chromium (Playwright) and recompresses them with sharp.
 *
 *   cd brand/scripts && npm install && node generate.mjs
 *
 * Playwright + sharp are resolved from /opt/node-tools/node_modules by default
 * (override with BRAND_TOOLS=/path/to/node_modules), browsers from
 * PLAYWRIGHT_BROWSERS_PATH (default /opt/pw-browsers).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAND = path.resolve(HERE, "..");
const REPO = path.resolve(BRAND, "..");
const TOOLS = process.env.BRAND_TOOLS ?? "/opt/node-tools/node_modules/";
process.env.PLAYWRIGHT_BROWSERS_PATH ??= "/opt/pw-browsers";

const localRequire = createRequire(import.meta.url);
const toolsRequire = createRequire(TOOLS.endsWith("/") ? TOOLS : TOOLS + "/");
const opentype = localRequire("opentype.js");
const { chromium } = (() => { try { return toolsRequire("playwright"); } catch { return createRequire(path.join(REPO, "package.json"))("playwright"); } })();
const repoRequire = createRequire(path.join(REPO, "package.json"));
const tryReq = (...reqs) => {
  for (const [req, id] of reqs) {
    try {
      return req(id);
    } catch {}
  }
  throw new Error("Missing dependency: " + reqs[0][1]);
};
// sharp ships with Next.js (repo node_modules); playwright comes from the shared tools dir.
const sharp = tryReq([repoRequire, "sharp"], [toolsRequire, "sharp"], [localRequire, "sharp"]);

/* ------------------------------------------------------------------ tokens */

const C = {
  paper: "#0f1d18",
  surface: "#152820",
  line: "#24402f",
  ink: "#e9f0e4",
  muted: "#8ea595",
  thread: "#d3f05a",
  sage: "#7fd3a6",
  coral: "#ff8b6c",
  butter: "#f2d36b",
  white: "#ffffff",
  black: "#08110e",
};

const font = (f) => opentype.loadSync(path.join(BRAND, "fonts", f + ".ttf"));
const F = {
  wordmark: font("Syne-800"),
  head: font("Unbounded-700"),
  head6: font("Unbounded-600"),
  ui4: font("InstrumentSans-400"),
  ui5: font("InstrumentSans-500"),
  ui6: font("InstrumentSans-600"),
};

/* ------------------------------------------------------------------ text */

const r2 = (n) => Math.round(n * 100) / 100;

function measure(f, str, size, tracking = 0) {
  const w = f.getAdvanceWidth(str, size, { kerning: true, letterSpacing: tracking });
  return w - (str.length ? tracking * size : 0);
}

/** Outlined text. anchor: start | middle | end. tracking in em. */
function text(str, { f = F.ui5, size, x, y, fill = C.ink, tracking = 0, anchor = "start", opacity }) {
  const w = measure(f, str, size, tracking);
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const d = f.getPath(str, x0, y, size, { kerning: true, letterSpacing: tracking }).toPathData(2);
  return `<path d="${d}" fill="${fill}"${opacity != null ? ` fill-opacity="${opacity}"` : ""}/>`;
}

/** A line made of coloured runs: [["One document ", ink], ["into reels", thread]]. */
function runs(parts, { f, size, x, y, tracking = 0, anchor = "start" }) {
  const total = parts.reduce((a, [s]) => a + f.getAdvanceWidth(s, size, { kerning: true, letterSpacing: tracking }), 0) - tracking * size;
  let cx = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
  let out = "";
  for (const [s, fill] of parts) {
    const t = s.trimEnd();
    if (t) out += `<path d="${f.getPath(t, cx, y, size, { kerning: true, letterSpacing: tracking }).toPathData(2)}" fill="${fill}"/>`;
    cx += f.getAdvanceWidth(s, size, { kerning: true, letterSpacing: tracking });
  }
  return { svg: out, width: total };
}

const runsWidth = (parts, f, size, tracking = 0) =>
  parts.reduce((a, [s]) => a + f.getAdvanceWidth(s, size, { kerning: true, letterSpacing: tracking }), 0) - tracking * size;

function wrap(str, f, size, maxW) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (measure(f, t, size) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* Unbounded's cap height / Syne's ascender, as a fraction of font size. */
const HEAD_CAP = 0.77;
const HEAD_LEAD = 1.08;

/**
 * Headline block. lines = array of run arrays. y = top of the first line's caps.
 * Returns svg + bottom (baseline of the last line).
 */
function headline(lines, { x, y, size, anchor = "start", f = F.head, lead = HEAD_LEAD, tracking = -0.02 }) {
  let svg = "";
  let base = y + size * HEAD_CAP;
  for (let i = 0; i < lines.length; i++) {
    svg += runs(lines[i], { f, size, x, y: base, anchor, tracking }).svg;
    if (i < lines.length - 1) base += size * lead;
  }
  return { svg, bottom: base };
}
const headlineWidth = (lines, size, f = F.head, tracking = -0.02) => Math.max(...lines.map((l) => runsWidth(l, f, size, tracking)));
/** Largest size (<= max) at which the headline fits maxW. */
const fitHeadline = (lines, maxW, max, f = F.head) => Math.min(max, Math.floor((maxW / headlineWidth(lines, 100, f)) * 100));

const HERO_2 = [[["One document", C.ink]], [["into reels", C.thread]]];
const HERO_3 = [[["One", C.ink]], [["document", C.ink]], [["into reels", C.thread]]];
const HERO_1 = [[["One document ", C.ink], ["into reels", C.thread]]];

/* ------------------------------------------------------------------ mark */

/** Colour schemes for the mark. Geometry is public/icon.svg (64 grid). */
const MARK = {
  dark: { flange: C.ink, core: C.thread, stripe: C.paper, thread: C.thread, reel: C.ink, play: C.paper },
  light: { flange: C.paper, core: C.thread, stripe: C.paper, thread: C.paper, reel: C.paper, play: C.thread },
  // On chartreuse: everything dark, core reads as a cut-out of the background.
  thread: { flange: C.paper, core: C.paper, stripe: C.thread, thread: C.paper, reel: C.paper, play: C.thread },
};

function markGlyph(c) {
  return [
    `<rect x="8" y="10" width="26" height="5" fill="${c.flange}"/>`,
    `<rect x="8" y="49" width="26" height="5" fill="${c.flange}"/>`,
    `<rect x="12" y="15" width="18" height="34" fill="${c.core}"/>`,
    `<rect x="12" y="23" width="18" height="2" fill="${c.stripe}"/>`,
    `<rect x="12" y="31" width="18" height="2" fill="${c.stripe}"/>`,
    `<rect x="12" y="39" width="18" height="2" fill="${c.stripe}"/>`,
    `<path d="M30 19H46V24" fill="none" stroke="${c.thread}" stroke-width="3"/>`,
    `<rect x="38" y="24" width="18" height="30" fill="${c.reel}"/>`,
    `<path d="M44 32L52 39L44 46Z" fill="${c.play}"/>`,
  ].join("");
}

/** Glyph content box inside the 64 grid. */
const MB = { x: 8, y: 10, w: 48, h: 44 };

/** Place the trimmed mark so its content box is (x, y) with height h. */
function markAt(x, y, h, scheme = MARK.dark) {
  const s = h / MB.h;
  return `<g transform="translate(${r2(x - MB.x * s)} ${r2(y - MB.y * s)}) scale(${r2(s * 1000) / 1000})">${markGlyph(scheme)}</g>`;
}
const markW = (h) => (h * MB.w) / MB.h;

/** Full mark tile (dark square + glyph) at (x, y) size s; glyph scaled by k around the centre. */
function markTile(x, y, size, { k = 1, bg = C.paper, scheme = MARK.dark } = {}) {
  const s = size / 64;
  const off = (64 - 64 * k) / 2;
  return (
    (bg ? `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(size)}" height="${r2(size)}" fill="${bg}"/>` : "") +
    `<g transform="translate(${r2(x + off * s)} ${r2(y + off * s)}) scale(${r2(s * k * 10000) / 10000})">${markGlyph(scheme)}</g>`
  );
}

/* ------------------------------------------------------------------ wordmark */

const WM_TRACK = -0.02; // matches tracking-[-0.02em] on <Wordmark>
const WM_ASC = 0.69; // 'l' top at size 1
const WM_DESC = 0.2; // 'p' bottom
const WM_XH = 0.49;
const wmBox = (() => {
  const b = F.wordmark.getPath("unspool", 0, 0, 1, { kerning: true, letterSpacing: WM_TRACK }).getBoundingBox();
  return { x1: b.x1, x2: b.x2, w: b.x2 - b.x1 };
})();

/** Wordmark with its ink box starting exactly at x; y is the baseline. */
function wordmark(x, baseline, size, fill = C.ink) {
  const d = F.wordmark.getPath("unspool", x - wmBox.x1 * size, baseline, size, { kerning: true, letterSpacing: WM_TRACK }).toPathData(2);
  return `<path d="${d}" fill="${fill}"/>`;
}
const wmInkW = (size) => wmBox.w * size;

/**
 * Horizontal lockup. Mark height = ascender height of the wordmark, both sitting on the baseline.
 * (x, y) = top-left of the mark. Returns svg, width, height (incl. descender).
 */
function lockupH(x, y, markH, { scheme = MARK.dark, wm = C.ink, tile = false } = {}) {
  const size = markH / (WM_ASC + WM_DESC);
  const gap = markH * 0.3;
  const mw = markW(markH);
  let svg = "";
  if (tile) {
    // Mark in its dark square: tile slightly larger than the glyph
    const t = markH * (64 / MB.h);
    const tx = x;
    const ty = y + markH / 2 - t / 2;
    svg += markTile(tx, ty, t);
    const g = t * 0.22;
    svg += wordmark(x + t + g, y + markH * 0.5 + (WM_XH * size) / 2 + size * 0.0, size * 0.86, wm);
    return { svg, width: t + g + wmInkW(size * 0.86), height: t };
  }
  svg += markAt(x, y, markH, scheme);
  svg += wordmark(x + mw + gap, y + WM_ASC * size, size, wm);
  return { svg, width: mw + gap + wmInkW(size), height: markH };
}

/** Stacked lockup centred on cx; y = top of mark. */
function lockupS(cx, y, markH, { scheme = MARK.dark, wm = C.ink } = {}) {
  const mw = markW(markH);
  const size = (mw * 1.9) / wmBox.w;
  const gap = markH * 0.3;
  const svg = markAt(cx - mw / 2, y, markH, scheme) + wordmark(cx - wmInkW(size) / 2, y + markH + gap + WM_ASC * size, size, wm);
  return { svg, width: Math.max(mw, wmInkW(size)), height: markH + gap + (WM_ASC + WM_DESC) * size };
}

/* ------------------------------------------------------------------ reel card */

const mix = (hex, base, a) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(hex);
  const [r0, g0, b0] = p(base);
  const m = (u, v) => Math.round(u * a + v * (1 - a)).toString(16).padStart(2, "0");
  return `#${m(r1, r0)}${m(g1, g0)}${m(b1, b0)}`;
};

const RW = 184;
const RH = 327;

const REELS = [
  { accent: C.thread, hook: "Skip the 40-page read.", title: "chapter 4", part: 1, g: "bars" },
  { accent: C.coral, hook: "72% of it is three ideas.", title: "chapter 4", part: 2, g: "ring" },
  { accent: C.sage, hook: "Here's the one that matters.", title: "chapter 4", part: 3, g: "dots" },
  { accent: C.butter, hook: "Then a quick quiz.", title: "chapter 4", part: 4, g: "versus" },
  { accent: C.thread, hook: "Hear it, don't read it.", title: "chapter 4", part: 5, g: "wave" },
];

function reelGraphic(g, accent, cy) {
  const cx = RW / 2;
  const dim = "#ffffff";
  let s = "";
  if (g === "bars") {
    const hs = [40, 75, 55, 90, 30];
    const H = 84;
    const x0 = cx - (5 * 16 + 4 * 8) / 2;
    hs.forEach((h, k) => {
      const bh = (h / 100) * H;
      s += `<rect x="${x0 + k * 24}" y="${r2(cy + H / 2 - bh)}" width="16" height="${r2(bh)}" fill="${k === 3 ? accent : dim}" ${k === 3 ? "" : 'fill-opacity="0.35"'}/>`;
    });
  } else if (g === "ring") {
    const r = 38;
    const L = 2 * Math.PI * r;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${dim}" stroke-opacity="0.15" stroke-width="9"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent}" stroke-width="9" stroke-dasharray="${r2(L * 0.72)} ${r2(L)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    s += text("72%", { f: F.head, size: 19, x: cx, y: cy + 7, anchor: "middle", fill: C.white });
  } else if (g === "dots") {
    for (let k = 0; k < 40; k++) {
      const col = k % 8;
      const row = Math.floor(k / 8);
      const picked = (k * 7) % 9 === 0;
      s += `<circle cx="${cx - 49 + col * 14}" cy="${cy - 28 + row * 14}" r="${picked ? 4.6 : 3.5}" fill="${picked ? accent : dim}" ${picked ? "" : 'fill-opacity="0.22"'}/>`;
    }
  } else if (g === "versus") {
    s += `<circle cx="${cx - 44}" cy="${cy}" r="27" fill="${accent}"/>`;
    s += text("A", { f: F.head, size: 18, x: cx - 44, y: cy + 7, anchor: "middle", fill: C.black });
    s += text("VS", { f: F.head, size: 12, x: cx, y: cy + 5, anchor: "middle", fill: C.white });
    s += `<circle cx="${cx + 44}" cy="${cy}" r="26" fill="none" stroke="${accent}" stroke-width="2.5"/>`;
    s += text("B", { f: F.head, size: 18, x: cx + 44, y: cy + 7, anchor: "middle", fill: C.white });
  } else if (g === "wave") {
    for (let k = 0; k < 16; k++) {
      const h = 10 + ((k * 13) % 44);
      s += `<rect x="${cx - 62 + k * 8}" y="${r2(cy - h / 2)}" width="4" height="${h}" fill="${k % 4 === 0 ? accent : dim}" ${k % 4 === 0 ? "" : 'fill-opacity="0.55"'}/>`;
    }
  }
  return s;
}

/** Flat reel-phone card (after src/components/landing/reel-mock.tsx). x, y top-left, w width (h = 16:9). */
function reelCard(x, y, w, r, { border = true } = {}) {
  const s = w / RW;
  const bg = mix(r.accent, C.black, 0.16);
  let g = `<rect width="${RW}" height="${RH}" fill="${bg}"/>`;
  // caption: first word on an accent chip
  const size = 15;
  const lines = wrap(r.hook, F.ui6, size, 150);
  let ly = RH * 0.13 + size;
  lines.forEach((line, i) => {
    if (i === 0) {
      const [first, ...rest] = line.split(" ");
      const fw = measure(F.ui6, first, size);
      const sp = measure(F.ui6, " ", size);
      const rw = rest.length ? measure(F.ui6, rest.join(" "), size) : 0;
      const tw = fw + 8 + (rest.length ? sp + rw : 0);
      const x0 = RW / 2 - tw / 2;
      g += `<rect x="${r2(x0)}" y="${r2(ly - size * 0.86)}" width="${r2(fw + 8)}" height="${r2(size * 1.18)}" fill="${r.accent}"/>`;
      g += text(first, { f: F.ui6, size, x: x0 + 4, y: ly, fill: C.black });
      if (rest.length) g += text(rest.join(" "), { f: F.ui6, size, x: x0 + fw + 8 + sp, y: ly, fill: C.white });
    } else {
      g += text(line, { f: F.ui6, size, x: RW / 2, y: ly, anchor: "middle", fill: C.white });
    }
    ly += size * 1.25;
  });
  g += reelGraphic(r.g, r.accent, RH * 0.57);
  // action rail
  const rx = RW - 16;
  let ry = RH - 112;
  const heart = `<path d="M${rx} ${ry + 12}l-6.2-6.1a3.6 3.6 0 0 1 6.2-4.6a3.6 3.6 0 0 1 6.2 4.6z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>`;
  g += heart + text(`${(r.part * 3.7 + 1.2).toFixed(1)}K`, { f: F.ui6, size: 7.5, x: rx, y: ry + 24, anchor: "middle", fill: C.white });
  ry += 34;
  g += `<path d="M${rx - 6.5} ${ry}h13v9h-7l-4 3.5v-3.5h-2z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>`;
  g += text(`${r.part * 41 + 12}`, { f: F.ui6, size: 7.5, x: rx, y: ry + 22, anchor: "middle", fill: C.white });
  ry += 32;
  g += `<path d="M${rx - 7} ${ry + 5}l14-5.5l-5 13l-2.6-5z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/>`;
  // account row
  const ay = RH - 37;
  g += `<circle cx="21" cy="${ay}" r="9" fill="${r.accent}"/>`;
  g += text("u", { f: F.wordmark, size: 11, x: 21, y: ay + 3.6, anchor: "middle", fill: C.black });
  g += text("unspool", { f: F.ui6, size: 10, x: 35, y: ay + 3.5, fill: C.white });
  const fx = 35 + measure(F.ui6, "unspool", 10) + 6;
  g += `<rect x="${r2(fx)}" y="${ay - 6.5}" width="34" height="13" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1"/>`;
  g += text("Follow", { f: F.ui6, size: 7.5, x: fx + 17, y: ay + 2.7, anchor: "middle", fill: C.white });
  g += text(`${r.title} · part ${r.part}`, { f: F.ui5, size: 9, x: 12, y: RH - 14, fill: C.white, opacity: 0.85 });
  // playback bar
  g += `<rect x="0" y="${RH - 3}" width="${RW}" height="3" fill="#fff" fill-opacity="0.2"/>`;
  g += `<rect x="0" y="${RH - 3}" width="${r2(RW * (0.25 + 0.17 * r.part))}" height="3" fill="#fff"/>`;
  if (border) g += `<rect x="0.5" y="0.5" width="${RW - 1}" height="${RH - 1}" fill="none" stroke="${C.line}" stroke-width="1"/>`;
  return `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(s * 10000) / 10000})">${g}</g>`;
}
const reelH = (w) => (w * RH) / RW;

/**
 * The brand illustration: the mark's spool, its thread running right and
 * dropping into a row of reels. (x, y) = top-left of the spool's top flange.
 * u = spool unit (mark grid unit), rw = reel width, n = number of reels.
 */
function heroStrip(x, y, { u, rw, n = 3, gap, start = 0, drop }) {
  gap ??= rw * 0.12;
  const t = 3 * u; // thread weight
  let s = "";
  // spool (mark x 8..34 => 0..26u)
  s += `<rect x="${x}" y="${y}" width="${26 * u}" height="${5 * u}" fill="${C.ink}"/>`;
  s += `<rect x="${x}" y="${y + 39 * u}" width="${26 * u}" height="${5 * u}" fill="${C.ink}"/>`;
  s += `<rect x="${x + 4 * u}" y="${y + 5 * u}" width="${18 * u}" height="${34 * u}" fill="${C.thread}"/>`;
  for (const sy of [13, 21, 29]) s += `<rect x="${x + 4 * u}" y="${y + sy * u}" width="${18 * u}" height="${2 * u}" fill="${C.paper}"/>`;
  const ty = y + 9 * u; // thread centre (mark y 19)
  const rx0 = x + 30 * u; // first reel left (mark x 38)
  const top = ty + (drop ?? 5 * u);
  const centres = [];
  for (let i = 0; i < n; i++) centres.push(rx0 + i * (rw + gap) + rw / 2);
  const last = centres[n - 1];
  s += `<path d="M${r2(x + 22 * u)} ${r2(ty)}H${r2(last)}" fill="none" stroke="${C.thread}" stroke-width="${r2(t)}"/>`;
  for (const cx of centres) s += `<rect x="${r2(cx - t / 2)}" y="${r2(ty)}" width="${r2(t)}" height="${r2(top - ty)}" fill="${C.thread}"/>`;
  for (let i = 0; i < n; i++) s += reelCard(rx0 + i * (rw + gap), top, rw, REELS[(start + i) % REELS.length]);
  return { svg: s, width: 30 * u + n * rw + (n - 1) * gap, height: Math.max(44 * u, top - y + reelH(rw)) };
}

/* ------------------------------------------------------------------ svg doc */

function svgDoc(w, h, body, { bg } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${body}</svg>\n`;
}

/** A thin rule + url footer used on marketing graphics. */
const url = (x, y, size, anchor = "start", fill = C.muted) => text("unspool.cc", { f: F.ui6, size, x, y, anchor, fill, tracking: 0.01 });

/* ------------------------------------------------------------------ assets */

/** Each asset: { out (relative to brand/), w, h, svg, transparent?, master? (svg path) , sizes? } */
const assets = [];
const add = (a) => assets.push(a);

/* ---- logo ---- */

const logoSvgs = {};
{
  // mark.svg — identical geometry to public/icon.svg
  logoSvgs["mark"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${C.paper}"/>${markGlyph(MARK.dark)}</svg>\n`;
  logoSvgs["mark-transparent"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 10 48 44">${markGlyph(MARK.dark)}</svg>\n`;
  logoSvgs["mark-light-bg"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 10 48 44">${markGlyph(MARK.light)}</svg>\n`;

  // wordmark: size 100, padded by 0 (tight ink box)
  const S = 100;
  const pad = 0;
  const ww = r2(wmInkW(S) + pad * 2);
  const wh = r2((WM_ASC + WM_DESC) * S + pad * 2);
  const wmSvg = (fill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ww} ${wh}">${wordmark(pad, pad + WM_ASC * S, S, fill)}</svg>\n`;
  logoSvgs["wordmark"] = wmSvg(C.ink);
  logoSvgs["wordmark-dark"] = wmSvg(C.paper);

  const H = 100;
  const lh = lockupH(0, 0, H);
  const lhW = r2(lh.width);
  const lhH = r2(lh.height);
  logoSvgs["lockup-horizontal"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lhW} ${lhH}">${lh.svg}</svg>\n`;
  logoSvgs["lockup-horizontal-light"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lhW} ${lhH}">${lockupH(0, 0, H, { scheme: MARK.light, wm: C.paper }).svg}</svg>\n`;

  const ls = lockupS(0, 0, H);
  const lsW = r2(ls.width);
  const lsH = r2(ls.height);
  const lsSvg = (o) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(-lsW / 2)} 0 ${lsW} ${lsH}">${lockupS(0, 0, H, o).svg}</svg>\n`;
  logoSvgs["lockup-stacked"] = lsSvg({});
  logoSvgs["lockup-stacked-light"] = lsSvg({ scheme: MARK.light, wm: C.paper });

  const dims = (svg) => {
    const m = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
    return { w: +m[3], h: +m[4] };
  };
  for (const [name, svg] of Object.entries(logoSvgs)) {
    const { w, h } = dims(svg);
    const lockup = name.startsWith("lockup");
    const widths = lockup ? [2000] : [512, 1024];
    for (const W of widths) {
      // Logo PNGs: transparent, small margin so nothing touches the edge (mark.svg is full-bleed).
      const full = name === "mark";
      const m = full ? 0 : Math.round(W * 0.04);
      const inner = W - 2 * m;
      const H2 = name.startsWith("mark") ? W : Math.round((inner * h) / w + 2 * m);
      add({
        out: `logo/${name}-${W}.png`,
        w: W,
        h: H2,
        transparent: !full,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H2}" viewBox="0 0 ${W} ${H2}"><svg x="${m}" y="${name.startsWith("mark") ? Math.round((H2 - (inner * h) / w) / 2) : m}" width="${inner}" height="${r2((inner * h) / w)}" viewBox="${svg.match(/viewBox="([^"]+)"/)[1]}">${svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</svg></svg>`,
      });
    }
  }
}

/* ---- favicon / app icons ---- */

const tile = (size, k = 1) => svgDoc(size, size, markTile(0, 0, size, { k }));
add({ out: "favicon/favicon-16.png", w: 16, h: 16, svg: tile(16, 1.12) });
add({ out: "favicon/favicon-32.png", w: 32, h: 32, svg: tile(32, 1.08) });
add({ out: "favicon/favicon-48.png", w: 48, h: 48, svg: tile(48, 1.04) });
add({ out: "favicon/apple-touch-icon-180.png", w: 180, h: 180, svg: tile(180, 0.86) });
add({ out: "favicon/android-chrome-192.png", w: 192, h: 192, svg: tile(192) });
add({ out: "favicon/android-chrome-512.png", w: 512, h: 512, svg: tile(512) });
// maskable: glyph corners must sit inside the 40%-radius safe circle → k = 0.72
add({ out: "favicon/maskable-512.png", w: 512, h: 512, svg: tile(512, 0.72) });
add({ out: "misc/app-icon-1024.png", w: 1024, h: 1024, svg: tile(1024, 0.82) });
add({ out: "stripe/stripe-icon-512.png", w: 512, h: 512, svg: tile(512, 0.86) });
add({ out: "auth/google-oauth-logo-120.png", w: 120, h: 120, svg: tile(120, 0.9) });
add({ out: "social/producthunt-thumbnail-240.png", w: 240, h: 240, svg: tile(240, 0.86) });

/* Profile pictures are usually cropped to a circle: glyph corners inside r=0.5 with breathing room. */
for (const [name, size] of [
  ["x-profile-400x400", 400],
  ["instagram-profile-1080", 1080],
  ["tiktok-profile-1080", 1080],
  ["youtube-profile-800", 800],
  ["linkedin-logo-400", 400],
  ["facebook-profile-720", 720],
]) {
  add({ out: `social/${name}.png`, w: size, h: size, svg: tile(size, 0.74) });
}

function heroFit(W, x, y, o) {
  const h = heroStrip(0, 0, o);
  const k = Math.min(1, (W - 64 - x) / h.width);
  return { svg: `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(k * 1000) / 1000})">${h.svg}</g>`, width: h.width * k };
}

/* ---- marketing graphics ---- */

const SUB = "Drop in notes, a chapter or a contract. Get short reels with voiceover, visuals and a quiz.";

/** Paragraph helper. y = first baseline. */
function para(str, { x, y, size, maxW, f = F.ui5, fill = C.muted, lead = 1.4, anchor = "start" }) {
  const lines = wrap(str, f, size, maxW);
  return { svg: lines.map((l, i) => text(l, { f, size, x, y: y + i * size * lead, fill, anchor })).join(""), bottom: y + (lines.length - 1) * size * lead, lines: lines.length };
}

/* OG 1200x630 (also X summary_large_image) */
{
  const W = 1200, H = 630, P = 72;
  let b = lockupH(P, P, 40).svg;
  const size = 76;
  const hl = headline(HERO_3, { x: P, y: 168, size });
  b += hl.svg;
  b += para("Notes, a chapter or a contract in. Short reels with voiceover and a quiz out.", { x: P, y: hl.bottom + 60, size: 24, maxW: 520 }).svg;
  b += url(P, H - P + 4, 22, "start", C.ink);
  b += `<rect x="${P}" y="${H - P - 30}" width="40" height="3" fill="${C.thread}"/>`;
  const strip = heroFit(W, 670, 140, { u: 6.6, rw: 186, n: 2, gap: 24 });
  b += strip.svg;
  add({ out: "social/og-image-1200x630.png", w: W, h: H, master: "masters/social/og-image-1200x630.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* X header 1500x500 — avatar overlaps bottom-left; mobile crops top/bottom ~60px */
{
  const W = 1500, H = 500;
  let b = "";
  const size = 64;
  const hl = headline(HERO_2, { x: 470, y: 140, size });
  b += hl.svg;
  b += text("Skip the 40-page read.", { f: F.ui5, size: 28, x: 470, y: hl.bottom + 62, fill: C.muted });
  b += heroFit(W, 1060, 96, { u: 4.6, rw: 128, n: 2, gap: 18 }).svg;
  b += url(470, hl.bottom + 116, 22, "start", C.ink);
  add({ out: "social/x-header-1500x500.png", w: W, h: H, master: "masters/social/x-header-1500x500.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* Square post 1080 */
{
  const W = 1080, H = 1080, P = 96;
  let b = lockupH(P, P, 52).svg;
  const hl = headline(HERO_3, { x: P, y: 220, size: 104 });
  b += hl.svg;
  b += heroFit(W, P, hl.bottom + 90, { u: 7.4, rw: 170, n: 3, gap: 22 }).svg;
  b += url(W - P, P + 40, 28, "end", C.muted);
  add({ out: "social/instagram-post-1080x1080.png", w: W, h: H, master: "masters/social/instagram-post-1080x1080.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* Portrait 1080x1350 */
{
  const W = 1080, H = 1350, P = 96;
  let b = lockupH(P, P, 52).svg;
  const hl = headline(HERO_3, { x: P, y: 250, size: 112 });
  b += hl.svg;
  b += text("Skip the 40-page read.", { f: F.ui5, size: 40, x: P, y: hl.bottom + 90, fill: C.muted });
  b += heroFit(W, P, hl.bottom + 170, { u: 8, rw: 180, n: 3, gap: 26 }).svg;
  b += url(W - P, P + 40, 28, "end", C.muted);
  add({ out: "social/instagram-portrait-1080x1350.png", w: W, h: H, master: "masters/social/instagram-portrait-1080x1350.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* Story / TikTok cover 1080x1920 — keep clear of top 250 / bottom 340 UI, and inside the 3:4 grid crop (y 240..1680) */
function tall(out, { cover = false } = {}) {
  const W = 1080, H = 1920, P = 96;
  let b = "";
  b += lockupS(W / 2, 300, 120).svg;
  const hl = headline(HERO_3, { x: W / 2, y: 640, size: 118, anchor: "middle" });
  b += hl.svg;
  b += heroFit(W, W / 2 - (30 * 8 + 2 * 200 + 26) / 2, hl.bottom + 110, { u: 8, rw: 200, n: 2, gap: 26 }).svg;
  b += text(cover ? "Skip the 40-page read." : "unspool.cc", { f: F.ui6, size: 44, x: W / 2, y: 1540, anchor: "middle", fill: cover ? C.muted : C.ink });
  return { out, w: W, h: H, master: `masters/${out.replace(/\.png$/, ".svg")}`, svg: svgDoc(W, H, b, { bg: C.paper }) };
}
add(tall("social/instagram-story-1080x1920.png"));
add(tall("social/tiktok-cover-1080x1920.png", { cover: true }));

/* Splash 1080x1920 — mark + wordmark only */
{
  const W = 1080, H = 1920;
  const l = lockupS(W / 2, 0, 200);
  const y = H / 2 - l.height / 2;
  add({ out: "misc/loading/splash-1080x1920.png", w: W, h: H, master: "masters/misc/loading/splash-1080x1920.svg", svg: svgDoc(W, H, lockupS(W / 2, y, 200).svg, { bg: C.paper }) });
}

/* YouTube banner 2560x1440 — everything important inside the central 1546x423 (TV shows the rest) */
{
  const W = 2560, H = 1440;
  const SX = (W - 1546) / 2, SY = (H - 423) / 2; // 507, 508.5
  let b = "";
  // Outer area (TV / desktop-wide only): a quiet field of reel outlines on surface
  for (let i = -1; i < 12; i++) {
    for (const [ry, tint] of [[60, C.surface], [1000, C.surface]]) {
      const rx = i * 236 + (ry > 500 ? 118 : 0);
      b += `<rect x="${rx}" y="${ry}" width="200" height="356" fill="${tint}"/>`;
    }
  }
  b += `<rect x="0" y="${SY - 40}" width="${W}" height="${423 + 80}" fill="${C.paper}"/>`;
  const hl = headline(HERO_2, { x: SX + 40, y: SY + 70, size: 104 });
  b += hl.svg;
  b += text("Skip the 40-page read.", { f: F.ui5, size: 40, x: SX + 40, y: hl.bottom + 82, fill: C.muted });
  b += heroFit(W, SX + 1546 - 40 - (30 * 6 + 2 * 128 + 18), SY + 30, { u: 6, rw: 128, n: 2, gap: 18 }).svg;
  b += lockupH(SX + 40, hl.bottom + 138, 40).svg;
  add({ out: "social/youtube-banner-2560x1440.png", w: W, h: H, master: "masters/social/youtube-banner-2560x1440.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* YouTube thumbnail 1280x720 — bottom-right holds the duration chip */
{
  const W = 1280, H = 720, P = 72;
  let b = lockupH(P, P, 44).svg;
  const hl = headline(HERO_3, { x: P, y: 176, size: 86 });
  b += hl.svg;
  b += heroFit(W, 730, 120, { u: 7.2, rw: 200, n: 2, gap: 24 }).svg;
  add({ out: "social/youtube-thumbnail-1280x720.png", w: W, h: H, master: "masters/social/youtube-thumbnail-1280x720.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* LinkedIn company cover 1128x191 — logo overlaps bottom-left */
{
  const W = 1128, H = 191;
  let b = "";
  b += runs(HERO_1[0], { f: F.head, size: 32, x: 280, y: 92, tracking: -0.02 }).svg;
  b += text("Skip the 40-page read.  unspool.cc", { f: F.ui5, size: 20, x: 280, y: 130, fill: C.muted });
  // reels peeking from the right
  for (let i = 0; i < 2; i++) b += reelCard(W - 60 - (2 - i) * 104 + 0, 24, 92, REELS[i]);
  add({ out: "social/linkedin-company-cover-1128x191.png", w: W, h: H, master: "masters/social/linkedin-company-cover-1128x191.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* LinkedIn personal banner 1584x396 — photo overlaps the left ~420px */
{
  const W = 1584, H = 396;
  let b = "";
  const hl = headline(HERO_2, { x: 520, y: 92, size: 58 });
  b += hl.svg;
  b += text("Skip the 40-page read.", { f: F.ui5, size: 26, x: 520, y: hl.bottom + 56, fill: C.muted });
  b += url(520, hl.bottom + 104, 22, "start", C.ink);
  b += heroFit(W, 1110, 70, { u: 4.4, rw: 118, n: 2, gap: 16 }).svg;
  add({ out: "social/linkedin-personal-banner-1584x396.png", w: W, h: H, master: "masters/social/linkedin-personal-banner-1584x396.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* Facebook cover 1640x624 — mobile shows only the centre ~1110px; avatar overlaps bottom-left on desktop */
{
  const W = 1640, H = 624;
  const SX = (W - 1110) / 2; // 265
  let b = "";
  const hl = headline(HERO_2, { x: SX + 20, y: 196, size: 66 });
  b += hl.svg;
  b += text("Skip the 40-page read.", { f: F.ui5, size: 30, x: SX + 20, y: hl.bottom + 66, fill: C.muted });
  b += url(SX + 20, hl.bottom + 122, 24, "start", C.ink);
  b += heroFit(W, SX + 1110 - 20 - (30 * 5 + 2 * 140 + 18), 150, { u: 5, rw: 140, n: 2, gap: 18 }).svg;
  add({ out: "social/facebook-cover-1640x624.png", w: W, h: H, master: "masters/social/facebook-cover-1640x624.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* Product Hunt gallery 1270x760 */
{
  const W = 1270, H = 760, P = 80;
  let b = lockupH(P, P, 44).svg;
  const hl = headline(HERO_3, { x: P, y: 190, size: 84 });
  b += hl.svg;
  b += para(SUB, { x: P, y: hl.bottom + 70, size: 26, maxW: 560 }).svg;
  b += url(P, H - P + 6, 24, "start", C.ink);
  b += heroFit(W, 700, 120, { u: 6.4, rw: 200, n: 2, gap: 24 }).svg;
  add({ out: "social/producthunt-gallery-1270x760.png", w: W, h: H, master: "masters/social/producthunt-gallery-1270x760.svg", svg: svgDoc(W, H, b, { bg: C.paper }) });
}

/* Stripe logo 1200x300 — mark in its dark square + dark wordmark, transparent: reads on white and on #d3f05a */
{
  const W = 1200, H = 300;
  const tH = 200;
  const wmS = 150;
  const gap = 50;
  const total = tH + gap + wmInkW(wmS);
  const x = (W - total) / 2;
  let b = markTile(x, (H - tH) / 2, tH, { k: 0.9 });
  b += wordmark(x + tH + gap, H / 2 + (WM_XH * wmS) / 2 + 4, wmS, C.paper);
  add({ out: "stripe/stripe-logo-1200x300.png", w: W, h: H, transparent: true, master: "masters/stripe/stripe-logo-1200x300.svg", svg: svgDoc(W, H, b) });
}

/* Email header 480x120 on dark */
{
  const W = 480, H = 120;
  const mh = 40;
  const l = lockupH(0, 0, mh);
  add({ out: "email/email-header-logo-480x120.png", w: W, h: H, master: "masters/email/email-header-logo-480x120.svg", svg: svgDoc(W, H, lockupH((W - l.width) / 2, (H - mh) / 2 - 2, mh).svg, { bg: C.paper }) });
}

/* ------------------------------------------------------------------ render */

function ico(pngs) {
  // ICO container with PNG payloads (supported by every browser since IE11 / Vista)
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = 6 + i * 16;
    head.writeUInt8(size >= 256 ? 0 : size, o);
    head.writeUInt8(size >= 256 ? 0 : size, o + 1);
    head.writeUInt8(0, o + 2);
    head.writeUInt8(0, o + 3);
    head.writeUInt16LE(1, o + 4);
    head.writeUInt16LE(32, o + 6);
    head.writeUInt32LE(buf.length, o + 8);
    head.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.buf)]);
}

const write = (rel, data) => {
  const p = path.join(BRAND, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  return p;
};

async function main() {
  const only = process.argv[2]; // optional substring filter for quick iteration
  for (const [name, svg] of Object.entries(logoSvgs)) write(`logo/${name}.svg`, svg);

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const rendered = {};
  for (const a of assets) {
    if (only && !a.out.includes(only)) continue;
    if (a.master) write(a.master, a.svg);
    await page.setViewportSize({ width: a.w, height: a.h });
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${a.svg}</body></html>`);
    let buf = await page.screenshot({ omitBackground: !!a.transparent, clip: { x: 0, y: 0, width: a.w, height: a.h } });
    // Recompress; fall back to a 256-colour palette if a file would exceed 500 KB.
    let out = await sharp(buf).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    if (out.length > 500 * 1024) out = await sharp(buf).png({ compressionLevel: 9, palette: true, quality: 95, colours: 256 }).toBuffer();
    if (!a.transparent) out = await sharp(out).removeAlpha().png({ compressionLevel: 9 }).toBuffer().then((b) => (b.length < out.length * 1.5 ? b : out));
    write(a.out, out);
    rendered[a.out] = out;
    console.log(`${a.out.padEnd(52)} ${a.w}x${a.h}  ${(out.length / 1024).toFixed(1)} KB`);
  }

  if (!only) {
    // favicon.ico + manifest
    write(
      "favicon/favicon.ico",
      ico([16, 32, 48].map((size) => ({ size, buf: rendered[`favicon/favicon-${size}.png`] }))),
    );
    write(
      "favicon/site.webmanifest",
      JSON.stringify(
        {
          name: "Unspool",
          short_name: "Unspool",
          description: "One document into reels.",
          start_url: "/",
          display: "standalone",
          background_color: C.paper,
          theme_color: C.paper,
          icons: [
            { src: "/android-chrome-192.png", sizes: "192x192", type: "image/png" },
            { src: "/android-chrome-512.png", sizes: "512x512", type: "image/png" },
            { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        null,
        2,
      ) + "\n",
    );
    write(
      "stripe/stripe-branding.txt",
      [
        "Stripe Dashboard -> Settings -> Business -> Branding",
        "",
        "Icon:          stripe/stripe-icon-512.png   (square mark)",
        "Logo:          stripe/stripe-logo-1200x300.png   (horizontal lockup, transparent)",
        "Brand color:   #d3f05a",
        "Accent color:  #0f1d18",
        "",
        "Brand color (#d3f05a) fills the Checkout / invoice header; the logo is dark",
        "so it reads on it. Accent (#0f1d18) is used for buttons and links, which",
        "keeps white button text legible.",
        "",
      ].join("\n"),
    );
    await contactSheet(page);
  }
  await browser.close();
}

/* ------------------------------------------------------------------ contact sheet */

async function contactSheet(page) {
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (["scripts", "fonts", "masters", "node_modules"].includes(e.name)) continue;
        walk(p);
      } else if (e.name.endsWith(".png") && e.name !== "contact-sheet.png") files.push(p);
    }
  };
  walk(BRAND);
  files.sort();
  const items = [];
  for (const f of files) {
    const m = await sharp(f).metadata();
    const rel = path.relative(BRAND, f);
    const kb = (fs.statSync(f).size / 1024).toFixed(0);
    const light = /light|dark\b|wordmark-dark|stripe-logo/.test(rel);
    const thumb = await sharp(f).resize({ width: 560, height: 360, fit: "inside", withoutEnlargement: true }).png().toBuffer();
    items.push({ rel, w: m.width, h: m.height, kb, alpha: m.hasAlpha, light, src: `data:image/png;base64,${thumb.toString("base64")}` });
  }
  const css = `
    @font-face{font-family:IS;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(BRAND, "fonts/InstrumentSans-500.ttf")).toString("base64")})}
    @font-face{font-family:UB;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(BRAND, "fonts/Unbounded-700.ttf")).toString("base64")})}
    body{margin:0;background:${C.paper};color:${C.ink};font-family:IS;width:2400px;padding:56px;box-sizing:border-box}
    h1{font-family:UB;font-size:44px;margin:0 0 6px;letter-spacing:-.02em} h1 b{color:${C.thread}}
    p{color:${C.muted};margin:0 0 40px;font-size:20px}
    .g{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
    .c{background:${C.surface};border:1px solid ${C.line};padding:14px}
    .t{height:300px;display:flex;align-items:center;justify-content:center;background:${C.surface}}
    .t.a{background-color:#1b3328;background-image:linear-gradient(45deg,#203a2e 25%,transparent 25%,transparent 75%,#203a2e 75%),linear-gradient(45deg,#203a2e 25%,transparent 25%,transparent 75%,#203a2e 75%);background-size:20px 20px;background-position:0 0,10px 10px}
    .t.l{background:#ffffff}
    .t img{max-width:100%;max-height:300px;image-rendering:auto}
    .n{margin-top:10px;font-size:17px;color:${C.ink};word-break:break-all} .d{font-size:15px;color:${C.muted}}`;
  const html = `<!doctype html><html><head><style>${css}</style></head><body>
    <h1>unspool <b>brand kit</b></h1><p>${items.length} PNG exports · generated by brand/scripts/generate.mjs · checker = transparent, white = made for light backgrounds</p>
    <div class="g">${items
      .map(
        (i) =>
          `<div class="c"><div class="t ${i.light ? "l" : i.alpha ? "a" : ""}"><img src="${i.src}"></div><div class="n">${i.rel}</div><div class="d">${i.w} × ${i.h} · ${i.kb} KB${i.alpha ? " · transparent" : ""}</div></div>`,
      )
      .join("")}</div></body></html>`;
  await page.setViewportSize({ width: 2400, height: 1000 });
  await page.setContent(html);
  await page.waitForTimeout(200);
  const buf = await page.screenshot({ fullPage: true });
  const out = await sharp(buf).png({ compressionLevel: 9, palette: true, colours: 256 }).toBuffer();
  write("contact-sheet.png", out);
  console.log(`contact-sheet.png  ${(out.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
