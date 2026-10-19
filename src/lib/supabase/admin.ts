import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

/** Service-role client. Server-only: bypasses RLS, so every caller must authorize first. */
export function adminClient(): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("adminClient() must not run in the browser");
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}
