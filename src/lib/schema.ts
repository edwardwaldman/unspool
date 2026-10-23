import { z } from "zod";
import { ICON_NAMES } from "./icons";

// ---------------------------------------------------------------------------
// Reel script schema (what the script writer returns, stored in reels.script_json)
// ---------------------------------------------------------------------------

// Highlight colors (markup): primary = thread accent, warn = coral, yellow = butter, cyan = sage.
export const ColorSchema = z.enum(["primary", "warn", "yellow", "cyan"]);
export const IconSchema = z.enum(ICON_NAMES);

const Side = z.object({
  icon: IconSchema,
  title: z.string(),
  sub: z.string(),
});

const Step = z.object({
  icon: IconSchema,
  title: z.string(),
  sub: z.string(),
});

const ListItem = z.object({
  icon: IconSchema,
  label: z.string(),
});

export const VisualSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hook"), icon: IconSchema, tag: z.string(), color: ColorSchema }),
  z.object({ type: z.literal("bigword"), word: z.string(), sub: z.string(), color: ColorSchema }),
  z.object({ type: z.literal("split"), mode: z.enum(["vs", "to"]), left: Side, right: Side }),
  z.object({ type: z.literal("flow"), steps: z.array(Step) }),
  z.object({ type: z.literal("list"), title: z.string(), items: z.array(ListItem) }),
  z.object({ type: z.literal("icons"), items: z.array(ListItem), arrow: z.boolean() }),
  z.object({
    type: z.literal("crowd"),
    total_label: z.string(),
    highlight_label: z.string(),
    ratio: z.number(),
  }),
  z.object({ type: z.literal("stat"), value: z.string(), label: z.string(), color: ColorSchema }),
]);

/** The 3D story kit: shapes the player can build (see components/reel/story-scene.tsx). */
export const SCENE_SHAPES = [
  "person", "crowd", "bowl", "pot", "spoon", "cube", "ball", "cylinder", "cone", "crate", "book", "coin", "coins", "card",
  "phone", "clock", "scale", "flag", "tree", "house", "building", "bottle", "flask", "heart", "star", "arrow", "magnifier",
  "target", "dice", "lock", "key", "lightbulb", "cell", "molecule", "mountain", "cloud", "sun", "planet", "chart",
] as const;
export const SCENE_COLORS = ["accent", "cream", "white", "dark", "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray", "gold"] as const;
export const SCENE_MOTIONS = ["none", "bob", "spin", "pulse", "drop", "stir", "tilt", "glow"] as const;
export const SceneObjectSchema = z.object({
  shape: z.enum(SCENE_SHAPES),
  color: z.enum(SCENE_COLORS),
  label: z.string().describe("1-3 word ALL-CAPS chip pinned to this object, or empty"),
  x: z.number().describe("left/right, -3 to 3"),
  z: z.number().describe("back/front, -2 to 2 (front is closer to the viewer)"),
  size: z.number().describe("0.4 to 2.5; 1 is about knee height"),
  motion: z.enum(SCENE_MOTIONS),
});
export const SceneSchema = z.object({
  camera: z.enum(["front", "close", "low", "top", "orbit"]),
  objects: z.array(SceneObjectSchema).describe("1-8 objects; [] to use the visual instead"),
});
export type SceneSpec = z.infer<typeof SceneSchema>;
export type SceneObject = z.infer<typeof SceneObjectSchema>;

export const BeatSchema = z.object({
  say: z.string(),
  visual: VisualSchema,
  /** The beat as a 3D scene in the reel's story (the player draws it; the flat visual is the fallback). */
  scene: SceneSchema,
  /** Scene for this beat's illustration in the rendered video (style is appended in code). Absent on older scripts. */
  image_prompt: z.string(),
});

export const StatSchema = z.object({
  label: z.string(),
  value: z.number(),
  prefix: z.string(),
  suffix: z.string(),
  at_beat: z.number().int(),
});

export const QuizSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.number().int(),
  explain: z.string(),
});

export const OutroSchema = z.object({
  next_title: z.string(),
  say: z.string(),
});

export const ReelScriptSchema = z.object({
  index: z.number().int(),
  title: z.string(),
  headline: z.string(),
  summary: z.string(),
  stats: z.array(StatSchema),
  beats: z.array(BeatSchema),
  quiz: QuizSchema,
  outro: OutroSchema,
});

