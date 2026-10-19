import { tierOf } from "./credits";
import { isDefaultStyle, parseReelStyle, type ReelStyle } from "./reel-style";
import type { Viewer } from "./viewer";

/** Reel style is a Pro feature: Pro, Ultra and the owner (as Ultra; a test view as a lower tier loses it). */
export function canEditStyle(viewer: Viewer) {
  if (!viewer.userId) return false;
  const tier = tierOf(viewer.profile);
  return tier === "pro" || tier === "ultra";
}

/** The style the viewer's own reels play with, or null for the default look (free tiers always get the default). */
export function styleForViewer(viewer: Viewer): ReelStyle | null {
  if (!canEditStyle(viewer) || !viewer.profile?.reel_style) return null;
  const style = parseReelStyle(viewer.profile.reel_style);
  return isDefaultStyle(style) ? null : style;
}
