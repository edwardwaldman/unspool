import type { CaptionLine, RenderSlot } from "./types";

// Builds the ASS subtitle script that ffmpeg (libass) burns into the frames: TikTok-style captions
// (a few words at a time, the word being spoken lit up in the accent) plus the big titles on
// generated title cards. Chunking mirrors the in-app <Captions> overlay so both look alike.

export const CAPTION_FONT = "Archivo";
const WORDS_PER_CHUNK = 5;

/** "#rrggbb" -> ASS "&H00BBGGRR&". */
export function assColor(hex: string, alpha = 0): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  const [r, g, b] = m ? [m[1], m[2], m[3]] : ["ff", "ff", "ff"];
  const a = Math.max(0, Math.min(255, Math.round(alpha))).toString(16).padStart(2, "0");
  return `&H${a}${b}${g}${r}&`.toUpperCase();
}

function assTime(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}

/** Keep libass from reading override tags or line breaks out of user/model text. */
function clean(text: string): string {
  return text.replace(/[{}]/g, (c) => (c === "{" ? "(" : ")")).replace(/\\/g, "/").replace(/\s+/g, " ").trim();
}

function chunkWords<T extends { text: string }>(words: T[]): T[][] {
  const out: T[][] = [];
  let cur: T[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[.!?,;:—]["')\]]*$/.test(w.text) || cur.length >= WORDS_PER_CHUNK) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

export function buildAss(opts: {
  width: number;
  height: number;
  captions: CaptionLine[];
  slots: RenderSlot[];
  highlight?: string;
}): string {
  const { width: W, height: H } = opts;
  const scale = H / 1280;
  const px = (n: number) => Math.round(n * scale);
  const hi = assColor(opts.highlight ?? "#d3f05a");
  const white = assColor("#ffffff");

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${W}`,
    `PlayResY: ${H}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: TV.709",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // Lower third, clear of the right-hand action rail and the bottom title block the app draws on top.
    `Style: Caption,${CAPTION_FONT},${px(56)},${white},${white},&H00000000&,&H90000000&,-1,0,0,0,100,100,0,0,1,${px(5)},${px(2)},2,${px(48)},${px(120)},${px(340)},1`,
    `Style: Title,${CAPTION_FONT},${px(96)},${hi},${hi},&H00000000&,&H90000000&,-1,0,0,0,100,100,-1,0,1,${px(6)},${px(3)},5,${px(60)},${px(60)},0,1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events: string[] = [];

  for (const slot of opts.slots) {
    const title = slot.card?.title && clean(slot.card.title);
    if (!title) continue;
    events.push(
      `Dialogue: 1,${assTime(slot.start + 0.05)},${assTime(slot.start + slot.duration)},Title,,0,0,0,,{\\pos(${Math.round(W / 2)},${px(560)})\\fad(250,200)}${title.toUpperCase()}`,
    );
  }

  for (const line of opts.captions) {
    const words = line.words.map((w) => ({ ...w, text: clean(w.text) })).filter((w) => w.text);
    if (!words.length) continue;
    const chunks = chunkWords(words);
    chunks.forEach((chunk, ci) => {
      const chunkStart = ci === 0 ? line.start : chunk[0].start;
      const chunkEnd = ci + 1 < chunks.length ? chunks[ci + 1][0].start : line.end;
      chunk.forEach((_, wi) => {
        const from = wi === 0 ? chunkStart : Math.max(chunkStart, chunk[wi].start);
        const to = wi + 1 < chunk.length ? Math.min(chunkEnd, chunk[wi + 1].start) : chunkEnd;
        if (to - from < 0.01) return;
        const text = chunk
          .map((w, k) => {
            if (k === wi) return `{\\c${hi}\\fscx106\\fscy106}${w.text}{\\r}`;
            const color = w.color ? `\\c${assColor(w.color)}` : "";
            const alpha = k > wi ? "\\1a&H48&" : "";
            return color || alpha ? `{${color}${alpha}}${w.text}{\\r}` : w.text;
          })
          // A hard space plus a normal one: Archivo's word space is tight at caption size.
          .join("\\h ");
        events.push(`Dialogue: 0,${assTime(from)},${assTime(to)},Caption,,0,0,0,,${text}`);
      });
    });
  }

  return [...header, ...events, ""].join("\n");
}
