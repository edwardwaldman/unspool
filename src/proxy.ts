import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // CSRF backstop (the auth cookies are SameSite=Lax too): a state-changing API call sent by a browser from
  // another site is refused. Server-to-server calls (jobs, cron) send no Origin and are authenticated by secret.
  if ((pathname.startsWith("/api/") || pathname.startsWith("/auth/")) && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      let sameHost = false;
      try {
        sameHost = new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
      } catch {
        // "null" (sandboxed frames, file://) and junk are never same-origin
      }
      if (!sameHost) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
    }
  }
  // A sign-in code that lands on the homepage (Supabase falls back to its Site URL when the requested
  // redirect isn't allow-listed) goes to the real callback, so the session is still created.
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, images and the Stripe webhook (which needs the raw, untouched request).
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)",
  ],
};
