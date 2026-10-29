import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/learn/json-ld";
import { MarketingPage } from "@/components/shell/marketing-page";
import { SUBJECTS, TOPICS } from "@/lib/topics";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc";

export const metadata: Metadata = {
  title: "Learn: study topics explained simply",
  description: `${TOPICS.length} high school and college topics in biology, chemistry, physics, math, history, economics and psychology, each explained simply with key terms and a quick quiz.`,
  alternates: { canonical: "/learn" },
  openGraph: { url: "/learn", title: "Study topics explained simply, with quizzes", description: "Free explainers with key points, key terms and a quiz for every topic.", siteName: "Unspool", type: "website", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Unspool Learn" }] },
};

export default function LearnPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Study topics explained simply",
    url: `${SITE}/learn`,
    hasPart: TOPICS.map((t) => ({ "@type": "LearningResource", name: t.title, url: `${SITE}/learn/${t.slug}` })),
  };
  return (
    <MarketingPage>
      <JsonLd data={ld} />
      <section className="mx-auto max-w-[860px] pt-12">
        <div className="label">Learn</div>
        <h1 className="mt-3 font-display text-[48px] leading-[0.95] sm:text-[64px]">Study topics, explained simply.</h1>
        <p className="mt-5 max-w-[620px] text-[17px] leading-[1.55] text-muted">
          {TOPICS.length} topics from high school and college classes. Each one has a plain-English explanation, the key points, the terms you need, and a quick quiz to check it stuck.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Subjects">
          {SUBJECTS.map((s) => (
            <a key={s} href={`#${s.toLowerCase()}`} className="border border-line px-3 py-1.5 text-[13px] text-muted hover:text-ink">
              {s}
            </a>
          ))}
        </nav>
        {SUBJECTS.map((s) => (
          <section key={s} id={s.toLowerCase()} className="mt-12 scroll-mt-6">
            <h2 className="font-display text-[30px]">{s}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {TOPICS.filter((t) => t.subject === s).map((t) => (
                <li key={t.slug}>
                  <Link href={`/learn/${t.slug}`} className="block h-full border border-line p-4 hover:border-ink">
                    <div className="text-[17px] font-semibold">{t.title}</div>
                    <p className="mt-1 text-[13.5px] leading-[1.45] text-muted">{t.blurb}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="mt-16 border border-line p-6">
          <div className="label">Your own class</div>
          <p className="mt-2 text-[17px]">Have notes, slides or a textbook chapter? Unspool turns them into short reels with voiceover, captions and a quiz.</p>
          <Link href="/" className="btn-primary mt-4 inline-block px-5 py-3 text-[15px]">Try it free</Link>
        </section>
      </section>
    </MarketingPage>
  );
}
