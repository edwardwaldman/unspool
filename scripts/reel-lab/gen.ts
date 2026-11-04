// Reel lab, step 1: run the real planner and writer on a test document and save the reel scripts.
//   npx tsx scripts/reel-lab/gen.ts scripts/reel-lab/docs/photosynthesis.md [reels=2] [--quick]
// Needs ANTHROPIC_API_KEY (and ANTHROPIC_WORKSPACE_ID for org-level keys). No voiceover is made: the lab plays
// reels on the silent clock. Output: scripts/reel-lab/out/<doc>/reel-<n>.json (+ plan.json).
import fs from "node:fs";
import path from "node:path";
import { planSpool, writeReelScript } from "../../src/lib/claude";

const [file, nArg, ...flags] = process.argv.slice(2);
if (!file) throw new Error("usage: tsx scripts/reel-lab/gen.ts <doc.md> [reels] [--quick]");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set: the lab runs the real writer");
const text = fs.readFileSync(file, "utf8");
const name = path.basename(file).replace(/\.[^.]+$/, "");
const out = path.join("scripts/reel-lab/out", name);
fs.mkdirSync(out, { recursive: true });
const started = Date.now();
const plan = await planSpool(path.basename(file), text);
fs.writeFileSync(path.join(out, "plan.json"), JSON.stringify(plan, null, 2));
console.log(`plan: ${plan.reels.length} reels in ${((Date.now() - started) / 1000).toFixed(1)}s`);
for (let i = 1; i <= Math.min(Number(nArg ?? 2), plan.reels.length); i++) {
  const t0 = Date.now();
  const script = await writeReelScript({ fileName: path.basename(file), text, plan, index: i, quick: flags.includes("--quick") && i === 1 });
  fs.writeFileSync(path.join(out, `reel-${i}.json`), JSON.stringify(script, null, 2));
  console.log(`reel ${i}: "${script.title}", ${script.beats.length} beats, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
