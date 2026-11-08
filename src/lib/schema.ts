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
  color: z.string().describe("the item's real hex colour when the item IS a colour (shown as a colour chip instead of the icon), else an empty string"),
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
    type: z.literal("swatch"),
    title: z.string().describe('short line above the colours, e.g. "9 colours · 1 kit"; or ""'),
    colors: z.array(z.object({ hex: z.string().describe('"#d3f05a"'), name: z.string().describe("1-2 words"), note: z.string().describe('its job in 2-5 words, e.g. "the background"; or ""') })).describe("1-9 real colours from the document, in its order"),
    focus: z.number().int().describe("index of the colour this beat is about (shown big), or -1 to show them all evenly"),
  }),
  z.object({
    type: z.literal("compare"),
    bad: z.object({ title: z.string().describe('e.g. "WITH GLOWS"'), points: z.array(z.string()).describe("1-3 short points") }),
    good: z.object({ title: z.string().describe('e.g. "FLAT"'), points: z.array(z.string()).describe("1-3 short points") }),
  }),
  z.object({
    type: z.literal("typeset"),
    title: z.string().describe('short line above, e.g. "3 fonts, 3 jobs"; or ""'),
    items: z.array(z.object({ name: z.string().describe("the font's name"), role: z.string().describe('its job in 2-5 words, e.g. "the wordmark only"'), style: z.enum(["display", "serif", "sans", "mono", "handwritten"]).describe("the closest look") })).describe("1-3 fonts, each shown in its own style"),
  }),
  z.object({
    type: z.literal("specimen"),
    label: z.string().describe('what it is, e.g. "HEADLINES" or "THE QUOTE"'),
    text: z.string().describe("the sample itself, 1-8 words (a font sample, a famous line, a key phrase)"),
    style: z.enum(["display", "serif", "sans", "mono", "handwritten"]),
    note: z.string().describe('one short line under it, or ""'),
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
  "bee", "flower", "fish", "bird",
] as const;
/** Where a reel's story takes place: the world drawn around and behind its objects. */
export const SCENE_SETTINGS = ["meadow", "forest", "kitchen", "classroom", "city", "ocean", "lab", "space", "desert", "night"] as const;
export const SCENE_COLORS = ["accent", "cream", "white", "dark", "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "gray", "gold"] as const;
export const SCENE_MOTIONS = ["none", "bob", "spin", "pulse", "drop", "stir", "tilt", "glow"] as const;
/** How an object arrives, and the one thing it does mid-beat: the beat's choreography, timed to the voiceover. */
export const SCENE_ENTERS = ["pop", "drop", "slide", "rise", "fly", "grow"] as const;
export const SCENE_ACTIONS = ["none", "to_hero", "away", "jump", "shake", "flip", "grow"] as const;
/** The camera's move across the beat. */
export const CAMERA_MOVES = ["push_in", "pull_out", "orbit", "crane_up", "crane_down", "truck", "whip"] as const;
export const SceneObjectSchema = z.object({
  shape: z.enum(SCENE_SHAPES),
  color: z.enum(SCENE_COLORS),
  label: z.string().describe("1-3 word ALL-CAPS chip pinned to this object, or empty"),
  x: z.number().describe("left/right, -3 to 3"),
  z: z.number().describe("back/front, -2 to 2 (front is closer to the viewer)"),
  size: z.number().describe("0.4 to 2.5; 1 is about knee height"),
  motion: z.enum(SCENE_MOTIONS),
  enter: z.enum(SCENE_ENTERS).describe("how it arrives this beat; pop if it was already on screen last beat"),
  at: z.number().describe("0 to 0.8: when in the line it arrives (0 = at once, 0.5 = halfway through the line)"),
  action: z.enum(SCENE_ACTIONS).describe("one thing it does later in the beat, or none"),
  action_at: z.number().describe("0.2 to 0.9: when in the line the action happens"),
});
export const SceneSchema = z.object({
  camera: z.enum(["front", "close", "low", "top", "orbit"]),
  move: z.enum(CAMERA_MOVES).describe("the camera's move across the beat"),
  setting: z.enum(SCENE_SETTINGS).describe("where the story takes place; keep the same setting across the reel unless the story moves"),
  objects: z.array(SceneObjectSchema).describe("1-8 objects; [] to use the visual instead"),
});
// Scripts written before the choreography fields lack them: the player falls back to its old staging.
type Choreo = "enter" | "at" | "action" | "action_at";
export type SceneObject = Omit<z.infer<typeof SceneObjectSchema>, Choreo> & Partial<Pick<z.infer<typeof SceneObjectSchema>, Choreo>>;
export type SceneSpec = Omit<z.infer<typeof SceneSchema>, "objects" | "move" | "setting"> & { objects: SceneObject[]; move?: (typeof CAMERA_MOVES)[number]; setting?: (typeof SCENE_SETTINGS)[number] };

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
export const DIAGRAM_TYPES = new Set<string>(["graph", "equation", "emoji", "swatch", "compare", "specimen", "typeset"]);
export type ReelScript = Omit<z.infer<typeof ReelScriptSchema>, "beats"> & { beats: Beat[] };
export type HighlightColor = z.infer<typeof ColorSchema>;
export type Stat = z.infer<typeof StatSchema>;

/** Post-validation sanity rules that JSON schema can't express. Returns a list of problems. */
/**
 * Problems worth rewriting the whole script for (each rewrite costs the user 20-40 s of waiting). Anything that
 * can be fixed in place (too many or too few list items, the opening visual type) is fixed by normalizeReelScript
 * instead of sending the script back.
 */
export function reelScriptProblems(s: ReelScript): string[] {
  const problems: string[] = [];
  const spoken = s.beats.filter((b) => b.say.trim());
  if (spoken.length < 3) problems.push("needs at least 3 beats with something said (hook + body)");
  if (s.quiz.options.length < 2) problems.push("quiz needs 2–4 options");
  if (s.quiz.answer < 0 || s.quiz.answer >= Math.min(4, s.quiz.options.length)) problems.push("quiz.answer out of range");
  return problems;
}

/** Clamp anything slightly out of range instead of failing the whole reel. */
// Shapes that are only geometry (they stand in for something and need a label to mean anything), filler the writer
// scatters around the hero, and the real things the kit can draw (matched against an object's label).
const STAND_INS = new Set<string>(["cube", "ball", "cylinder", "cone", "crate", "card"]);
const FILLER = new Set<string>(["star", "coin", "coins", "arrow", "bottle", "dice", "chart", "scale"]);
const REAL_BY_WORD: Record<string, SceneObject["shape"]> = {
  bee: "bee", bees: "bee", bumble: "bee", bumblebee: "bee", flower: "flower", flowers: "flower", fish: "fish", bird: "bird", birds: "bird",
  tree: "tree", trees: "tree", cell: "cell", cells: "cell", molecule: "molecule", molecules: "molecule", planet: "planet", planets: "planet",
  sun: "sun", mountain: "mountain", cloud: "cloud", clouds: "cloud", house: "house", building: "building", person: "person", people: "crowd",
  crowd: "crowd", heart: "heart", lightbulb: "lightbulb", key: "key", lock: "lock", clock: "clock", phone: "phone", book: "book", flask: "flask", coins: "coins",
};
/**
 * Make a beat's 3D cast honest (from reviewing real reels: a "HONEY BEE" that was a bottle, crates labelled
 * "IN MILLIONS", cards labelled "Q2 FY26", and two unlabelled props beside every hero). An object whose label names a
 * shape the kit has becomes that shape; plain geometry standing in for an idea goes; unlabelled filler goes; and if
 * nothing is left the beat shows its flat graphic instead.
 */
export function cleanObjects(objects: SceneObject[]): SceneObject[] {
  return objects
    .map((o) => {
      const words = o.label.toLowerCase().split(/[^a-z]+/);
      const real = words.map((w) => REAL_BY_WORD[w]).find(Boolean);
      return { o: real ? { ...o, shape: real } : o, named: Boolean(real) || words.includes(o.shape) };
    })
    .filter(({ o, named }) => named || (!STAND_INS.has(o.shape) && (o.label || !FILLER.has(o.shape))))
    .map(({ o }) => o);
}

// A hook tag that says nothing about this reel ("BIG NUMBER" over a $57 billion quarter, "KEY IDEA", "DID YOU KNOW")
// wastes the first frame's headline.
const GENERIC_TAG = /^\s*(the\s+)?(big|key|main|one|important|fun|quick|crazy|wild|huge)?\s*(number|idea|point|fact|term|thing|concept|lesson|takeaway|rule|basics|trick)s?\s*!?\s*$|^\s*(did you know|must know|pay attention|listen up|wait for it|watch this|here'?s the thing|mind ?blown|hot take|real talk|fyi)\??!?\s*$/i;

const EXAM_CLAIM = /\b(guaranteed|(?<!likely )on the (exam|test|final)|will be (tested|on the))\b/i;

/**
 * Visual repairs that are safe on any stored reel (they never change what is said or how many beats there are), so
 * the player runs them on old reels too and the writer's output gets them through normalizeReelScript.
 * - A colour named in a list or icons beat shows as its colour chip when the reel's own swatch gives that colour's
 *   hex (from a real palette reel: "SAGE · CORAL · BUTTER" drawn as a leaf, a flame and a sun, and "PAPER ·
 *   background" as a stack-of-layers icon, while the hook's swatch had every one of their hex values).
 */
/** On-screen text never shows the writer's voice marks (*stress*, #warn#, ~underline~, ^number^); hex colours keep their #. */
function unmark<V>(v: V): V {
  if (typeof v === "string") return v.replace(/#([^#\s][^#]*?)#/g, "$1").replace(/[*~^]+/g, "").replace(/\s{2,}/g, " ").trim() as V;
  if (Array.isArray(v)) return v.map(unmark) as V;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "hex" || k === "color" ? x : unmark(x)])) as V;
  return v;
}

export function repairVisuals<T extends Pick<ReelScript, "beats"> & { title?: string; quiz?: ReelScript["quiz"] }>(s: T): T {
  // From the audit of every stored reel: voice marks leaked into 8 on-screen graphics ("#NOT ALL#") and into quiz
  // options ("~The limit of g of x is 6.~"). Visual-only, so it is safe on stored reels too.
  s = { ...s, beats: s.beats.map((b) => (b.visual.type === "equation" || b.visual.type === "graph" ? b : { ...b, visual: unmark(b.visual) })), ...(s.quiz ? { quiz: { ...s.quiz, question: plain(s.quiz.question), options: s.quiz.options.map(plain) } } : {}) };
  const hook = s.beats[0]?.visual;
  // A hook tag that promises the exam ("GUARANTEED QUESTION" on a biology reel whose notes say nothing of the kind)
  // is a claim the reel can't back, and a generic one ("BIG NUMBER") says nothing; the reel's own title is always true
  // and names the subject.
  if (hook?.type === "hook" && s.title && (EXAM_CLAIM.test(hook.tag) || GENERIC_TAG.test(hook.tag) || !hook.tag.trim())) {
    s = { ...s, beats: [{ ...s.beats[0], visual: { ...hook, tag: s.title } }, ...s.beats.slice(1)] };
  }
  const palette = new Map<string, string>();
  const key = (x: string) => x.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9 ]+/g, "").trim();
  for (const b of s.beats) {
    const v = b.visual;
    if (v.type === "swatch") for (const c of v.colors) if (/^#?[0-9a-f]{6}$/i.test(c.hex.trim()) && key(c.name)) palette.set(key(c.name), `#${c.hex.trim().replace(/^#/, "").toLowerCase()}`);
  }
  if (!palette.size) return s;
  const chip = (label: string) => palette.get(key(label)) ?? palette.get(key(label.split(/\s*[·•|:–—]\s*|\s+-\s+/)[0] ?? ""));
  let changed = false;
  const beats = s.beats.map((b) => {
    const v = b.visual;
    if (v.type !== "list" && v.type !== "icons") return b;
    const items = v.items.map((it) => {
      if (it.color) return it;
      const hex = chip(it.label);
      if (!hex) return it;
      changed = true;
      return { ...it, color: hex };
    });
    return { ...b, visual: { ...v, items } };
  });
  return changed ? { ...s, beats } : s;
}

