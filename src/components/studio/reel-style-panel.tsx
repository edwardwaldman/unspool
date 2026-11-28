"use client";

import { Crown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ACCENT_HEX, DEFAULT_REEL_STYLE, FONT_VAR, REEL_STYLE_OPTIONS, reelStyleVars, type ReelStyle, type ReelStyleKey } from "@/lib/reel-style";
import { reelVars } from "../reel/accent";
import { Captions } from "../reel/captions";
import { LockIcon } from "../ui/icons";
import { toast } from "../ui/toast";
import { track } from "../analytics/track";
import { startCheckout } from "../billing/checkout";
import { useCredits } from "./credit-bar";

/** Crown + lime pill: marks a paid feature ("PRO" for reel editing, "PLUS" for reel style). */
export function ProBadge({ className = "", label = "PRO" }: { className?: string; label?: "PRO" | "PLUS" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-[4px] bg-thread px-1.5 py-[3px] text-[10.5px] font-bold leading-none tracking-[0.06em] text-paper ${className}`}>
      <Crown size={11} strokeWidth={2.4} aria-hidden /> {label}
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
    toast(res?.status === 403 ? "Reel style comes with Plus." : "Couldn't save your style. Try again.", 3500);
  };
  return { style, set, saving };
}

const SAMPLE = "Mitochondria turn your lunch into *energy* for every cell.";
const SAMPLE_WORDS = SAMPLE.split(" ").map((_, i, a) => i / a.length);

/** A small 9:16 card that plays a sample caption in the chosen style. */
export function StylePreview({ style, className = "", still = false }: { style: ReelStyle; className?: string; /** Hold the caption still (no word-by-word ticking). */ still?: boolean }) {
  const [t, setT] = useState(still ? 1 : 0.35);
  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setT((x) => (x >= 0.98 ? 0 : x + 0.11)), 520);
    return () => window.clearInterval(id);
  }, [still]);
  const paper = style.theme === "paper";
  return (
    <div
      className={`relative aspect-[9/16] overflow-hidden border border-line [container-type:size] ${className}`}
      style={{ ...reelVars(1), ...reelStyleVars(style), ...(paper ? { filter: "invert(1) hue-rotate(180deg)" } : {}) }}
      aria-label="Reel style preview"
      role="img"
    >
      <div className="absolute inset-x-[8cqw] top-[5cqh] font-hook text-[8.6cqw] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Why your cells <span className="px-[2px] text-[#08110e]" style={{ background: "var(--thread)" }}>never</span> run out
      </div>
      <div className="absolute left-[8cqw] right-[8cqw] top-[31%] h-[15%] border border-white/10" style={{ background: "color-mix(in srgb, var(--thread) 14%, transparent)" }} aria-hidden>
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

// The looks the upsell shows, one after another (each a real combination of the options below).
const SHOWCASE: ReelStyle[] = [
  { captions: "pop", font: "display", accent: "coral", position: "bottom", theme: "dark" },
  { captions: "karaoke", font: "rounded", accent: "ocean", position: "bottom", theme: "dark" },
  { captions: "clean", font: "serif", accent: "violet", position: "bottom", theme: "paper" },
  { captions: "spotlight", font: "mono", accent: "lime", position: "bottom", theme: "dark" },
  { captions: "pop", font: "classic", accent: "mono", position: "bottom", theme: "dark" },
];
const optName = (k: ReelStyleKey, id: string) => (REEL_STYLE_OPTIONS[k] as readonly (readonly [string, string])[]).find(([v]) => v === id)?.[1] ?? id;
const describe = (st: ReelStyle) => `${optName("captions", st.captions)} captions, ${optName("font", st.font).toLowerCase()} font, ${optName("accent", st.accent).toLowerCase()}`;

/**
 * Tapping Reel style without Plus: a pop-up where three sample reels keep changing look (captions, font, colour,
 * layout), and one button to upgrade (the free trial when they can still take it; it's Plus too).
 */
export function StyleUpsell({ open, onClose }: { open: boolean; onClose: () => void }) {
  const usage = useCredits();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    track("style_upsell_shown");
    const id = window.setInterval(() => setI((x) => x + 1), 2200);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => (window.clearInterval(id), window.removeEventListener("keydown", onKey));
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  const at = (k: number) => SHOWCASE[(i + k + SHOWCASE.length) % SHOWCASE.length];
  const upgrade = async () => {
    setBusy(true);
    track("style_upsell_tapped");
    const err = await startCheckout(usage?.trialEligible ? { kind: "trial", returnTo: "/studio" } : { kind: "subscription", tier: "plus", returnTo: "/studio" });
    if (err) {
      toast(err, 4000);
      setBusy(false);
    }
  };
  // A carousel: every sample keeps its own card, and each step they all glide one place left. The middle one is the
  // look being named; the side ones sit smaller, dimmer and still.
  const N = SHOWCASE.length;
  const slotOf = (k: number) => ((((k - i) % N) + N + 2) % N) - 2; // -2..2, 0 is the middle
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-5" role="dialog" aria-modal aria-label="Reel style" onClick={(e) => e.target === e.currentTarget && onClose()} data-testid="style-upsell-popup">
      <div className="relative w-full max-w-[360px] rounded-[22px] border border-line bg-surface p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,.5)]">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted hover:text-ink">
          <X size={18} strokeWidth={2} aria-hidden />
        </button>
        <h2 className="px-10 font-display text-[24px] leading-[1.05] text-ink">Make every reel yours</h2>
        <p className="mt-2 text-[13px] leading-snug text-muted">Pick the captions, font, colour and layout once. Every reel you make follows.</p>
        <div className="relative mx-auto mt-5 h-[214px] w-full overflow-hidden" aria-hidden>
          {SHOWCASE.map((st, k) => {
            const slot = slotOf(k), mid = slot === 0;
            return (
              <motion.div
                key={k}
                className="absolute left-1/2 top-1/2 w-[118px]"
                style={{ zIndex: 10 - Math.abs(slot), marginLeft: -59, marginTop: -105 }}
                initial={false}
                animate={{ x: slot * 92, scale: mid ? 1 : 0.78, rotate: slot * 4, opacity: Math.abs(slot) > 1 ? 0 : mid ? 1 : 0.55 }}
                transition={{ type: "spring", stiffness: 170, damping: 26, mass: 0.9 }}
              >
                <StylePreview style={st} still={!mid} className="w-full rounded-[14px] shadow-[0_14px_34px_rgba(0,0,0,.45)]" />
              </motion.div>
            );
          })}
        </div>
        <div className="relative mt-3 h-5 text-[12.5px] font-medium text-thread" aria-live="off">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={i} className="absolute inset-x-0" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
              {describe(at(0))}
            </motion.span>
          </AnimatePresence>
        </div>
        <button type="button" onClick={upgrade} disabled={busy} className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-thread px-4 text-[16px] font-semibold text-paper hover:opacity-90 disabled:opacity-60" data-testid="style-upsell-cta">
          <Crown size={17} strokeWidth={2.2} aria-hidden /> {busy ? "Loading..." : "Upgrade to Plus"}
        </button>
        <button type="button" onClick={onClose} className="mt-1 w-full py-2.5 text-[13.5px] text-muted hover:text-ink">
          Not now
        </button>
      </div>
    </div>,
    document.body,
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
 * preview. Plus, Pro and Ultra: everyone else sees it blurred and locked, and any tap shows the upgrade pop-up.
 */
export function ReelStylePanel({ initial, canEdit, compact = false, onSaved }: { initial: ReelStyle; canEdit: boolean; compact?: boolean; onSaved?: (s: ReelStyle) => void }) {
  const { style, set, saving } = useReelStyle(canEdit ? initial : DEFAULT_REEL_STYLE, canEdit, onSaved);
  const [upsell, setUpsell] = useState(false);
  const [popup, setPopup] = useState(false);
  return (
    <div data-testid="reel-style" data-locked={canEdit ? undefined : "true"}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          Reel style <ProBadge label="PLUS" />
        </span>
        <span className="text-[12px] text-muted" aria-live="polite">
          {canEdit ? (saving === "saving" ? "Saving" : saving === "saved" ? "Saved" : "All your reels") : "Locked"}
        </span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muted">Change how every reel looks: captions, font, colour and layout.</p>

      {!canEdit && (
        <div className={`mt-4 border p-4 transition-colors ${upsell ? "border-thread bg-thread/[0.06]" : "border-line bg-surface"}`} data-testid="style-upsell">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <LockIcon size={15} /> Comes with Plus
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">Pick your caption style, font and colours once and every reel you make follows. On Plus, Pro and Ultra.</p>
          <button type="button" onClick={() => setPopup(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-thread px-4 py-2.5 text-[14px] font-semibold text-paper transition-opacity hover:opacity-90">
            <Crown size={15} strokeWidth={2.2} aria-hidden /> Upgrade to Plus
          </button>
          <StyleUpsell open={popup} onClose={() => setPopup(false)} />
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
                      onClick={() => (canEdit ? void set(k, id) : (setUpsell(true), setPopup(true)))}
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
            <button type="button" aria-label="Reel style comes with Plus. Show upgrade" onClick={() => (setUpsell(true), setPopup(true))} className="absolute inset-0 z-10 cursor-pointer" data-no-press />
          )}
        </div>
      </div>
      {canEdit && <p className="mt-4 text-[11.5px] leading-snug text-muted">Applies to your own reels as they play. Shared links and rendered videos keep the standard look.</p>}
    </div>
  );
}
