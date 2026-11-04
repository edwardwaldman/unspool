import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { normalizeReelScript, type ReelScript } from "@/lib/schema";
import { LabPlayer } from "./lab-player";

// Reel lab, step 2 (development only): plays a saved script in the real player, so a generated reel can be
// looked at, screenshotted and judged. /dev/reel-lab?file=<doc>/reel-1.json (relative to scripts/reel-lab/out).
export default async function ReelLab({ searchParams }: PageProps<"/dev/reel-lab">) {
  if (process.env.NODE_ENV !== "development" && process.env.REEL_LAB !== "1") notFound();
  const { file, raw } = await searchParams;
  const root = path.resolve("scripts/reel-lab/out");
  const target = path.resolve(root, String(file ?? ""));
  if (!file || !target.startsWith(root + path.sep) || !fs.existsSync(target)) notFound();
  const stored = JSON.parse(fs.readFileSync(target, "utf8")) as ReelScript;
  // ?raw=1 plays the script as stored; by default it goes through today's normalizer, like a freshly written reel.
  return <LabPlayer script={raw ? stored : normalizeReelScript(stored, { maxBeats: 9 })} />;
}
