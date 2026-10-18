import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { reelAccent } from "@/components/reel/accent";
import { getShare, plainHook } from "./data";

export const alt = "A reel made with Unspool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (f: string) => readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "brand", "fonts", f));
const MARK = (accent: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="10" width="26" height="5" fill="#e9f0e4"/><rect x="8" y="49" width="26" height="5" fill="#e9f0e4"/><rect x="12" y="15" width="18" height="34" fill="${accent}"/><rect x="12" y="23" width="18" height="2" fill="#0f1d18"/><rect x="12" y="31" width="18" height="2" fill="#0f1d18"/><rect x="12" y="39" width="18" height="2" fill="#0f1d18"/><path d="M30 19H46V24" fill="none" stroke="${accent}" stroke-width="3"/><rect x="38" y="24" width="18" height="30" fill="#e9f0e4"/><path d="M44 32L52 39L44 46Z" fill="#0f1d18"/></svg>`,
  )}`;

/** 1200x630 link preview for a shared reel: its hook on the reel's flat tint, accent bar, wordmark. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const share = await getShare(slug, false);
  const accent = reelAccent(share?.index ?? 1);
  const hook = share ? plainHook(share.hook) : "Turn any document into reels.";
  const fit = hook.length > 110 ? 46 : hook.length > 70 ? 56 : 66;
  const [unbounded, syne, instrument] = await Promise.all([font("Unbounded-700.ttf"), font("Syne-800.ttf"), font("InstrumentSans-500.ttf")]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0f1d18", color: "#e9f0e4", fontFamily: "Instrument" }}>
        <div style={{ width: 18, height: "100%", background: accent }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px 56px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={MARK(accent)} width={64} height={64} alt="" />
            <div style={{ fontFamily: "Syne", fontSize: 46, letterSpacing: "-0.02em" }}>unspool</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Unbounded", fontSize: fit, lineHeight: 1.12, letterSpacing: "-0.02em", maxWidth: 1000 }}>
            {hook.length > 160 ? `${hook.slice(0, 157)}…` : hook}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
            <div style={{ display: "flex", color: "#8ea595" }}>Made with Unspool — turn any document into reels</div>
            <div style={{ display: "flex", background: accent, color: "#0f1d18", padding: "10px 20px", fontSize: 26 }}>Watch the reel</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Unbounded", data: unbounded, weight: 700, style: "normal" },
        { name: "Syne", data: syne, weight: 800, style: "normal" },
        { name: "Instrument", data: instrument, weight: 500, style: "normal" },
      ],
    },
  );
}
