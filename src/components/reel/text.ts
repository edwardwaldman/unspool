// Scripts write titles, tags and labels in caps ("POPULATION vs SAMPLE", "GUARANTEED QUESTION").
// The player shows them in sentence case, keeping real acronyms.

const ACRONYMS = new Set([
  "I", "AP", "SAT", "ACT", "GPA", "SRS", "US", "USA", "UK", "EU", "UN", "AI", "GDP", "CPI", "PDF", "DNA", "RNA", "CEO", "CFO",
  "HR", "IQ", "TV", "FAQ", "API", "ID", "URL", "NASA", "FBI", "IRS", "VAT", "GST", "LLC", "IP", "ROI", "KPI", "MRI", "ER",
  "EPS", "ATP", "ADP", "NADPH", "HTML", "CSS", "USD", "UV", "WWI", "WWII", "CO", "NATO", "OK", "ETF", "IPO", "APR", "SEC",
]);
/** Acronyms with a fixed mixed case. */
// Brand names keep their own casing ("TIKTOK LINK" read "Tiktok link").
const CASED: Record<string, string> = { YOY: "YoY", QOQ: "QoQ", MOM: "MoM", PH: "pH", TIKTOK: "TikTok", YOUTUBE: "YouTube", LINKEDIN: "LinkedIn", IPHONE: "iPhone", IPAD: "iPad", IOS: "iOS", MACOS: "macOS", GITHUB: "GitHub", PAYPAL: "PayPal", OPENAI: "OpenAI", JAVASCRIPT: "JavaScript", TYPESCRIPT: "TypeScript", POWERPOINT: "PowerPoint", WHATSAPP: "WhatsApp", ECOMMERCE: "eCommerce" };
/** Function names that are lowercase in maths. */
const MATH_WORDS = new Set(["LIM", "SIN", "COS", "TAN", "LOG", "LN", "EXP", "MAX", "MIN", "SQRT"]);
/** After a number these are suffixes ("2ND", "1990S"), not codes. */
const NUMBER_SUFFIX = new Set(["ST", "ND", "RD", "TH", "S"]);

/**
 * "GUARANTEED QUESTION" → "Guaranteed question"; "POPULATION vs SAMPLE" → "Population vs sample". Mixed-case text is
 * left alone. Codes keep their capitals ("Q3 FY26", "$57.0B", "CO2"), single letters stay letters ("Vitamin C",
 * "Plan B"), and maths reads as maths ("LIM F(X) = 7" → "lim f(x) = 7", not "Lim f(x) = 7" or "F(7) = 2").
 */
export function sentenceCase(input: string): string {
  const s = input.trim();
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (!letters) return s;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (upper / letters.length < 0.6) return s;
  const math = /\b[A-Za-z]\(|[=≠≤≥<>^√∞]|\b[A-Z] OF [A-Z]\b/.test(s);
  // Only a word that opens the text gets a capital ("7.2 HRS" → "7.2 hrs", not "7.2 Hrs").
  const start = s.search(/[A-Za-z0-9]/);
  return s.replace(/[A-Za-z][A-Za-z']*/g, (w, at: number) => {
    const up = w.toUpperCase();
    const before = s[at - 1] ?? "", after = s[at + w.length] ?? "";
    // Glued to a digit: a code or unit ("Q3", "FY26", "$46.7B", "H2O"), unless it's an ordinal or a decade ("2nd", "1990s").
    if (/[0-9]/.test(before) && NUMBER_SUFFIX.has(up)) return w.toLowerCase();
    if (/[0-9]/.test(after) || /[0-9]/.test(before)) return up;
    if (math && (w.length === 1 || MATH_WORDS.has(up))) return w.toLowerCase();
    const out = CASED[up] ?? (ACRONYMS.has(up) || (w.length === 1 && up !== "A") ? up : w.toLowerCase());
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

/** "$46.7B", "22%", "1,200", "+3.5 pts", "$57 billion": a figure, not a word. */
export function isNumber(x: string): boolean {
  return /\d/.test(x) && x.replace(/(\d)\s*(bn|b|m|k|x|pts?|billion|million|thousand|percent)\b/gi, "$1").replace(/[\d\s$€£%+\-−.,:/]/g, "").length === 0;
}
