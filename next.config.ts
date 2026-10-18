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
        ],
      },
    ];
  },
};

export default nextConfig;
