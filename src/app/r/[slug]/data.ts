import { cache } from "react";
import { supabaseConfigured } from "@/lib/config";
import { DEMO_SHARE, loadPublicShare } from "@/lib/shares";

/** One load per request, shared by generateMetadata, the page and the OG image. */
export const getShare = cache(async (slug: string, signMedia = true) => {
  if (!supabaseConfigured && slug !== DEMO_SHARE) return null;
  try {
    return await loadPublicShare(slug, { signMedia });
  } catch (err) {
    console.error("[share] load failed", err);
    return null;
  }
});

export const plainHook = (s: string) => s.replace(/[*#^~]/g, "").trim();
