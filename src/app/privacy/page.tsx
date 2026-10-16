import type { Metadata } from "next";
import { MarketingPage } from "@/components/shell/marketing-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <article className="prose-unspool max-w-[720px] pt-14">
        <div className="label">Legal</div>
        <h1 className="mt-3 font-display text-[42px] leading-none">Privacy Policy</h1>
        <p className="font-mono !text-[12px] !text-muted">Last updated October 2026</p>
        <h2>The short version</h2>
        <ul>
          <li>Documents you upload are private to you. They are never public and never shared with other users.</li>
          <li>Your documents are never used to train AI models — not by us, and not by the AI providers we use.</li>
          <li>You can delete any document at any time. Deleting removes the file, its reel scripts and its audio.</li>
          <li>Anonymous uploads that are never unlocked are deleted automatically after 7 days.</li>
        </ul>
        <h2>What we collect</h2>
        <p>
          The files you upload and the text extracted from them; the reels we generate (scripts and voiceover audio); your email address
          if you sign in; payment status from Stripe (we never see or store your card number); and basic technical data such as a hashed
          IP address used to enforce free-tier limits.
        </p>
        <h2>How we use it</h2>
        <p>
          Only to provide Unspool: turning your document into reels, keeping your library, processing payments and preventing abuse. To
          generate reels we send document text to our AI providers (Anthropic for writing scripts; a text-to-speech provider for
          voiceover) under terms that prohibit training on your data.
        </p>
        <h2>Where it&apos;s stored</h2>
        <p>Files, scripts and audio are stored in private, access-controlled storage (Supabase). The app is hosted on Vercel.</p>
        <h2>Your choices</h2>
        <p>Delete individual documents from the reel menu or your library. To delete your account entirely, contact us and we will remove all associated data.</p>
        <h2 id="do-not-sell">Do Not Sell My Personal Information</h2>
        <p>We do not sell or share your personal information. If you want to confirm this or ask us to delete your data, email privacy@unspool.cc.</p>
        <h2>Contact</h2>
        <p>Questions? Email privacy@unspool.cc.</p>
      </article>
    </MarketingPage>
  );
}
