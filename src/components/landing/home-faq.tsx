import { HOME_FAQ, homeFaqJsonLd } from "@/lib/home-faq";

/** The landing's FAQ section, with its FAQPage structured data. Server-rendered, passed into the landing card. */
export function HomeFaq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-6 min-[900px]:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd()).replace(/</g, "\\u003c") }} />
      <div className="label">Questions</div>
      <h2 className="mt-2 font-display text-[28px] leading-tight">Unspool, the AI study tool, explained</h2>
      <div className="mt-5 border-t border-line">
        {HOME_FAQ.map(([q, a]) => (
          <details key={q} className="group border-b border-line py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px]">
              <h3 className="font-normal">{q}</h3>
              <span className="font-mono text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink/75">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
