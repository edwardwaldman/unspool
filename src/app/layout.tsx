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

/** Official Unspool profiles, so search engines tie them to unspool.cc. Add new ones here. */
const SAME_AS = ["https://x.com/unspoolcc"];

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc"),
  title: { default: "Unspool — Turn any document into study reels", template: "%s · Unspool" },
  description:
    "Drop in class notes, a textbook chapter, a work PDF or a contract. Unspool turns it into short reels with voiceover, captions, visuals and a quiz, so studying takes minutes instead of hours.",
  applicationName: "Unspool",
  keywords: [
    "document to video", "PDF to video", "study reels", "AI study tool", "notes to video", "textbook summary", "study faster",
    "AP study", "flashcards alternative", "AI video summary", "PowerPoint to video", "reading to reels", "quiz generator",
  ],
  authors: [{ name: "Unspool" }],
  creator: "Unspool",
  publisher: "Unspool",
  category: "education",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: "Unspool — Turn any document into study reels",
    description: "Your textbook, but it's reels. Voiceover, captions and a quiz in every one.",
    siteName: "Unspool",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Unspool — One document into reels" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unspool — Turn any document into study reels",
    description: "Your textbook, but it's reels. Voiceover, captions and a quiz in every one.",
    images: ["/og-image.png"],
  },
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

// iPads get the site as if Safari were zoomed out to 85%: the layout viewport is widened by 1/0.85 and Safari
// scales it to fit. Phones and computers keep device-width. Re-applied on rotation and if the meta tag is re-rendered.
// Sitewide structured data: who we are and what the site is.
const SITE_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://unspool.cc/#org", name: "Unspool", url: "https://unspool.cc", logo: "https://unspool.cc/android-chrome-512.png", email: "hello@unspool.cc", sameAs: SAME_AS },
    { "@type": "WebSite", "@id": "https://unspool.cc/#site", name: "Unspool", url: "https://unspool.cc", publisher: { "@id": "https://unspool.cc/#org" }, inLanguage: "en-US" },
    {
      "@type": "SoftwareApplication",
      name: "Unspool",
      url: "https://unspool.cc",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "Turns documents (PDF, Word, PowerPoint, notes) into short study reels with voiceover, captions, visuals and a quiz.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free plan: one document" },
      publisher: { "@id": "https://unspool.cc/#org" },
    },
  ],
}).replace(/</g, "\\u003c");

const IPAD_ZOOM = `(function(){var ua=navigator.userAgent;if(!(/iPad/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)))return;document.documentElement.setAttribute("data-ipad","");
function want(){var a=screen.width,b=screen.height,land=matchMedia("(orientation: landscape)").matches,w=land?Math.max(a,b):Math.min(a,b);return "width="+Math.round(w/0.85)+", viewport-fit=cover";}
function apply(){var c=want(),ms=document.querySelectorAll('meta[name="viewport"]');if(!ms.length){var m=document.createElement("meta");m.name="viewport";document.head.appendChild(m);ms=[m];}for(var i=0;i<ms.length;i++)if(ms[i].content!==c)ms[i].content=c;}
apply();document.addEventListener("DOMContentLoaded",apply);addEventListener("orientationchange",function(){setTimeout(apply,50)});addEventListener("resize",apply);
new MutationObserver(apply).observe(document.head,{subtree:true,childList:true,attributes:true,attributeFilter:["content"]});})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${hook.variable} ${ui.variable} ${numeric.variable} ${wordmark.variable} ${headline.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: IPAD_ZOOM }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_LD }} />
      </head>
      <body className="min-h-full bg-paper text-ink">
        {children}
        <VisitTracker />
        <OwnerViewBox />
      </body>
    </html>
  );
}