export type Visual = z.infer<typeof VisualSchema>;
export type VisualType = Visual["type"] | "quiz" | "outro";
/** image_prompt is required from the model but absent on scripts written before videos (and on the demo). */
export type Beat = Omit<z.infer<typeof BeatSchema>, "image_prompt" | "scene"> & { image_prompt?: string; scene?: SceneSpec };
export type ReelScript = Omit<z.infer<typeof ReelScriptSchema>, "beats"> & { beats: Beat[] };
export type HighlightColor = z.infer<typeof ColorSchema>;
export type Stat = z.infer<typeof StatSchema>;

/** Post-validation sanity rules that JSON schema can't express. Returns a list of problems. */
export function reelScriptProblems(s: ReelScript): string[] {
  const problems: string[] = [];
  if (s.beats.length < 4) problems.push("needs at least 4 beats (hook + body)");
  if (s.beats[0]?.visual.type !== "hook") problems.push("first beat must use the hook visual");
  if (s.quiz.options.length < 2 || s.quiz.options.length > 4) problems.push("quiz needs 2–4 options");
  if (s.quiz.answer < 0 || s.quiz.answer >= s.quiz.options.length) problems.push("quiz.answer out of range");
  for (const [i, b] of s.beats.entries()) {
    if (!b.say.trim()) problems.push(`beat ${i} has empty say`);
    if (b.visual.type === "flow" && (b.visual.steps.length < 2 || b.visual.steps.length > 4))
      problems.push(`beat ${i} flow needs 2–4 steps`);
    if (b.visual.type === "list" && (b.visual.items.length < 2 || b.visual.items.length > 5))
      problems.push(`beat ${i} list needs 2–5 items`);
    if (b.visual.type === "icons" && (b.visual.items.length < 1 || b.visual.items.length > 3))
      problems.push(`beat ${i} icons needs 1–3 items`);
  }
  return problems;
}

/** Clamp anything slightly out of range instead of failing the whole reel. */
export function normalizeReelScript(s: ReelScript): ReelScript {
  const beats = s.beats.map((raw) => {
    const scene = raw.scene
      ? {
          camera: raw.scene.camera,
          objects: raw.scene.objects.slice(0, 8).map((o) => ({
            ...o,
            label: o.label.trim().slice(0, 28),
            x: Math.max(-3, Math.min(3, o.x)),
            z: Math.max(-2, Math.min(2, o.z)),
            size: Math.max(0.4, Math.min(2.5, o.size || 1)),
          })),
        }
      : undefined;
    const b = { ...raw, scene, image_prompt: (raw.image_prompt ?? "").trim().slice(0, 400) };
    const v = b.visual;
    if (v.type === "flow") return { ...b, visual: { ...v, steps: v.steps.slice(0, 4) } };
    if (v.type === "list") return { ...b, visual: { ...v, items: v.items.slice(0, 5) } };
    if (v.type === "icons") return { ...b, visual: { ...v, items: v.items.slice(0, 3) } };
    if (v.type === "crowd") return { ...b, visual: { ...v, ratio: Math.min(0.9, Math.max(0.02, v.ratio)) } };
    return b;
  });
  return {
    ...s,
    beats,
    stats: s.stats.slice(0, 3).map((st) => ({ ...st, at_beat: Math.max(0, Math.min(beats.length - 1, st.at_beat)) })),
  };
}

// ---------------------------------------------------------------------------
// Plan schema (one call over the whole document)
// ---------------------------------------------------------------------------

export const PlanSchema = z.object({
  title: z.string(),
  doc_type: z.enum(["study", "work", "other"]),
  sensitive: z.boolean(),
  reels: z.array(
    z.object({
      index: z.number().int(),
      title: z.string(),
      hook: z.string(),
      section: z.string(),
    }),
  ),
});

export type Plan = z.infer<typeof PlanSchema>;

// ---------------------------------------------------------------------------
// Audio / timing (stored in reels.audio_paths, keyed by segment key)
// ---------------------------------------------------------------------------

export type SegmentAudio = {
  /** Storage path in the `audio` bucket, absent when TTS isn't configured. */
  path?: string;
  /** Seconds. Estimated when the provider doesn't report it; the player corrects on load. */
  duration: number;
  /** Word start times as fractions of duration (0..1). */
  words: number[];
  exact?: boolean;
};

export type AudioMap = Record<string, SegmentAudio>;
