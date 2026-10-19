import type { CSSProperties } from "react";

// "Reel style" (Pro and Ultra): one look applied to every reel of an account. Stored as profiles.reel_style;
// every field is checked against these allowlists on the way in and on the way out.

export const REEL_STYLE_OPTIONS = {
  captions: [
    ["pop", "Bold pop"],
    ["clean", "Clean"],
    ["karaoke", "Karaoke"],
  ],
  font: [
    ["classic", "Classic"],
    ["display", "Display"],
    ["rounded", "Rounded"],
    ["serif", "Serif"],
    ["mono", "Mono"],
  ],
  accent: [
    ["lime", "Lime"],
    ["coral", "Coral"],
    ["ocean", "Ocean"],
    ["violet", "Violet"],
    ["mono", "Mono"],
  ],
  position: [
    ["bottom", "Bottom"],
    ["middle", "Middle"],
  ],
  theme: [
    ["dark", "Dark"],
    ["paper", "Paper"],
  ],
} as const;

type Opt<K extends keyof typeof REEL_STYLE_OPTIONS> = (typeof REEL_STYLE_OPTIONS)[K][number][0];
export type ReelStyle = { [K in keyof typeof REEL_STYLE_OPTIONS]: Opt<K> };
export type ReelStyleKey = keyof ReelStyle;

export const DEFAULT_REEL_STYLE: ReelStyle = { captions: "pop", font: "classic", accent: "lime", position: "bottom", theme: "dark" };

/** Lime is the default: each reel keeps its own rotating tint. Any other accent is used for every reel. */
export const ACCENT_HEX: Record<ReelStyle["accent"], string> = { lime: "#d3f05a", coral: "#ff8b6c", ocean: "#72c7ff", violet: "#b69cff", mono: "#e9f0e4" };

export const FONT_VAR: Record<ReelStyle["font"], string> = {
  classic: "var(--font-archivo), Archivo, system-ui, sans-serif",
  display: "var(--font-bricolage), 'Bricolage Grotesque', system-ui, sans-serif",
  rounded: "var(--font-unbounded), Unbounded, ui-rounded, system-ui, sans-serif",
  serif: "ui-serif, Georgia, 'Times New Roman', serif",
  mono: "var(--font-martian), 'Martian Mono', ui-monospace, monospace",
};

/** A clean style from untrusted input (stored JSON or a request body): unknown fields and values fall back to the default. */
export function parseReelStyle(raw: unknown): ReelStyle {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = { ...DEFAULT_REEL_STYLE } as Record<ReelStyleKey, string>;
  for (const key of Object.keys(REEL_STYLE_OPTIONS) as ReelStyleKey[]) {
    const v = src[key];
    if (typeof v === "string" && REEL_STYLE_OPTIONS[key].some(([id]) => id === v)) out[key] = v;
  }
  return out as ReelStyle;
}

/** Strict check for a save: every field present and allowed, nothing else. */
export function isReelStyle(raw: unknown): raw is ReelStyle {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const src = raw as Record<string, unknown>;
  const keys = Object.keys(REEL_STYLE_OPTIONS) as ReelStyleKey[];
  if (Object.keys(src).length !== keys.length) return false;
  return keys.every((k) => typeof src[k] === "string" && REEL_STYLE_OPTIONS[k].some(([id]) => id === src[k]));
}

export const isDefaultStyle = (s: ReelStyle) => (Object.keys(DEFAULT_REEL_STYLE) as ReelStyleKey[]).every((k) => s[k] === DEFAULT_REEL_STYLE[k]);

/** Overrides for a reel frame's CSS variables (on top of reelVars). Empty for the default look. */
export function reelStyleVars(style: ReelStyle | null | undefined): CSSProperties {
  if (!style) return {};
  const out: Record<string, string> = {};
  if (style.font !== "classic") out["--font-hook"] = FONT_VAR[style.font];
  if (style.accent !== "lime") {
    const a = ACCENT_HEX[style.accent];
    out["--thread"] = a;
    out["--paper"] = `color-mix(in srgb, ${a} 12%, #08110e)`;
    out["--surface"] = `color-mix(in srgb, ${a} 20%, #08110e)`;
    out.background = `color-mix(in srgb, ${a} 16%, #08110e)`;
  }
  return out as CSSProperties;
}
