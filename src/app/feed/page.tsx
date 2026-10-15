import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { AllFeed } from "@/components/spool/all-feed";

export const metadata: Metadata = { title: "All spools", robots: { index: false } };

export default function FeedPage() {
  return (
    <AppShell active="reels" feed>
      <AllFeed />
    </AppShell>
  );
}
