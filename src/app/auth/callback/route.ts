import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANON_COOKIE, safeNextPath } from "@/lib/config";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * OAuth / email-link landing: create the session, then attach this browser's anonymous spools to the account.
 * Handles PKCE (`code`) and email templates that link with `token_hash` + `type` (confirm signup, recovery, magic link).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get("next"));
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, url.origin));

  if (url.searchParams.get("error")) return fail("auth");
  if (!code && !(tokenHash && type)) return fail("missing_code");

  const supabase = await createClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
  if (error || !data.user) return fail("auth");

  const anon = (await cookies()).get(ANON_COOKIE)?.value;
  if (anon) {
    await adminClient()
      .from("documents")
      .update({ user_id: data.user.id, anon_token: null })
      .is("user_id", null)
      .eq("anon_token", anon);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
