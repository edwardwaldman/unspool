"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ACCENT_HEX, DEFAULT_REEL_STYLE, FONT_VAR, REEL_STYLE_OPTIONS, reelStyleVars, type ReelStyle, type ReelStyleKey } from "@/lib/reel-style";
import { reelVars } from "../reel/accent";
import { Captions } from "../reel/captions";
import { LockIcon } from "../ui/icons";
import { toast } from "../ui/toast";

/** Crown + lime "PRO" pill: marks a premium feature. */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-thread px-1.5 py-[3px] text-[10.5px] font-bold leading-none tracking-[0.06em] text-paper ${className}`}>
      <Crown size={11} strokeWidth={2.4} aria-hidden /> PRO
    </span>
  );
}

/** The account's reel style, saved to /api/studio/style on every change (optimistic; rolled back on failure). */
export function useReelStyle(initial: ReelStyle, canEdit: boolean, onSaved?: (s: ReelStyle) => void) {
  const [style, setStyle] = useState(initial);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const set = async (key: ReelStyleKey, value: string) => {
    if (!canEdit || style[key] === value) return;
    const prev = style;
    const next = { ...style, [key]: value } as ReelStyle;
    setStyle(next);
    setSaving("saving");
    const res = await fetch("/api/studio/style", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ style: next }) }).catch(() => null);
    if (res?.ok) {
      onSaved?.(next);
      return setSaving("saved");
    }
    setStyle(prev);
    setSaving("idle");
    toast(res?.status === 403 ? "Reel style is a Pro feature." : "Couldn't save your style. Try again.", 3500);
  };
  return { style, set, saving };
}

const SAMPLE = "Mitochondria turn your lunch into *energy* for every cell.";
const SAMPLE_WORDS = SAMPLE.split(" ").map((_, i, a) => i / a.length);

/** A small 9:16 card that plays a sample caption in the chosen style. */
export function StylePreview({ style, className = "" }: { style: ReelStyle; className?: string }) {
  const [t, setT] = useState(0.35);
  useEffect(() => {
    const id = window.setInterval(() => setT((x) => (x >= 0.98 ? 0 : x + 0.11)), 520);
    return () => window.clearInterval(id);
  }, []);
  const paper = style.theme === "paper";
  return (
    <div
      className={`relative aspect-[9/16] overflow-hidden border border-line [container-type:size] ${className}`}
      style={{ ...reelVars(1), ...reelStyleVars(style), ...(paper ? { filter: "invert(1) hue-rotate(180deg)" } : {}) }}
      aria-label="Reel style preview"
      role="img"
    >
      <div className="absolute inset-x-3 top-3 font-hook text-[13px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Why your cells <span className="px-[2px] text-[#08110e]" style={{ background: "var(--thread)" }}>never</span> run out
      </div>
      <div className="absolute left-3 right-3 top-[24%] h-[18%] border border-white/10" style={{ background: "color-mix(in srgb, var(--thread) 14%, transparent)" }} aria-hidden>
        <div className="absolute bottom-2 left-2 h-[40%] w-[14%]" style={{ background: "var(--thread)" }} />
        <div className="absolute bottom-2 left-[22%] h-[65%] w-[14%] bg-white/70" />
        <div className="absolute bottom-2 left-[42%] h-[85%] w-[14%]" style={{ background: "var(--thread)" }} />
      </div>
      <div className="absolute inset-x-2" style={style.position === "middle" ? { top: "50%", transform: "translateY(-50%)" } : { bottom: "17%" }}>
        <Captions text={SAMPLE} words={SAMPLE_WORDS} fraction={t} variant={style.captions} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[13%] border-t border-line bg-paper/85" aria-hidden>
        <div className="ml-2 mt-2 flex items-center gap-1.5">
          <span className="h-3.5 w-3.5" style={{ background: "var(--thread)" }} />
          <span className="h-1.5 w-[45%] bg-white/50" />
        </div>
      </div>
    </div>
  );
}

const ROWS: [ReelStyleKey, string][] = [
  ["captions", "Captions"],
  ["font", "Font"],
  ["accent", "Accent"],
  ["position", "Caption position"],
  ["theme", "Background"],
];

function Swatch({ k, id }: { k: ReelStyleKey; id: string }) {
  if (k === "accent") return <span className="h-3 w-3 shrink-0 border border-white/20" style={{ background: ACCENT_HEX[id as ReelStyle["accent"]] }} aria-hidden />;
  if (k === "theme") return <span className="h-3 w-3 shrink-0 border border-white/20" style={{ background: id === "paper" ? "#ece7da" : "#08110e" }} aria-hidden />;
  return null;
}

/**
 * "Reel style": how every reel looks (captions, font, accent, caption position, background), with a live
 * preview. Pro and Ultra only: everyone else sees it blurred and locked, and any tap shows the upgrade.
 */
export function ReelStylePanel({ initial, canEdit, compact = false, onSaved }: { initial: ReelStyle; canEdit: boolean; compact?: boolean; onSaved?: (s: ReelStyle) => void }) {
  const { style, set, saving } = useReelStyle(canEdit ? initial : DEFAULT_REEL_STYLE, canEdit, onSaved);
  const [upsell, setUpsell] = useState(false);
  return (
    <div data-testid="reel-style" data-locked={canEdit ? undefined : "true"}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          Reel style <ProBadge />
        </span>
        <span className="text-[12px] text-muted" aria-live="polite">
          {canEdit ? (saving === "saving" ? "Saving" : saving === "saved" ? "Saved" : "All your reels") : "Locked"}
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muted">Change how every reel looks: captions, font, colour and layout.</p>

      {!canEdit && (
        <div className={`mt-4 border p-4 transition-colors ${upsell ? "border-thread bg-thread/[0.06]" : "border-line bg-surface"}`} data-testid="style-upsell">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <LockIcon size={15} /> A Pro feature
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">Pick your caption style, font and colours once and every reel you make follows. On Pro and Ultra.</p>
          <Link href="/pricing" className="mt-3 flex w-full items-center justify-center gap-2 bg-thread px-4 py-2.5 text-[14px] font-semibold text-paper transition-opacity hover:opacity-90">
            <Crown size={15} strokeWidth={2.2} aria-hidden /> Upgrade to Pro
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <div className={`relative ${compact ? "" : "mx-auto"}`}>
          <StylePreview style={style} className={`${compact ? "mx-auto w-[112px]" : "w-[150px]"} ${canEdit ? "" : "opacity-60"}`} />
        </div>
        <div className="relative space-y-3.5">
          {ROWS.map(([k, label]) => (
            <fieldset key={k} className={canEdit ? "" : "select-none blur-[1.5px] opacity-60"}>
              <legend className="mb-1.5 text-[12px] font-medium text-muted">{label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {REEL_STYLE_OPTIONS[k].map(([id, name]) => {
                  const on = style[k] === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      aria-disabled={!canEdit}
                      onClick={() => (canEdit ? void set(k, id) : setUpsell(true))}
                      className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[12.5px] transition-colors ${on ? "border-thread bg-thread/10 text-ink" : "border-line text-muted hover:border-muted hover:text-ink"}`}
                      style={k === "font" ? { fontFamily: FONT_VAR[id as ReelStyle["font"]] } : undefined}
                    >
                      <Swatch k={k} id={id} />
                      {name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {!canEdit && (
            <button type="button" aria-label="Reel style is a Pro feature. Show upgrade" onClick={() => setUpsell(true)} className="absolute inset-0 z-10 cursor-pointer" />
          )}
        </div>
      </div>
      {canEdit && <p className="mt-4 text-[11.5px] leading-snug text-muted">Applies to your own reels as they play. Shared links and rendered videos keep the standard look.</p>}
    </div>
  );
}
