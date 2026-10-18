import type { NextConfig } from "next";

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
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
};

export default nextConfig;
