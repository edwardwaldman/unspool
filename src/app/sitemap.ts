import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { TOPICS } from "@/lib/topics";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc";

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date("2026-10-19");
  const content = new Date("2026-10-29");
  return [
    { url: `${SITE}/`, lastModified: at, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/s/demo`, lastModified: at, changeFrequency: "monthly", priority: 0.9, videos: [1, 2, 3].map((n) => ({ title: `Unspool sample reel ${n}`, thumbnail_loc: `${SITE}/demo/reel-${n}.jpg`, content_loc: `${SITE}/demo/reel-${n}.mp4`, description: "A short study reel Unspool made from a document: hook, voiceover, captions and a quiz." })) },
    { url: `${SITE}/pricing`, lastModified: at, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/about`, lastModified: at, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/learn`, lastModified: content, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${SITE}/${g.slug}`, lastModified: content, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...TOPICS.map((t) => ({ url: `${SITE}/learn/${t.slug}`, lastModified: content, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE}/terms`, lastModified: at, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: at, changeFrequency: "yearly", priority: 0.2 },
  ];
}
