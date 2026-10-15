import { stripMarkup } from "./markup";
import type { ReelScript, Visual } from "./schema";

// A reel plays as a sequence of segments, each with one voiceover clip.
// Body beats come from the script; quiz and outro beats are derived from it.
// Invariant: speech === stripMarkup(text), so caption words line up with audio word timings.

export type SegmentKind = "beat" | "quiz" | "explain" | "outro";

export type Segment = {
  key: string;
  kind: SegmentKind;
  /** Caption text with highlight markup. */
  text: string;
  /** Plain text sent to TTS. */
  speech: string;
  visual: Visual | { type: "quiz" } | { type: "outro" };
  beatIndex: number;
};

const LETTERS = ["A", "B", "C", "D"];

function joinOptions(options: string[]) {
  const named = options.map((o, i) => `${LETTERS[i]}, ${stripMarkup(o)}`);
  if (named.length <= 1) return named.join("");
  return `${named.slice(0, -1).join("; ")}; or ${named[named.length - 1]}?`;
}

export function buildSegments(script: ReelScript): Segment[] {
  const segs: Segment[] = script.beats.map((b, i) => ({
    key: `b${i}`,
    kind: "beat",
    text: b.say,
    speech: stripMarkup(b.say),
    visual: b.visual,
    beatIndex: i,
  }));
  const quizBeat = script.beats.length;
  segs.push({
    key: "quiz_q",
    kind: "quiz",
    text: `Quick check: ${script.quiz.question} ${joinOptions(script.quiz.options)}`,
    speech: `Quick check: ${stripMarkup(script.quiz.question)} ${joinOptions(script.quiz.options)}`,
    visual: { type: "quiz" },
    beatIndex: quizBeat,
  });
  segs.push({
    key: "quiz_a",
    kind: "explain",
    text: script.quiz.explain,
    speech: stripMarkup(script.quiz.explain),
    visual: { type: "quiz" },
    beatIndex: quizBeat,
  });
  segs.push({
    key: "outro",
    kind: "outro",
    text: script.outro.say,
    speech: stripMarkup(script.outro.say),
    visual: { type: "outro" },
    beatIndex: quizBeat + 1,
  });
  return segs;
}
