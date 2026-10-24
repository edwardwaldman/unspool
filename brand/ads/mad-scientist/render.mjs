import { createRequire } from "module"; import fs from "fs";
const { chromium } = createRequire("/opt/node-tools/node_modules/")("playwright");
const S = "/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/ad5";
const [from, to] = process.argv.slice(2).map(Number); const FPS = 30;
fs.mkdirSync(`${S}/frames`, { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] }); const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
await p.goto("http://localhost:8778/index.html"); await p.waitForFunction(() => window.ready, null, { timeout: 120000 });
const n = Math.min(to, Math.ceil((await p.evaluate(() => window.DUR)) * FPS));
for (let f = from; f < n; f++) { if (fs.existsSync(`${S}/frames/f${String(f).padStart(5, "0")}.jpg`)) continue; await p.evaluate((t) => window.renderAt(t), f / FPS); await p.screenshot({ path: `${S}/frames/f${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 93, timeout: 180000 }); }
await b.close();
