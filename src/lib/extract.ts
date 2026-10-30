import { MAX_PAGES, MAX_WORDS, extensionOf } from "./config";
import { transcribeWithClaude } from "./claude";

export type Extracted = {
  text: string;
  pageCount: number | null;
  wordCount: number;
  truncated: boolean;
  method: "text" | "ocr";
};

export class ExtractionError extends Error {}

const IMAGE_TYPES: Record<string, "image/png" | "image/jpeg" | "image/webp"> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function clean(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(buf: Buffer, maxPages: number) {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const totalPages = pdf.numPages;
  // Only parse the pages this tier reads, one at a time: unpdf's extractText() parses every page at once,
  // so a small file declaring tens of thousands of pages could exhaust the function's memory and time.
  const pages: string[] = [];
  try {
    for (let n = 1; n <= Math.min(totalPages, maxPages); n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : "")).join(""));
    }
  } finally {
    await pdf.loadingTask.destroy().catch(() => undefined);
  }
  return {
    text: pages.map((p, i) => `[Page ${i + 1}]\n${p}`).join("\n\n"),
    pageCount: totalPages,
    pagesTruncated: totalPages > maxPages,
    plainWords: countWords(pages.join(" ")),
  };
}

async function extractDocx(buf: Buffer) {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return value;
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

async function extractPptx(buf: Buffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buf);
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => Number(/(\d+)\.xml$/.exec(a)![1]) - Number(/(\d+)\.xml$/.exec(b)![1]));
  const slides: string[] = [];
  for (const [i, f] of slideFiles.entries()) {
    const xml = await zip.files[f].async("string");
    const paragraphs = xml.split(/<\/a:p>/).map((p) =>
      [...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1])).join(""),
    );
    slides.push(`[Slide ${i + 1}]\n${paragraphs.filter((p) => p.trim()).join("\n")}`);
  }
  return { text: slides.join("\n\n"), pageCount: slideFiles.length };
}

function capWords(text: string, maxWords: number) {
  const words = countWords(text);
  if (words <= maxWords) return { text, words, truncated: false };
  // Cut on a word boundary, keeping original whitespace.
  let count = 0;
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  let end = text.length;
  while ((m = re.exec(text))) {
    count++;
    if (count === maxWords) {
      end = m.index + m[0].length;
      break;
    }
  }
  return { text: text.slice(0, end), words: maxWords, truncated: true };
}

const MAX_UNZIPPED_BYTES = 200 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 5000;

const startsWith = (buf: Buffer, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);

/**
 * Check the file's bytes match its extension before any parser or paid model sees it: the extension is
 * whatever the uploader typed. Text files must not be binary.
 */
function assertContentMatches(buf: Buffer, ext: string) {
  const ok =
    ext === "pdf"
      ? buf.subarray(0, 1024).includes("%PDF-")
      : ext === "docx" || ext === "pptx"
        ? startsWith(buf, [0x50, 0x4b, 0x03, 0x04])
        : ext === "png"
          ? startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
          : ext === "jpg" || ext === "jpeg"
            ? startsWith(buf, [0xff, 0xd8, 0xff])
            : ext === "webp"
              ? startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)
              : ext === "txt" || ext === "md"
                ? !buf.subarray(0, 64 * 1024).includes(0)
                : true; // unknown extensions are refused below

  if (!ok) throw new ExtractionError(`This file doesn't look like a real .${ext} file. Try exporting it again.`);
}

/** Refuse zip bombs: Office files are zips, and the parsers inflate entries fully into memory. */
async function assertSafeZip(buf: Buffer) {
  const JSZip = (await import("jszip")).default;
  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    throw new ExtractionError("We couldn't open this file. Try exporting it again.");
  }
  let entries = 0;
  let total = 0;
  zip.forEach((_, file) => {
    entries++;
    // JSZip keeps the central directory's declared size on the (internal) _data field.
    total += (file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
  });
  if (entries > MAX_ZIP_ENTRIES || total > MAX_UNZIPPED_BYTES) {
    throw new ExtractionError("This file is too large to unpack. Try a smaller file.");
  }
}

/** Pull readable text out of an uploaded file. Falls back to OCR (via Claude vision) for scans and images. */
export async function extractDocument(
  buf: Buffer,
  fileName: string,
  limits: { maxPages?: number; maxWords?: number } = {},
): Promise<Extracted> {
  const maxPages = Math.min(limits.maxPages ?? 20, MAX_PAGES);
  const ext = extensionOf(fileName);
  let text = "";
  let pageCount: number | null = null;
  let truncated = false;
  let method: Extracted["method"] = "text";

  assertContentMatches(buf, ext);
  if (ext === "docx" || ext === "pptx") await assertSafeZip(buf);

  if (ext === "pdf") {
    const pdf = await extractPdf(buf, maxPages);
    pageCount = pdf.pageCount;
    truncated = pdf.pagesTruncated;
    text = pdf.text;
    // Scanned PDFs have little or no text layer.
    const expected = Math.max(40, Math.min(pdf.pageCount, maxPages) * 25);
    if (pdf.plainWords < expected) {
      if (buf.length > 30 * 1024 * 1024 || pdf.pageCount > 100) {
        if (pdf.plainWords < 40) throw new ExtractionError("This PDF looks scanned and is too large to OCR. Try a smaller file.");
      } else {
        const ocr = await transcribeWithClaude({ kind: "pdf", data: buf.toString("base64") });
        if (countWords(ocr) > pdf.plainWords) {
          text = ocr;
          method = "ocr";
        }
      }
    }
  } else if (ext === "docx") {
    text = await extractDocx(buf);
  } else if (ext === "pptx") {
    const pptx = await extractPptx(buf);
    text = pptx.text;
    pageCount = pptx.pageCount;
  } else if (ext === "txt" || ext === "md") {
    text = buf.toString("utf8");
  } else if (IMAGE_TYPES[ext]) {
    if (buf.length > 5 * 1024 * 1024) throw new ExtractionError("Images must be under 5 MB.");
    text = await transcribeWithClaude({ kind: "image", mediaType: IMAGE_TYPES[ext], data: buf.toString("base64") });
    pageCount = 1;
    method = "ocr";
  } else {
    throw new ExtractionError("Unsupported file type. Try PDF, DOCX, PPTX, TXT, MD or an image.");
  }

  const capped = capWords(clean(text), limits.maxWords ?? MAX_WORDS);
  // A photo is often one handout, diagram or a few lines of notes: a lower bar than a whole file.
  const isImage = Boolean(IMAGE_TYPES[ext]);
  if (capped.words < (isImage ? 15 : 40)) {
    throw new ExtractionError(
      isImage
        ? "We couldn't read enough in this photo. Try a closer, well-lit shot of the page, with the text in focus."
        : "We couldn't find enough readable text in this file.",
    );
  }
  return {
    text: capped.text,
    pageCount,
    wordCount: capped.words,
    truncated: truncated || capped.truncated,
    method,
  };
}
