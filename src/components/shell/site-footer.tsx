import Link from "next/link";
import { SocialLinks } from "./social-links";

const LINKS = [
  ["/about", "About"],
  ["/about#questions", "Help"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  ["/pricing", "Pricing"],
  ["/learn", "Study topics"],
  ["/how-to-study-a-textbook-fast", "Study guide"],
  ["mailto:hello@unspool.cc", "Contact"],
] as const;

/** Small centered footer: links, privacy opt-out, social profiles, notes, copyright. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line px-6 py-8 text-center">
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-muted">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-ink">
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/privacy#do-not-sell" className="mt-2 inline-block text-[13px] text-muted hover:text-ink">
        Do Not Sell My Personal Information
      </Link>
      <SocialLinks className="mt-4 justify-center" />
      <p className="mt-4 text-[11.5px] text-muted/80">
        Reels are written by AI from your document. Check anything important against the original.
      </p>
      <p className="mt-2 text-[11.5px] text-muted/80">Your files are private and never used to train AI.</p>
      <p className="mt-2 text-[11.5px] text-muted/80">Copyright ©{new Date().getFullYear()} Unspool. All Rights Reserved.</p>
    </footer>
  );
}
