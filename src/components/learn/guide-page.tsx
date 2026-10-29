import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPage } from "@/components/shell/marketing-page";
import { guideBySlug, GUIDES } from "@/lib/guides";
import { topicBySlug } from "@/lib/topics";
import { JsonLd } from "./json-ld";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://unspool.cc";

export function guideMetadata(slug: string): Metadata {
  const g = guideBySlug(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.blurb,
    alternates: { canonical: `/${g.slug}` },
    openGraph: { url: `/${g.slug}`, title: g.title, description: g.blurb, siteName: "Unspool", type: "website", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: g.title }] },
  };
}

/** A public guide page (/pdf-to-video, /how-to-study-a-textbook-fast…), with FAQ structured data. */
export function GuidePage({ slug }: { slug: string }) {
  const g = guideBySlug(slug);
  if (!g) notFound();
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: g.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: g.title,
      description: g.blurb,
      step: g.steps.map(([name, text], i) => ({ "@type": "HowToStep", position: i + 1, name, text })),
    },
  ];
  const topics = g.topics.map(topicBySlug).filter((t) => !!t);
  return (
    <MarketingPage>
      <JsonLd data={ld} />
      <article className="mx-auto max-w-[760px] pt-12">
        <div className="label">{g.label}</div>
        <h1 className="mt-3 font-display text-[44px] leading-[1] sm:text-[58px]">{g.title}</h1>
        <div className="mt-6 space-y-4 text-[17px] leading-[1.6]">
          {g.intro.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <Link href="/" className="btn-primary mt-6 inline-block px-5 py-3 text-[15px]">Try it free</Link>

        <h2 className="mt-14 font-display text-[30px]">How it works</h2>
        <ol className="mt-5 grid gap-3">
          {g.steps.map(([name, text], i) => (
            <li key={name} className="flex gap-4 border border-line p-5">
              <span className="font-mono text-[22px] text-thread">{i + 1}</span>
              <div>
                <div className="text-[17px] font-semibold">{name}</div>
                <p className="mt-1 text-[15px] text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-12 grid items-center gap-6 sm:grid-cols-[1fr_160px]">
          <div>
            <h2 className="font-display text-[28px]">{g.why.heading}</h2>
            <div className="mt-4 space-y-4 text-[16px] leading-[1.6]">
              {g.why.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>
          <Link href="/s/demo" className="block" aria-label="Watch a sample study reel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/reel-2.jpg" alt="A sample Unspool study reel" width={160} height={284} className="h-[284px] w-[160px] border border-line object-cover" loading="lazy" />
            <span className="mt-2 block text-center font-mono text-[12px] text-muted">Watch a sample →</span>
          </Link>
        </section>

        <h2 className="mt-14 font-display text-[28px]">Questions</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {g.faqs.map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="text-[16px] font-semibold">{q}</dt>
              <dd className="mt-1 text-[15px] text-muted">{a}</dd>
            </div>
          ))}
        </dl>

        {topics.length > 0 && (
          <>
            <h2 className="mt-14 font-display text-[24px]">Free topic explainers</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {topics.map((t) => (
                <li key={t.slug}>
                  <Link href={`/learn/${t.slug}`} className="block border border-line p-4 hover:border-ink">
                    <div className="font-mono text-[11.5px] text-muted">{t.subject}</div>
                    <div className="mt-1 text-[16px] font-semibold">{t.title}, explained</div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/learn" className="mt-3 inline-block text-[14px] text-muted underline hover:text-ink">All topics</Link>
          </>
        )}

        <h2 className="mt-14 font-display text-[22px]">More guides</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {GUIDES.filter((x) => x.slug !== g.slug).map((x) => (
            <li key={x.slug}>
              <Link href={`/${x.slug}`} className="block border border-line px-3 py-1.5 text-[13.5px] text-muted hover:text-ink">{x.title}</Link>
            </li>
          ))}
        </ul>
      </article>
    </MarketingPage>
  );
}

export const GUIDE_URLS = GUIDES.map((g) => `${SITE}/${g.slug}`);
