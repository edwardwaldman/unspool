// Scripts write titles, tags and labels in caps ("POPULATION vs SAMPLE", "GUARANTEED QUESTION").
// The player shows them in sentence case, keeping real acronyms.

const ACRONYMS = new Set([
  "I", "AP", "SAT", "ACT", "GPA", "SRS", "US", "USA", "UK", "EU", "UN", "AI", "GDP", "CPI", "PDF", "DNA", "RNA", "CEO", "CFO",
  "HR", "IQ", "TV", "FAQ", "API", "ID", "URL", "NASA", "FBI", "IRS", "VAT", "GST", "LLC", "IP", "ROI", "KPI", "MRI", "ER",
]);

/** "GUARANTEED QUESTION" → "Guaranteed question"; "POPULATION vs SAMPLE" → "Population vs sample". Mixed-case text is left alone. */
export function sentenceCase(input: string): string {
  const s = input.trim();
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (!letters) return s;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (upper / letters.length < 0.6) return s;
  // Only a word that opens the text gets a capital ("7.2 HRS" → "7.2 hrs", not "7.2 Hrs").
  const start = s.search(/[A-Za-z0-9]/);
  return s.replace(/[A-Za-z][A-Za-z']*/g, (w, at: number) => {
    const up = w.toUpperCase();
    const out = ACRONYMS.has(up) ? up : w.toLowerCase();
    return at === start ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  });
}

/** Splits "POT · SPOON" style pairs (scripts use a middle dot as a separator) into their parts. */
export function splitDots(s: string): string[] {
  return s
    .split(/\s*[·•|]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Joins a list as plain prose: "PDF, 18 pages, 6,400 words". */
export function joinComma(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(", ");
}
