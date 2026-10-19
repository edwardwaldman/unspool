import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc";

// Public marketing pages and the demo are crawlable; accounts, documents and APIs are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/s/demo", "/r/"], disallow: ["/api/", "/auth/", "/owner", "/library", "/profile", "/feed", "/reset", "/login", "/s/"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
