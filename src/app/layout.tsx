import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque, Instrument_Sans, Martian_Mono, Syne, Unbounded } from "next/font/google";
import "./globals.css";

// Font families are referenced by theme.css (--font-display, --font-hook, --font-ui, --font-numeric).
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["600", "700", "800"] });
const hook = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["700", "800"] });
const ui = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const wordmark = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["700", "800"] });
const headline = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["600", "700"] });
const numeric = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc"),
  title: { default: "Unspool — Drop a doc. Unspool it.", template: "%s · Unspool" },
  description:
    "Drop in class notes, a textbook chapter, a work PDF or a contract. Unspool turns it into short reels with voiceover, visuals and a quiz.",
  openGraph: {
    title: "Unspool — Drop a doc. Unspool it.",
    description: "Your textbook, but it's reels.",
    siteName: "Unspool",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Unspool — One document into reels" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "16x16 32x32 48x48" }],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f1d18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${hook.variable} ${ui.variable} ${numeric.variable} ${wordmark.variable} ${headline.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
