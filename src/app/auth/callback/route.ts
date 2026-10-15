import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ANON_COOKIE } from "@/lib/config";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** OAuth / magic-link landing: create the session, then attach this browser's anonymous spools to the account. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL(`/login?error=missing_code&next=${encodeURIComponent(next)}`, url.origin));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL(`/login?error=auth&next=${encodeURIComponent(next)}`, url.origin));
  }

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
