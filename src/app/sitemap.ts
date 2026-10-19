import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc";

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date("2026-10-19");
  return [
    { url: `${SITE}/`, lastModified: at, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/s/demo`, lastModified: at, changeFrequency: "monthly", priority: 0.9, videos: [1, 2, 3].map((n) => ({ title: `Unspool sample reel ${n}`, thumbnail_loc: `${SITE}/demo/reel-${n}.jpg`, content_loc: `${SITE}/demo/reel-${n}.mp4`, description: "A short study reel Unspool made from a document: hook, voiceover, captions and a quiz." })) },
    { url: `${SITE}/pricing`, lastModified: at, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/about`, lastModified: at, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/terms`, lastModified: at, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: at, changeFrequency: "yearly", priority: 0.2 },
  ];
}
