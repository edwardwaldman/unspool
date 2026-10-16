import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Font families are referenced by theme.css (--font-display, --font-hook, --font-ui, --font-numeric).
const display = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const hook = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["700", "800"] });
const ui = Geist({ variable: "--font-geist", subsets: ["latin"] });
const numeric = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc"),
  title: { default: "Unspool — Drop a doc. Unspool it.", template: "%s · Unspool" },
  description:
    "Drop in class notes, a textbook chapter, a work PDF or a contract. Unspool turns it into 10 short reels with voiceover, visuals and a quiz.",
  openGraph: {
    title: "Unspool — Drop a doc. Unspool it.",
    description: "Your textbook, but it's reels.",
    siteName: "Unspool",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0e1220",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${hook.variable} ${ui.variable} ${numeric.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink text-cream">{children}</body>
    </html>
  );
}
