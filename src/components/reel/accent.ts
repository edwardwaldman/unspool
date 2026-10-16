// One accent for every reel. Meaning colors (sage/coral/butter) are applied only through markup and quiz states.
export const THREAD = "var(--thread)";

/** Canvas can't read CSS variables cheaply per frame, so it gets the resolved value. */
export function threadHex() {
  if (typeof window === "undefined") return "#d3f05a";
  return getComputedStyle(document.documentElement).getPropertyValue("--thread").trim() || "#d3f05a";
}

export function fileLabel(ext: string) {
  const e = ext.toLowerCase();
  if (e === "docx") return "DOC";
  if (e === "pptx") return "PPT";
  if (["png", "jpg", "jpeg", "webp"].includes(e)) return "IMG";
  return (e || "DOC").toUpperCase().slice(0, 4);
}
