import type { Accent } from "@/lib/schema";

export const ACCENTS: Record<Accent, string> = {
  blue: "#4d9fff",
  pink: "#ff4fa3",
  cyan: "#3be3ff",
  yellow: "#ffd43b",
  green: "#3df5a6",
  violet: "#a78bfa",
  orange: "#ff9f43",
};

const ORDER: Accent[] = ["blue", "pink", "cyan", "violet", "green", "orange", "yellow"];

export function accentFor(accent: Accent | undefined, index: number) {
  return ACCENTS[accent ?? ORDER[(index - 1) % ORDER.length]] ?? ACCENTS.blue;
}

export function fileBadge(ext: string) {
  const e = ext.toLowerCase();
  if (e === "pdf") return { label: "PDF", color: "#ff5a5f" };
  if (e === "docx") return { label: "DOC", color: "#4d9fff" };
  if (e === "pptx") return { label: "PPT", color: "#ff9f43" };
  if (e === "md" || e === "txt") return { label: e.toUpperCase(), color: "#a78bfa" };
  if (["png", "jpg", "jpeg", "webp"].includes(e)) return { label: "IMG", color: "#3df5a6" };
  return { label: "DOC", color: "#8a93ad" };
}
