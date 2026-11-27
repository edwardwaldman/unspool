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

// Modern countries a list or icon row may name ("THE ALLIES: France · Britain · Russia" was three identical outline
// flags): each is drawn as its own flag. Only names whose flag is unambiguous today; empires and old states
// ("Ottoman Empire", "Austria-Hungary", "USSR") keep their icon rather than borrow a modern flag.
const FLAGS: Record<string, string> = {
  france: "FR", britain: "GB", "great britain": "GB", "united kingdom": "GB", uk: "GB", russia: "RU", germany: "DE", italy: "IT",
  japan: "JP", china: "CN", "united states": "US", usa: "US", us: "US", america: "US", canada: "CA", mexico: "MX", brazil: "BR",
  argentina: "AR", spain: "ES", portugal: "PT", netherlands: "NL", belgium: "BE", switzerland: "CH", austria: "AT", hungary: "HU",
  poland: "PL", greece: "GR", turkey: "TR", serbia: "RS", romania: "RO", bulgaria: "BG", sweden: "SE", norway: "NO", denmark: "DK",
  finland: "FI", ireland: "IE", india: "IN", pakistan: "PK", australia: "AU", "new zealand": "NZ", egypt: "EG", israel: "IL",
  iran: "IR", iraq: "IQ", "saudi arabia": "SA", "south africa": "ZA", nigeria: "NG", kenya: "KE", korea: "KR", "south korea": "KR",
  "north korea": "KP", vietnam: "VN", cuba: "CU", ukraine: "UA", chile: "CL", peru: "PE", colombia: "CO", indonesia: "ID",
  philippines: "PH", thailand: "TH", singapore: "SG", taiwan: "TW",
};
/** "France" / "THE UNITED STATES" / "Britain · naval power" → its flag emoji, or "" when the label is not a country. */
export function flagOf(label: string): string {
  const name = (splitDots(label)[0] ?? "").split(/:\s/)[0].toLowerCase().replace(/^the\s+/, "").replace(/[^a-z ]+/g, "").trim();
  const code = FLAGS[name];
  return code ? String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : "";
}

const plainWords = (x: string) => x.toLowerCase().replace(/[*~^#_]+/g, "").replace(/[^\p{L}\p{N}\s-]+/gu, " ").split(/[\s-]+/).filter(Boolean);
const SKIP = new Set(["the", "a", "an", "of", "and", "to", "in", "on", "for", "by"]);
/**
 * When in the line (0..1, by word position) each item is first said: "France, Britain and Russia" lights France,
 * then Britain, then Russia as the voice gets to them. An item the line never names is spaced evenly between the
 * named ones (or over the first 60% of the line when none is named), so it still lands while the beat plays.
 */
export function cueTimes(say: string | undefined, labels: string[]): number[] {
  const line = plainWords(say ?? "");
  const found = labels.map((label) => {
    const key = plainWords(splitDots(label)[0] ?? label).filter((w) => !SKIP.has(w));
    if (!key.length || !line.length) return -1;
    const at = line.findIndex((_, i) => key.every((w, k) => (line[i + k] ?? "").startsWith(w.slice(0, Math.max(3, w.length - 2)))));
    return at < 0 ? -1 : at / line.length;
  });
  if (!found.some((t) => t >= 0)) return labels.map((_, i) => (0.6 * i) / Math.max(1, labels.length - 1));
  return found.map((t, i) => {
    if (t >= 0) return t;
    const prev = found.slice(0, i).filter((x) => x >= 0).at(-1) ?? 0;
    const next = found.slice(i + 1).find((x) => x >= 0) ?? Math.min(1, prev + 0.2);
    return (prev + next) / 2;
  });
}

/** The largest font size (up to max) at which the longest word of the text still fits in width px (bold display face). */
export function fitWord(texts: string[], width: number, max: number): number {
  const longest = Math.max(1, ...texts.flatMap((t) => t.split(/[\s-]+/)).map((w) => w.length));
  return Math.max(15, Math.min(max, Math.floor(width / (longest * 0.62))));
}
