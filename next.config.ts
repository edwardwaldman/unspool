import type { NextConfig } from "next";

// Content Security Policy. Scripts and styles: this origin plus Next's inline bootstrap (no nonces, so
// 'unsafe-inline'); everything the browser fetches or plays comes from here or Supabase (API, realtime,
// signed audio/video URLs). Stripe Checkout, the billing portal and Google sign-in are full-page
// navigations, which CSP doesn't restrict. No framing, plugins, <base> hijacking or off-site form posts.
const SUPABASE = (() => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
    return host && !host.endsWith(".supabase.co") ? ` https://${host} wss://${host}` : "";
  } catch {
    return "";
  }
})();
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co${SUPABASE}`,
  `media-src 'self' data: blob: https://*.supabase.co${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${SUPABASE}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["mammoth"],
  // The per-reel job renders video in-function: ship the ffmpeg-static binary (resolved by path in
  // src/lib/video/render.ts, never imported, so no other route carries it) and the caption font.
  outputFileTracingIncludes: {
    "/api/jobs/reel": ["./node_modules/ffmpeg-static/ffmpeg", "./assets/fonts/**/*"],
    "/r/**": ["./brand/fonts/Unbounded-700.ttf", "./brand/fonts/Syne-800.ttf", "./brand/fonts/InstrumentSans-500.ttf"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // No framing (clickjacking on delete-account / checkout), no <base> or plugin injection.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/demo/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/:file(og-image.png|icon.svg|favicon.ico|apple-touch-icon-180.png|android-chrome-:size.png|maskable-512.png)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
