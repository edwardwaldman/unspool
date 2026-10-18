// Building blocks shared by the Terms and Privacy pages: header, table of contents, numbered sections
// and a flat data table. Body copy relies on `.prose-unspool` (globals.css) for headings, paragraphs and lists.

export type TocItem = { id: string; title: string };

export function LegalHeader({ title, effective, intro }: { title: string; effective: string; intro: React.ReactNode }) {
  return (
    <header>
      <div className="label">Legal</div>
      <h1 className="mt-3 font-display text-[42px] leading-none">{title}</h1>
      <p className="font-mono !text-[12px] !text-muted">
        Effective {effective} · Last updated {effective}
      </p>
      {intro}
    </header>
  );
}

/** Numbered list of anchor links to every section. */
export function LegalToc({ items }: { items: TocItem[] }) {
  return (
    <nav aria-label="Contents" className="mt-8 border-y border-line py-6">
      <div className="label">Contents</div>
      <ol className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id} className="!mb-1.5 flex gap-3 text-[14.5px]">
            <span className="w-6 shrink-0 font-mono text-[12.5px] leading-[1.7] text-muted">{String(i + 1).padStart(2, "0")}</span>
            <a href={`#${item.id}`} className="!text-ink !no-underline hover:!text-thread hover:!underline">
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** One top-level section; `n` is its position in the table of contents. */
export function LegalSection({ item, n, children }: { item: TocItem; n: number; children: React.ReactNode }) {
  return (
    <section id={item.id} aria-labelledby={`${item.id}-title`} className="scroll-mt-6">
      <h2 id={`${item.id}-title`}>
        <span className="mr-3 font-mono text-[0.95rem] font-normal tracking-normal text-muted">{String(n).padStart(2, "0")}</span>
        {item.title}
      </h2>
      {children}
    </section>
  );
}

export function LegalH3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-2 text-[16px] font-semibold text-ink">{children}</h3>;
}

/** Flat, bordered table that scrolls sideways on narrow screens instead of widening the page. */
export function LegalTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="my-5 overflow-x-auto border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px] leading-[1.55]">
        <thead>
          <tr className="border-b border-line bg-surface">
            {head.map((h) => (
              <th key={h} scope="col" className="label px-3 py-2.5 align-bottom !text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-line last:border-b-0">
              {row.map((cell, c) => (
                <td key={c} className={`px-3 py-2.5 align-top ${c === 0 ? "font-medium text-ink" : "text-ink/80"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
