// usage: node render2.mjs <dir> <port> <from> <to>
import { chromium } from "/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/shot/node_modules/playwright/index.mjs";
import fs from "fs";
const [dir, port, from, to] = process.argv.slice(2); const FPS = 30;
fs.mkdirSync(`${dir}/frames`, { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
await p.goto(`http://localhost:${port}/index.html`); await p.waitForFunction(() => window.ready, null, { timeout: 120000 });
const n = Math.min(Number(to), Math.ceil((await p.evaluate(() => window.DUR)) * FPS));
for (let f = Number(from); f < n; f++) {
  const out = `${dir}/frames/f${String(f).padStart(5, "0")}.jpg`;
  if (fs.existsSync(out)) continue;
  await p.evaluate((t) => window.renderAt(t), f / FPS);
  await p.screenshot({ path: out, type: "jpeg", quality: 93, timeout: 180000 });
}
await b.close();
