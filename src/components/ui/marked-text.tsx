import { COLOR_VAR, parseMarkup } from "@/lib/markup";

/** Renders *thread* #coral# ^butter^ ~sage~ highlight markup as colored spans. */
export function MarkedText({ text }: { text: string }) {
  return (
    <>
      {parseMarkup(text).map((t, i) =>
        t.color ? (
          <span key={i} style={{ color: COLOR_VAR[t.color] }}>
            {t.text}
          </span>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}
