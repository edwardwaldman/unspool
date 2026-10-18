import type { CSSProperties } from "react";

// Outside the player the app has one accent (thread). Inside the player each reel is a "video" with its
// own tint, so neighbouring reels read as different clips. The reel root overrides --thread (and the
// surface tokens) for its subtree, so every visual inside picks up the reel's accent untouched.
export const THREAD = "var(--thread)";

/** Per-reel accents. Kept clear of coral / sage / butter, which carry meaning inside captions and quiz states. */
const REEL_ACCENTS = ["#d3f05a", "#9db8ff", "#e59cff", "#ffc58a", "#72e3e0"];

export function reelAccent(index: number) {
  return REEL_ACCENTS[(((index - 1) % REEL_ACCENTS.length) + REEL_ACCENTS.length) % REEL_ACCENTS.length];
}

/** The flat tint a reel's frame sits on: its accent mixed into near-black forest. */
export function reelTint(accent: string, amount = 16) {
  return `color-mix(in srgb, ${accent} ${amount}%, #08110e)`;
}

/** CSS variables that re-skin the theme for one reel's frame. */
export function reelVars(index: number): CSSProperties {
  const accent = reelAccent(index);
  return {
    "--thread": accent,
    "--paper": reelTint(accent, 12),
    "--surface": reelTint(accent, 20),
    "--border": "rgba(255,255,255,0.14)",
    "--muted": "rgba(233,240,228,0.66)",
    background: reelTint(accent, 16),
  } as CSSProperties;
}

/** Canvas can't read CSS variables cheaply per frame, so it gets the resolved value (from `el`'s scope when given). */
export function threadHex(el?: Element | null) {
  if (typeof window === "undefined") return "#d3f05a";
  return getComputedStyle(el ?? document.documentElement).getPropertyValue("--thread").trim() || "#d3f05a";
}

export function mutedColor(el?: Element | null) {
  if (typeof window === "undefined") return "#8ea595";
  return getComputedStyle(el ?? document.documentElement).getPropertyValue("--muted").trim() || "#8ea595";
}

export function fileLabel(ext: string) {
  const e = ext.toLowerCase();
  if (e === "docx") return "DOC";
  if (e === "pptx") return "PPT";
  if (["png", "jpg", "jpeg", "webp"].includes(e)) return "IMG";
  return (e || "DOC").toUpperCase().slice(0, 4);
}

/** A colour for a file-type badge (PDF coral, DOC blue, slides peach, images orchid). */
export function fileTone(ext: string) {
  const l = fileLabel(ext);
  if (l === "PDF") return "#ff8b6c";
  if (l === "DOC" || l === "TXT" || l === "MD") return "#9db8ff";
  if (l === "PPT") return "#ffc58a";
  if (l === "IMG") return "#e59cff";
  return "#d3f05a";
}
