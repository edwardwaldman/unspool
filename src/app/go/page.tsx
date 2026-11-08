import type { Metadata } from "next";
import { AuthModal } from "@/components/auth/auth-modal";
import { GoHero } from "@/components/go/go-hero";
import { Toaster } from "@/components/ui/toast";
import { ResumeStashedUpload } from "@/components/upload/use-uploader";

// The landing page for TikTok, Instagram, YouTube and paid ads (link it as /go?utm_source=tiktok).
// Kept out of search: it's a near-copy of the home page meant only for ad clicks.
export const metadata: Metadata = {
  title: "Snap a photo, get study TikToks",
  description: "Snap your notes, upload a PDF or type a topic. Get short study TikToks with a voiceover, captions and a quiz. Your first reel is free.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export default function GoPage() {
  return (
    <>
      <GoHero />
      <AuthModal />
      <ResumeStashedUpload />
      <Toaster />
    </>
  );
}
