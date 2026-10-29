import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/learn/json-ld";
import { TopicQuiz } from "@/components/learn/topic-quiz";
import { MarketingPage } from "@/components/shell/marketing-page";
import { relatedTopics, topicBySlug, TOPICS } from "@/lib/topics";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc";

export const dynamicParams = false;
export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const t = topicBySlug((await params).slug);
  if (!t) return {};
  const title = `${t.title} explained simply (with a quiz)`;
  return {
    title,
    description: t.blurb,
    alternates: { canonical: `/learn/${t.slug}` },
    openGraph: { url: `/learn/${t.slug}`, title: `${t.title}, explained simply`, description: t.blurb, siteName: "Unspool", type: "article", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${t.title}, explained` }] },
  };
}

export default async function TopicPage({ params }: PageProps<"/learn/[slug]">) {
  const t = topicBySlug((await params).slug);
  if (!t) notFound();
  const url = `${SITE}/learn/${t.slug}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Learn", item: `${SITE}/learn` },
        { "@type": "ListItem", position: 2, name: t.subject, item: `${SITE}/learn#${t.subject.toLowerCase()}` },
        { "@type": "ListItem", position: 3, name: t.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: `${t.title}, explained simply`,
      description: t.blurb,
      url,
      inLanguage: "en",
      isAccessibleForFree: true,
      learningResourceType: "Explainer",
      educationalLevel: "High school and college",
      about: { "@type": "Thing", name: t.title },
      teaches: t.points,
      provider: { "@type": "Organization", name: "Unspool", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: `${t.title} quiz`,
      about: { "@type": "Thing", name: t.title },
      hasPart: t.quiz.map(([q, options, answer, why]) => ({
        "@type": "Question",
        name: q,
        eduQuestionType: "Multiple choice",
        acceptedAnswer: { "@type": "Answer", text: options[answer], answerExplanation: { "@type": "Comment", text: why } },
        suggestedAnswer: options.filter((_, i) => i !== answer).map((o) => ({ "@type": "Answer", text: o })),
      })),
    },
  ];
  return (
    <MarketingPage>
      <JsonLd data={ld} />
      <article className="mx-auto max-w-[720px]">
        <nav className="mt-8 font-mono text-[12px] text-muted" aria-label="Breadcrumb">
          <Link href="/learn" className="hover:text-ink">Learn</Link> / <Link href={`/learn#${t.subject.toLowerCase()}`} className="hover:text-ink">{t.subject}</Link> / {t.title}
        </nav>
        <div className="label mt-6">{t.subject}</div>
        <h1 className="mt-3 font-display text-[44px] leading-[1] sm:text-[56px]">{t.title}, explained simply</h1>
        <div className="mt-6 space-y-4 text-[17px] leading-[1.6]">
          {t.summary.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <h2 className="mt-12 font-display text-[28px]">Key points</h2>
        <ul className="mt-4 space-y-2 text-[16px] leading-[1.55]">
          {t.points.map((p) => (
            <li key={p} className="flex gap-3">
              <span className="text-thread">—</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-[28px]">Key terms</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {t.terms.map(([term, def]) => (
            <div key={term} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-muted">{def}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-12 font-display text-[28px]">Quick quiz</h2>
        <p className="mt-2 text-[15px] text-muted">Testing yourself beats rereading. Three questions:</p>
        <div className="mt-5">
          <TopicQuiz quiz={t.quiz} />
        </div>

        <section className="mt-14 border border-line p-6 sm:flex sm:items-center sm:gap-6">
          <Link href="/s/demo" className="block shrink-0" aria-label="Watch a sample study reel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/reel-1.jpg" alt="A sample Unspool study reel" width={120} height={213} className="h-[213px] w-[120px] border border-line object-cover" loading="lazy" />
          </Link>
          <div className="mt-5 sm:mt-0">
            <div className="label">Studying {t.title.toLowerCase()} for a class?</div>
            <p className="mt-2 text-[16px]">Drop in your own notes, slides or textbook chapter and Unspool turns them into short reels with voiceover, captions and a quiz in every one.</p>
            <Link href="/" className="btn-primary mt-4 inline-block px-5 py-3 text-[15px]">Turn your notes into reels, free</Link>
          </div>
        </section>

        <h2 className="mt-14 font-display text-[24px]">Keep learning</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {relatedTopics(t).map((r) => (
            <li key={r.slug}>
              <Link href={`/learn/${r.slug}`} className="block border border-line p-4 hover:border-ink">
                <div className="font-mono text-[11.5px] text-muted">{r.subject}</div>
                <div className="mt-1 text-[16px] font-semibold">{r.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </MarketingPage>
  );
}
