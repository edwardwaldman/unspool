// Reel lab, step 3: play a saved reel in the lab page at iPhone size and save one frame per second as a contact
// sheet, so the whole reel can be judged at a glance.
//   node scripts/reel-lab/shoot.mjs <doc>/reel-1.json [baseUrl=http://localhost:3000] [--raw]
// Output: scripts/reel-lab/out/<doc>/reel-1.png (a grid of frames) and reel-1-frames/NN.png.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [file, base = "http://localhost:3000", ...flags] = process.argv.slice(2);
if (!file) throw new Error("usage: node scripts/reel-lab/shoot.mjs <doc>/reel-1.json [baseUrl] [--raw]");
const out = path.join("scripts/reel-lab/out", file.replace(/\.json$/, ""));
fs.mkdirSync(`${out}-frames`, { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(`${base}/dev/reel-lab?file=${encodeURIComponent(file)}${flags.includes("--raw") ? "&raw=1" : ""}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
// first tap starts playback; tap again only while the paused overlay (or "Tap to play") is really on screen
await p.mouse.click(195, 420);
for (let i = 0; i < 4; i++) {
  await p.waitForTimeout(700);
  const paused = await p.locator('[data-testid="paused"]').isVisible().catch(() => false);
  if (!paused && !(await p.getByText(/tap to play/i).isVisible().catch(() => false))) break;
  await p.mouse.click(195, 420);
}
const shots = [];
for (let i = 0; i < 60; i++) {
  await p.waitForTimeout(1000);
  // a late paused overlay in the first seconds means a tap landed while it was already starting: tap once more
  if (i < 5 && (await p.locator('[data-testid="paused"]').isVisible().catch(() => false))) { await p.mouse.click(195, 420); await p.waitForTimeout(500); }
  const f = `${out}-frames/${String(i).padStart(2, "0")}.png`;
  await p.screenshot({ path: f });
  shots.push(f);
  if (await p.getByText(/quick check/i).count()) { await p.waitForTimeout(1500); await p.screenshot({ path: `${out}-frames/quiz.png` }); shots.push(`${out}-frames/quiz.png`); break; }
}
// one contact sheet: every frame side by side, 8 to a row
const cells = shots.map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}" style="width:195px;height:422px;display:block">`).join("");
const sheet = await b.newPage({ viewport: { width: 195 * 8, height: 422 * Math.ceil(shots.length / 8) } });
await sheet.setContent(`<body style="margin:0;display:flex;flex-wrap:wrap;background:#fff">${cells}</body>`);
await sheet.screenshot({ path: `${out}.png`, fullPage: true });
await b.close();
fs.writeFileSync(`${out}-frames/index.json`, JSON.stringify({ shots, errors }, null, 2));
console.log(`${shots.length} frames in ${out}-frames/`, errors.length ? `errors: ${errors.join(" | ")}` : "no page errors");