/** Plain text for the quiz: the writer's *highlight* / ~underline~ marks only belong in spoken lines. */
const plain = (x: string) => x.replace(/[*~^#_]+/g, "").replace(/\s+/g, " ").trim();
/** Quiz options are read, not heard: "22 percent" (written for the voice) shows as "22%". */
const option = (x: string) => plain(x).replace(/(\d)\s*percent\b/gi, "$1%");

/**
 * Shortens on-screen text to at most n characters at a word boundary ("INSTRUMENT SANS: BODY AN" was a label cut
 * mid-word at 24), dropping a dangling connector or punctuation at the cut. A single over-long word is hard-cut.
 */
export function clip(text: string, n: number): string {
  const t = text.trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n + 1);
  const at = cut.lastIndexOf(" ");
  let out = at > 0 ? cut.slice(0, at) : t.slice(0, n);
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/[\s,;:·—–-]+$/, "").replace(/\s+(and|or|of|the|a|an|to|in|on|for|with|&)$/i, "");
  }
  return out.trim() || t.slice(0, n);
}

export function normalizeReelScript(s: ReelScript, opts: { maxBeats?: number } = {}): ReelScript {
  let lastMove: string | undefined;
  const beats = s.beats.filter((b) => b.say.trim()).map((raw, i) => {
    // Keep the camera move and setting (they were being dropped here); fill a move the writer skipped, never the
    // same one twice in a row.
    const given = raw.scene?.move && (CAMERA_MOVES as readonly string[]).includes(raw.scene.move) ? raw.scene.move : undefined;
    const fallback = (["push_in", "orbit", "crane_up", "truck", "pull_out", "crane_down"] as const).filter((m) => m !== lastMove)[i % 5];
    const move = raw.scene?.objects?.length ? (given ?? (i === 0 ? "whip" : fallback)) : given;
    lastMove = move;
    const setting = raw.scene?.setting && (SCENE_SETTINGS as readonly string[]).includes(raw.scene.setting) ? raw.scene.setting : undefined;
    const scene = raw.scene
      ? {
          camera: raw.scene.camera,
          ...(move ? { move } : {}),
          ...(setting ? { setting } : {}),
          objects: cleanObjects(raw.scene.objects.slice(0, 8).map((o) => ({
            ...o,
            label: clip(o.label.trim(), 28),
            x: Math.max(-3, Math.min(3, o.x)),
            z: Math.max(-2, Math.min(2, o.z)),
            size: Math.max(0.4, Math.min(2.5, o.size || 1)),
          }))),
        }
      : undefined;
    const mood = raw.mood && (MOODS as readonly string[]).includes(raw.mood) ? raw.mood : undefined;
    const b = { ...raw, scene, mood, image_prompt: (raw.image_prompt ?? "").trim().slice(0, 400) };
    const v = b.visual;
    // Too few items to be a flow or list: one big word instead (fixed here rather than rewriting the script).
    const word = (w: string, sub = "") => ({ ...b, visual: { type: "bigword" as const, word: clip(w, 24) || "KEY IDEA", sub: clip(sub, 60), color: "primary" as const } });
    if (v.type === "list" || v.type === "icons") {
      // Colour items: keep a valid hex only.
      const items = v.items.map((it) => ({ ...it, color: /^#?[0-9a-f]{6}$/i.test((it.color ?? "").trim()) ? `#${(it.color ?? "").trim().replace(/^#/, "").toLowerCase()}` : "" }));
      Object.assign(v, { items });
    }
    if (v.type === "flow") return v.steps.length < 2 ? word(v.steps[0]?.title ?? "", v.steps[0]?.sub) : { ...b, visual: { ...v, steps: v.steps.slice(0, 4) } };
    if (v.type === "list") return v.items.length < 2 ? word(v.title, v.items[0]?.label) : { ...b, visual: { ...v, items: v.items.slice(0, 5) } };
    if (v.type === "icons") return v.items.length < 1 ? word("KEY IDEA") : { ...b, visual: { ...v, items: v.items.slice(0, 3) } };
    if (v.type === "crowd") return { ...b, visual: { ...v, ratio: Math.min(0.9, Math.max(0.02, v.ratio)) } };
    if (v.type === "graph") return { ...b, visual: normalizeGraph(v) };
    if (v.type === "swatch") {
      const colors = v.colors
        .map((c) => ({ ...c, hex: (/^#?([0-9a-f]{6})$/i.exec(c.hex.trim())?.[1] ?? "").toLowerCase(), name: clip(c.name, 18), note: clip(c.note, 32) }))
        .filter((c) => c.hex)
        .map((c) => ({ ...c, hex: `#${c.hex}` }))
        .slice(0, 9);
      // No usable colours: a big word instead of an empty stage.
      if (!colors.length) return { ...b, visual: { type: "bigword" as const, word: clip(v.title, 24) || "COLOUR", sub: "", color: "primary" as const } };
      return { ...b, visual: { ...v, title: clip(v.title, 40), colors, focus: v.focus >= 0 && v.focus < colors.length ? v.focus : -1 } };
    }
    if (v.type === "compare") {
      const side = (s: { title: string; points: string[] }) => ({ title: clip(s.title, 24), points: s.points.slice(0, 3).map((p) => clip(p, 40)) });
      return { ...b, visual: { ...v, bad: side(v.bad), good: side(v.good) } };
    }
    if (v.type === "specimen") return { ...b, visual: { ...v, label: clip(v.label, 40), text: clip(v.text, 60), note: clip(v.note, 60) } };
    if (v.type === "typeset") {
      const items = v.items.slice(0, 3).map((it) => ({ ...it, name: clip(it.name, 24), role: clip(it.role, 40) }));
      return items.length ? { ...b, visual: { ...v, title: clip(v.title, 40), items } } : word(v.title || "FONTS");
    }
    if (v.type === "emoji") return { ...b, visual: { ...v, emoji: [...(v.emoji.trim() || "💡")].slice(0, 4).join(""), title: clip(v.title, 40), caption: clip(v.caption, 40) } };
    if (v.type === "equation") return { ...b, visual: { ...v, label: clip(v.label, 24), expr: v.expr.slice(0, 40), note: clip(v.note, 80), ask: clip(v.ask, 40) } };
    return b;
  });
  // Short reels stay short: past the cap, keep the opening beats and the payoff (the last beat).
  if (opts.maxBeats && beats.length > opts.maxBeats) beats.splice(opts.maxBeats - 1, beats.length - opts.maxBeats);
  // Mood colours mean something: never two non-calm beats in a row (the payoff, the last beat, keeps its own).
  for (let i = 1; i < beats.length - 1; i++) {
    const m = beats[i].mood, prev = beats[i - 1].mood;
    if (m && m !== "calm" && prev && prev !== "calm") beats[i] = { ...beats[i], mood: "calm" };
  }
  return {
    ...s,
    beats: repairVisuals({ beats, title: s.title }).beats,
    quiz: { ...s.quiz, question: plain(s.quiz.question), options: s.quiz.options.slice(0, 4).map(option) },
    // "Next:" was shown as a caption on its own; "Up next," reads as one spoken line.
    outro: { ...s.outro, say: s.outro.say.replace(/^\s*next\s*:\s*/i, "Up next, ") },
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
