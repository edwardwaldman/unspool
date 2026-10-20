import { createRequire } from "module";
import fs from "fs";
const { chromium } = createRequire("/opt/node-tools/node_modules/")("playwright");
const S = "/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/ad3";
const [from, to] = process.argv.slice(2).map(Number); const FPS = 30;
fs.mkdirSync(`${S}/frames`, { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
await p.goto("http://localhost:8768/index.html");
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
const n = Math.min(to, Math.ceil((await p.evaluate(() => window.DUR)) * FPS));
for (let f = from; f < n; f++) {
  const out = `${S}/frames/f${String(f).padStart(5, "0")}.jpg`;
  if (fs.existsSync(out)) continue;
  await p.evaluate((t) => window.renderAt(t), f / FPS);
  await p.screenshot({ path: out, type: "jpeg", quality: 92 });
}
console.log("done", from, to);
await b.close();
