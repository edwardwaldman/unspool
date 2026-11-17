import type { Metadata } from "next";
import { AuthModal } from "@/components/auth/auth-modal";
import { GoHero, type GoCopy } from "@/components/go/go-hero";
import { Toaster } from "@/components/ui/toast";
import { ResumeStashedUpload } from "@/components/upload/use-uploader";

// The landing page for the corporate-training ads (link it as /teams?utm_source=tiktok-teams).
// Same one-job page as /go, worded for training managers. Kept out of search: it exists for ad clicks.
export const metadata: Metadata = {
  title: "Turn training docs into TikToks your team will watch",
  description: "Upload a handbook, SOP or policy PDF. Get short TikTok-style videos with a voiceover, captions and a quiz. Your first reel is free.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

const TEAMS_COPY: GoCopy = {
  headline: <>Turn training docs into <span className="text-thread">TikToks.</span></>,
  subline: "Upload a handbook, SOP or policy PDF. Get short videos with a voiceover, captions and a quiz.",
  docTitle: "Handbook.pdf",
  topics: [
    "Workplace fire safety",
    "Spotting a phishing email",
    "Our expense policy",
    "Data privacy basics for staff",
    "Forklift pre-use checks",
    "Handling a customer complaint",
    "Lifting safely at work",
    "Information security for new hires",
  ],
  ticks: ["First reel free", "No card needed", "Your files stay private"],
  reels: ["/go/phish", "/go/lift", "/go/fire"],
  plus: { label: "Upload a training PDF", sub: "a handbook, SOP, policy or slides" },
};

export default function TeamsPage() {
  return (
    <>
      <GoHero copy={TEAMS_COPY} />
      <AuthModal />
      <ResumeStashedUpload />
      <Toaster />
    </>
  );
}
