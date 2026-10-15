import { COLOR_VAR, parseMarkup } from "@/lib/markup";

/** Renders *primary* #warn# ^yellow^ ~cyan~ highlight markup as colored spans. */
export function MarkedText({ text, glow = false }: { text: string; glow?: boolean }) {
  return (
    <>
      {parseMarkup(text).map((t, i) =>
        t.color ? (
          <span
            key={i}
            style={{
              color: COLOR_VAR[t.color],
              textShadow: glow ? `0 0 22px color-mix(in srgb, ${COLOR_VAR[t.color]} 60%, transparent)` : undefined,
            }}
          >
            {t.text}
          </span>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}
