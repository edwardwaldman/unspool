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

export const CURVE_COLORS = ["cyan", "pink", "yellow", "green"] as const;
const GraphPiece = z.object({ expr: z.string(), from: z.number(), to: z.number() });
const GraphCurve = z.object({
  expr: z.string().describe('expression in x, e.g. "sin(x)", "1/(x-4)", "x^2-3"; "" when using pieces'),
  pieces: z.array(GraphPiece).describe("piecewise parts, each over [from, to]; [] for a single expr"),
  color: z.enum(CURVE_COLORS),
});
const GraphPoint = z.object({ x: z.number(), y: z.number(), open: z.boolean(), label: z.string() });
const GraphAsymptote = z.object({ axis: z.enum(["x", "y"]), at: z.number(), label: z.string() });
const GraphBound = z.object({ y: z.number(), label: z.string() });
const GraphHighlight = z.object({ show: z.boolean(), x: z.number(), y: z.number(), label: z.string().describe('red caption, e.g. "f → ±∞ only at x = 4"') });
const GraphZoom = z.object({ show: z.boolean(), x_range: z.array(z.number()), y_range: z.array(z.number()), label: z.string() });

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
  z.object({
    type: z.literal("graph"),
    title: z.string().describe('panel title, e.g. "y = sin(u)" or "f(x)"'),
    x_range: z.array(z.number()).describe("[min, max]"),
    y_range: z.array(z.number()).describe("[min, max]"),
    curves: z.array(GraphCurve).describe("1-3 curves"),
    points: z.array(GraphPoint).describe("0-8 dots; open=true for a hole"),
    asymptotes: z.array(GraphAsymptote),
    bounds: z.array(GraphBound).describe("dashed orange horizontal lines, e.g. y=1 and y=-1"),
    highlight: GraphHighlight,
    zoom: GraphZoom,
  }),
  z.object({
    type: z.literal("equation"),
    label: z.string().describe('small pink label, e.g. "PART D" or "KEY RULE"; or ""'),
    expr: z.string().describe('the big equation, e.g. "sin(f(x))", "lim x→4 f(x) = ±∞" (unicode math is fine)'),
    note: z.string().describe("short supporting line, or \"\""),
    ask: z.string().describe('short yellow question/punchline, e.g. "where? why?", or ""'),
  }),
  z.object({
    type: z.literal("emoji"),
    emoji: z.string().describe("ONE emoji"),
    title: z.string().describe('big line above the prop, e.g. "sin(∞) = ?"; or ""'),
    caption: z.string().describe('short yellow line under it, e.g. "no limit"; or ""'),
    motion: z.enum(["vibrate", "bounce", "spin", "pulse"]),
  }),
]);

export const MOODS = ["hot", "calm", "warn", "win"] as const;
export type Mood = (typeof MOODS)[number];

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
  /** Background mood for this beat. */
  mood: z.enum(MOODS),
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
export type Beat = Omit<z.infer<typeof BeatSchema>, "image_prompt" | "scene" | "mood"> & { image_prompt?: string; scene?: SceneSpec; mood?: Mood };
export type GraphVisual = Extract<Visual, { type: "graph" }>;
/** Full-frame diagram visuals: drawn flat over the whole stage, never inside the 3D scene. */
export const DIAGRAM_TYPES = new Set<string>(["graph", "equation", "emoji"]);
export type ReelScript = Omit<z.infer<typeof ReelScriptSchema>, "beats"> & { beats: Beat[] };
export type HighlightColor = z.infer<typeof ColorSchema>;
export type Stat = z.infer<typeof StatSchema>;

/** Post-validation sanity rules that JSON schema can't express. Returns a list of problems. */
export function reelScriptProblems(s: ReelScript): string[] {
  const problems: string[] = [];
  if (s.beats.length < 4) problems.push("needs at least 4 beats (hook + body)");
  if (!["hook", "emoji", "equation"].includes(s.beats[0]?.visual.type ?? "")) problems.push("first beat must use the hook, emoji or equation visual");
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
    const mood = raw.mood && (MOODS as readonly string[]).includes(raw.mood) ? raw.mood : undefined;
    const b = { ...raw, scene, mood, image_prompt: (raw.image_prompt ?? "").trim().slice(0, 400) };
    const v = b.visual;
    if (v.type === "flow") return { ...b, visual: { ...v, steps: v.steps.slice(0, 4) } };
    if (v.type === "list") return { ...b, visual: { ...v, items: v.items.slice(0, 5) } };
    if (v.type === "icons") return { ...b, visual: { ...v, items: v.items.slice(0, 3) } };
    if (v.type === "crowd") return { ...b, visual: { ...v, ratio: Math.min(0.9, Math.max(0.02, v.ratio)) } };
    if (v.type === "graph") return { ...b, visual: normalizeGraph(v) };
    if (v.type === "emoji") return { ...b, visual: { ...v, emoji: [...(v.emoji.trim() || "💡")].slice(0, 4).join(""), title: v.title.slice(0, 40), caption: v.caption.slice(0, 40) } };
    if (v.type === "equation") return { ...b, visual: { ...v, label: v.label.slice(0, 24), expr: v.expr.slice(0, 40), note: v.note.slice(0, 80), ask: v.ask.slice(0, 40) } };
    return b;
  });
  return {
    ...s,
    beats,
    stats: s.stats.slice(0, 3).map((st) => ({ ...st, at_beat: Math.max(0, Math.min(beats.length - 1, st.at_beat)) })),
  };
}

function range(r: number[] | undefined, fallback: [number, number]): [number, number] {
  const [a, b] = [Number(r?.[0]), Number(r?.[1])];
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return fallback;
  const lo = Math.max(-1e6, Math.min(a, b)), hi = Math.min(1e6, Math.max(a, b));
  return lo < hi ? [lo, hi] : fallback;
}

/** Sane ranges and counts for a graph (the model's numbers are clamped, never trusted). */
export function normalizeGraph(v: GraphVisual): GraphVisual {
  const x_range = range(v.x_range, [-10, 10]);
  const y_range = range(v.y_range, [-10, 10]);
  const fin = (n: number) => Number.isFinite(n);
  return {
    ...v,
    title: v.title.slice(0, 40),
    x_range,
    y_range,
    curves: v.curves.slice(0, 3).map((c) => ({ ...c, expr: c.expr.slice(0, 200), pieces: c.pieces.slice(0, 6).filter((pc) => fin(pc.from) && fin(pc.to)) })),
    points: v.points.slice(0, 8).filter((pt) => fin(pt.x) && fin(pt.y)).map((pt) => ({ ...pt, label: pt.label.slice(0, 16) })),
    asymptotes: v.asymptotes.slice(0, 3).filter((a) => fin(a.at)).map((a) => ({ ...a, label: a.label.slice(0, 16) })),
    bounds: v.bounds.slice(0, 3).filter((bd) => fin(bd.y)).map((bd) => ({ ...bd, label: bd.label.slice(0, 12) })),
    highlight: { ...v.highlight, show: Boolean(v.highlight?.show && fin(v.highlight.x) && fin(v.highlight.y)), label: (v.highlight?.label ?? "").slice(0, 40) },
    zoom: v.zoom?.show
      ? { ...v.zoom, x_range: range(v.zoom.x_range, x_range), y_range: range(v.zoom.y_range, y_range), label: v.zoom.label.slice(0, 40) }
      : { show: false, x_range, y_range, label: "" },
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
