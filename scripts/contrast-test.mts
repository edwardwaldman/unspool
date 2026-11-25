// Colour test: every reel accent must be readable on every background it can sit on.
// Run with `npm run test:contrast`. Fails (exit 1) if any combination lands below 4.5:1 after the dark backing.
import { contrastRatio, MIN_CONTRAST, mixHex, readableOn } from "../src/lib/contrast.ts";
import { FRAME_BASE, REEL_ACCENTS } from "../src/components/reel/accent.ts";
import { SETTING_LOOK } from "../src/components/reel/setting-look.ts";

let failures = 0;
const rows: string[] = [];
for (const accent of REEL_ACCENTS) {
  const backgrounds: [string, string][] = [["reel frame", mixHex(accent, 16, FRAME_BASE)], ...Object.entries(SETTING_LOOK).map(([n, l]) => [`${n} sky`, l.sky] as [string, string])];
  for (const [name, bg] of backgrounds) {
    const direct = contrastRatio(accent, bg);
    const { backing, ratio } = readableOn(accent, bg);
    const ok = ratio >= MIN_CONTRAST;
    if (!ok) failures++;
    rows.push(`${ok ? "ok  " : "FAIL"} ${accent} on ${name.padEnd(14)} ${direct.toFixed(2).padStart(5)}:1 ${backing ? `-> on dark backing ${ratio.toFixed(2)}:1` : "(direct)"}`);
  }
}
// The pinned label chips: white or the accent on the chip's near-black.
for (const fg of ["#ffffff", ...REEL_ACCENTS]) {
  const r = contrastRatio(fg, "#0c0d0c");
  if (r < MIN_CONTRAST) failures++;
  rows.push(`${r >= MIN_CONTRAST ? "ok  " : "FAIL"} chip text ${fg} on #0c0d0c ${r.toFixed(2)}:1`);
}
console.log(rows.join("\n"));
console.log(failures ? `\n${failures} unreadable colour combination(s)` : `\nAll ${rows.length} colour combinations readable (>= ${MIN_CONTRAST}:1)`);
process.exit(failures ? 1 : 0);
