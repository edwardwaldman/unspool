// Render an ad page frame by frame: the page exposes window.DUR, window.ready and window.renderAt(seconds).
//   node brand/ads/tools/render.mjs <dir> [workers=4] [fps=30]     (serves <dir>/web itself)
// Writes <dir>/frames/f00000.jpg ... Re-running skips frames that already exist.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [dir, workers = "4", fps = "30"] = process.argv.slice(2);
if (!dir) throw new Error("usage: node render.mjs <dir> [workers] [fps]");
const web = path.resolve(dir, "web"), out = path.resolve(dir, "frames"); fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".vrm": "model/gltf-binary", ".glb": "model/gltf-binary" };
const server = http.createServer((req, res) => { const f = path.join(web, decodeURIComponent(req.url.split("?")[0])); if (!f.startsWith(web) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": types[path.extname(f)] ?? "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page0 = await b.newPage({ viewport: { width: 720, height: 1280 } }); await page0.goto(url); await page0.waitForFunction(() => window.ready, null, { timeout: 120000 });
const n = Math.ceil((await page0.evaluate(() => window.DUR)) * Number(fps)); await page0.close();
let next = 0;
await Promise.all(Array.from({ length: Number(workers) }, async () => {
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } }); await p.goto(url); await p.waitForFunction(() => window.ready, null, { timeout: 120000 });
  while (next < n) { const f = next++; const file = `${out}/f${String(f).padStart(5, "0")}.jpg`; if (fs.existsSync(file)) continue;
    await p.evaluate((t) => window.renderAt(t), f / Number(fps)); await p.screenshot({ path: file, type: "jpeg", quality: 93, timeout: 180000 }); if (f % 60 === 0) console.log(`${f}/${n}`); }
}));
await b.close(); server.close(); console.log(`done: ${n} frames in ${out}`);
