import type { SceneSpec } from "@/lib/schema";

// Where a story scene takes place: the sky (backdrop and fog), ground and walls of each setting.
// Its own file (no React, no three) so the contrast test can check reel text against every sky.

export type SettingName = NonNullable<SceneSpec["setting"]>;
export const SETTING_LOOK: Record<SettingName, { sky: string; ground: string; fog: [number, number]; wall?: string }> = {
  meadow: { sky: "#9fd3ee", ground: "#79b85a", fog: [14, 34] },
  forest: { sky: "#a9d1bd", ground: "#4d8443", fog: [10, 26] },
  kitchen: { sky: "#f0e2c6", ground: "#e2d3b8", fog: [16, 40], wall: "#efe0c2" },
  classroom: { sky: "#e8dfcb", ground: "#b98a5a", fog: [16, 40], wall: "#e6dcc6" },
  city: { sky: "#a8c6e6", ground: "#8a929a", fog: [14, 36] },
  ocean: { sky: "#8fd0f0", ground: "#e8d29b", fog: [16, 40] },
  lab: { sky: "#e3edf1", ground: "#cdd7db", fog: [16, 40], wall: "#e8eff2" },
  space: { sky: "#0b1030", ground: "#5d6272", fog: [30, 80] },
  desert: { sky: "#f4c88c", ground: "#e0b26a", fog: [14, 38] },
  night: { sky: "#18204a", ground: "#2c3b2e", fog: [12, 34] },
};
