// Render a 2D ad page with a fresh page per frame, each worker in its own software-drawn browser:
// reusing pages, or sharing one GPU process, left ghost copies of SVG text in some frames.
//   node brand/ads/tools/render-fresh.mjs <dir> [workers=6] [fps=30]
import fs from "node:fs"; import http from "node:http"; import path from "node:path"; import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [dir, workers = "6", fps = "30"] = process.argv.slice(2).filter((a) => a !== "--gl");
// --gl: WebGL pages (three.js) need the GPU path; 2D pages render cleanest with it off
const ARGS = process.argv.includes("--gl") ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] : ["--disable-gpu"];
const web = path.resolve(dir, "web"), out = path.resolve(dir, "frames"); fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf" };
const server = http.createServer((req, res) => { const f = path.join(web, decodeURIComponent(req.url.split("?")[0])); if (!f.startsWith(web) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": types[path.extname(f)] ?? "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, r)); const url = `http://localhost:${server.address().port}/index.html`;
const b = await chromium.launch({ args: ARGS });
const ctx = await b.newContext({ viewport: { width: 720, height: 1280 } });
const p0 = await ctx.newPage(); await p0.goto(url); await p0.waitForFunction(() => window.ready); const n = Math.ceil((await p0.evaluate(() => window.DUR)) * Number(fps)); await p0.close();
let next = 0;
await Promise.all(Array.from({ length: Number(workers) }, async () => {
  // its own browser per worker: pages sharing one browser's GPU process bled into each other's frames
  const bw = await chromium.launch({ args: ARGS });
  const ctx = await bw.newContext({ viewport: { width: 720, height: 1280 } });
  while (next < n) { const f = next++; const file = `${out}/f${String(f).padStart(5, "0")}.jpg`; if (fs.existsSync(file)) continue;
    const p = await ctx.newPage(); await p.goto(url); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
    await p.evaluate((t) => window.renderAt(t), f / Number(fps)); await p.screenshot({ path: file, type: "jpeg", quality: 93 }); await p.close();
    if (f % 120 === 0) console.log(`${f}/${n}`); }
  await bw.close();
}));
await b.close(); server.close(); console.log(`done: ${n} frames`);
