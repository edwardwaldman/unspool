import type { HighlightColor } from "./schema";

// Highlight markup used in scripts:
//   *word* -> primary (thread accent)   #word# -> warn (coral: traps, risks)
//   ^word^ -> yellow (butter: highlight)  ~word~ -> cyan (sage: the correct / safe choice)

export type Token = { text: string; color: HighlightColor | null };

const MARKS: Record<string, HighlightColor> = { "*": "primary", "#": "warn", "^": "yellow", "~": "cyan" };

/** Split marked-up text into colored runs. Unclosed markers are treated as plain text. */
export function parseMarkup(input: string): Token[] {
  const out: Token[] = [];
  let buf = "";
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    const color = MARKS[ch];
    if (color) {
      const end = input.indexOf(ch, i + 1);
      if (end > i + 1) {
        if (buf) out.push({ text: buf, color: null });
        buf = "";
        out.push({ text: input.slice(i + 1, end), color });
        i = end + 1;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  if (buf) out.push({ text: buf, color: null });
  return out;
}

export function stripMarkup(input: string): string {
  return parseMarkup(input)
    .map((t) => t.text)
    .join("");
}

export type Word = { text: string; color: HighlightColor | null };

/** Words (whitespace-separated) with the highlight color they inherit. */
export function markupWords(input: string): Word[] {
  const words: Word[] = [];
  let pendingGlue = false;
  for (const tok of parseMarkup(input)) {
    const parts = tok.text.split(/(\s+)/);
    for (const p of parts) {
      if (!p) continue;
      if (/^\s+$/.test(p)) {
        pendingGlue = false;
        continue;
      }
      // A run that starts mid-word (e.g. "*stat*istic") glues onto the previous word.
      if (pendingGlue && words.length) {
        const prev = words[words.length - 1];
        prev.text += p;
        prev.color = prev.color ?? tok.color;
      } else {
        words.push({ text: p, color: tok.color });
      }
      pendingGlue = true;
    }
  }
  return words;
}

export const COLOR_VAR: Record<HighlightColor, string> = {
  primary: "var(--thread)",
  warn: "var(--coral)",
  yellow: "var(--butter)",
  cyan: "var(--sage)",
};
