import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc"),
  title: { default: "Unspool — Drop a doc. Unspool it.", template: "%s · Unspool" },
  description:
    "Drag in any document — class notes, a textbook chapter, a work PDF, a contract — and Unspool turns it into 10 swipeable reels with voiceover, animated visuals and a quick quiz.",
  openGraph: {
    title: "Unspool — Drop a doc. Unspool it.",
    description: "Your textbook, but it's reels. Turn any document into 10 swipeable explainer reels.",
    siteName: "Unspool",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg0 text-ink">{children}</body>
    </html>
  );
}
