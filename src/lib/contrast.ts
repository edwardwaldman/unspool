// Colour contrast (WCAG 2.x). Used to keep reel text readable: a reel's accent (lime, sky blue, orchid, peach,
// aqua) is bright, so it reads on the dark reel frame but disappears on the pale story settings (lab, kitchen,
// classroom, desert…). Pure functions with no imports, so `npm run test:contrast` can run them directly in Node.

/** WCAG AA for normal text. The heading is large and bold (AA would accept 3:1); we hold it to 4.5:1 anyway. */
export const MIN_CONTRAST = 4.5;
/** The near-black backing the pinned label chips already use; the heading gets the same one when it needs it. */
export const BACKING = "#0c0d0c";

function rgb(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!/^[0-9a-f]{6}$/i.test(full) || Number.isNaN(n)) throw new Error(`Not a hex colour: ${hex}`);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, 1 (none) to 21 (black on white). */
export function contrastRatio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** `amount`% of `a` mixed into `b` (what CSS color-mix(in srgb, a amount%, b) gives). */
export function mixHex(a: string, amount: number, b: string) {
  const [p, q] = [rgb(a), rgb(b)];
  const t = amount / 100;
  return `#${p.map((v, i) => Math.round(v * t + q[i] * (1 - t)).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * How to draw accent-coloured text over a background: as is when it's readable, otherwise on the dark backing.
 * `ratio` is the contrast the viewer actually gets.
 */
export function readableOn(text: string, background: string): { backing: string | null; ratio: number } {
  const direct = contrastRatio(text, background);
  if (direct >= MIN_CONTRAST) return { backing: null, ratio: direct };
  return { backing: BACKING, ratio: contrastRatio(text, BACKING) };
}
