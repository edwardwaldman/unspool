import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANON_COOKIE, REF_COOKIE } from "../config";

/** Refresh the Supabase auth session and make sure every visitor has an anonymous session token. */
export async function updateSession(request: NextRequest) {
  let anon = request.cookies.get(ANON_COOKIE)?.value;
  const newAnon = !anon;
  if (!anon) {
    anon = crypto.randomUUID();
    request.cookies.set(ANON_COOKIE, anon);
  }

  let response = NextResponse.next({ request });

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // Do not put code between createServerClient and getClaims(): it refreshes the session.
    await supabase.auth.getClaims();
  }

  if (newAnon) {
    response.cookies.set(ANON_COOKIE, anon, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  // Arrived from a share link's call to action (?ref=share&s=<slug>): remember it (first touch only).
  const s = request.nextUrl.searchParams.get("s");
  if (request.nextUrl.searchParams.get("ref") === "share" && s && /^[A-Za-z0-9_-]{4,16}$/.test(s) && !request.cookies.get(REF_COOKIE)) {
    response.cookies.set(REF_COOKIE, s, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}
