// The "or type a prompt" box takes two different things: a topic or a question ("photosynthesis, AP Bio"), which
// Unspool researches, and a whole pasted document (a study guide copied from a school portal), which already IS the
// source and must not be researched. Shared by the browser and the server.

/** At or above this many words, a paste is a document, not a topic. */
export const PASTE_MIN_WORDS = 120;
/** A pasted document can be long (a full study guide ran past 4,000 characters and was cut off). */
export const PROMPT_MAX_CHARS = 30_000;

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

/** Tidy spacing but keep line breaks: headings, lists and tables in a paste are its structure. */
export function tidyPrompt(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const isPastedDocument = (text: string) => words(text) >= PASTE_MIN_WORDS;

/** A name for the reels: the paste's first line ("Study Guide: Virtue Ethics & Utilitarianism"), not 80 run-on characters. */
export function promptTitle(text: string): string {
  const first = tidyPrompt(text).split("\n").find((l) => l.trim()) ?? "Topic";
  const clean = first.replace(/^#+\s*/, "").replace(/\s+/g, " ").trim();
  if (clean.length <= 60) return clean;
  const cut = clean.slice(0, 60);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[\s,:;–—-]+$/, "") + "…";
}
