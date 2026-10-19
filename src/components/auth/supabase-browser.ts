"use client";

import type { createClient } from "@/lib/supabase/client";

/**
 * The browser Supabase client, loaded on demand. Every caller is async (a sign-in, an upload, the
 * session check after mount), so the ~250 KB auth library stays out of the first JavaScript a page
 * needs to paint and hydrate, and is fetched right after instead.
 */
export function supabaseBrowser(): Promise<ReturnType<typeof createClient>> {
  return import("@/lib/supabase/client").then((m) => m.createClient());
}
