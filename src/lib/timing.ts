// Estimate word timings when the TTS provider doesn't give word timestamps:
// weight each word by its length plus a pause for trailing punctuation.

const WORDS_PER_SECOND = 2.9;

function weight(word: string) {
  let w = 0.55 + Math.min(word.replace(/[^\p{L}\p{N}]/gu, "").length, 14) * 0.075;
  if (/[.!?…]["')\]]*$/.test(word)) w += 0.45;
  else if (/[,;:—–-]["')\]]*$/.test(word)) w += 0.22;
  return w;
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Start times as fractions (0..1) of the clip duration. */
export function estimateWordFractions(text: string): number[] {
  const words = splitWords(text);
  const weights = words.map(weight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return weights.map((w) => {
    const start = acc / total;
    acc += w;
    return start;
  });
}

export function estimateDuration(text: string): number {
  const words = splitWords(text);
  const weights = words.map(weight).reduce((a, b) => a + b, 0);
  const avg = words.length ? weights / words.length : 1;
  return Math.max(1.6, (words.length / WORDS_PER_SECOND) * (avg / 1.0) * 0.92 + 0.35);
}
