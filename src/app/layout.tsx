import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque, Instrument_Sans, Martian_Mono, Syne, Unbounded } from "next/font/google";
import { VisitTracker } from "@/components/analytics/visit-tracker";
import { OwnerViewBox } from "@/components/owner/owner-view-box";
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

// iPads get the site as if Safari were zoomed out to 75%: the layout viewport is widened by 1/0.75 and Safari
// scales it to fit. Phones and computers keep device-width. Re-applied on rotation and if the meta tag is re-rendered.
const IPAD_ZOOM = `(function(){var ua=navigator.userAgent;if(!(/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)))return;
function want(){var a=screen.width,b=screen.height,land=matchMedia("(orientation: landscape)").matches,w=land?Math.max(a,b):Math.min(a,b);return "width="+Math.round(w/0.75)+", viewport-fit=cover";}
function apply(){var c=want(),ms=document.querySelectorAll('meta[name="viewport"]');if(!ms.length){var m=document.createElement("meta");m.name="viewport";document.head.appendChild(m);ms=[m];}for(var i=0;i<ms.length;i++)if(ms[i].content!==c)ms[i].content=c;}
apply();document.addEventListener("DOMContentLoaded",apply);addEventListener("orientationchange",function(){setTimeout(apply,50)});addEventListener("resize",apply);
new MutationObserver(apply).observe(document.head,{subtree:true,childList:true,attributes:true,attributeFilter:["content"]});})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${hook.variable} ${ui.variable} ${numeric.variable} ${wordmark.variable} ${headline.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: IPAD_ZOOM }} />
      </head>
      <body className="min-h-full bg-paper text-ink">
        {children}
        <VisitTracker />
        <OwnerViewBox />
      </body>
    </html>
  );
}
