"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { PlusIcon } from "../ui/icons";

// A brand-new account's first visit to Studio: a congratulations pop-up, a four-stop spotlight tour of the page,
// then a nudge to upload the first document (which opens the file picker). Shown once per account per device.

const SEEN = "unspool:tour-seen";
/** Set by the sign-up popup the moment an account is confirmed, so the tour shows even before the page knows. */
export const WELCOME_FLAG = "unspool:welcome";

export const PICK_EVENT = "unspool:pick";

type Stop = { target: string; title: string; body: string };
const STOPS: Stop[] = [
  { target: "studio-plus", title: "Drop in a document", body: "A PDF, Word file, slides, notes, or a photo of your notes. Unspool turns it into short reels with a voiceover and a quiz." },
  { target: "credit-bar", title: "Your credits", body: "1 credit makes 1 reel. Your count updates live, and Recharge tops you up anytime." },
  { target: "studio-stats", title: "Your library", body: "Every document lands here. Tap the arrow on one to see its reels, then tap a reel to watch." },
  { target: "studio-style", title: "Make it yours", body: "Reel style changes how every reel looks: captions, font, colour. It's a Pro feature." },
];

function readFlag(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeFlag(key: string, v: string | null) {
  try {
    if (v === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, v);
  } catch {
    // storage blocked: the tour may show again, which is harmless
  }
}

/** The visible element for a tour stop (desktop and phone layouts each render their own). */
function findTarget(id: string) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`));
  return all.find((el) => el.offsetParent !== null && el.getBoundingClientRect().width > 0) ?? null;
}

function Confetti() {
  const bits = Array.from({ length: 36 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((i) => {
        const left = (i * 37) % 100, delay = (i % 9) * 0.06, hue = ["#d3f05a", "#ff8b6c", "#9db8ff", "#f2d36b", "#e59cff"][i % 5];
        return (
          <motion.span
            key={i}
            className="absolute top-0 block h-2.5 w-1.5"
            style={{ left: `${left}%`, background: hue }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: 420, opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 540, x: ((i % 7) - 3) * 18 }}
            transition={{ duration: 1.8 + (i % 5) * 0.2, delay, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

/**
 * `isNew`: the server's view (account created in the last day, no documents yet). The sign-up flag covers the
 * moments right after confirming; either one starts the tour, and finishing or skipping it marks it seen.
 */
export function WelcomeTour({ isNew, fresh, email }: { isNew: boolean; fresh: boolean; email?: string | null }) {
  const [phase, setPhase] = useState<"off" | "hello" | "tour" | "go">("off");
  const [stop, setStop] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const flagged = readFlag(WELCOME_FLAG) === "1";
    // Only ever for an account made in the last day, and only once: it counts as seen the moment it shows,
    // however it's closed (finished, skipped, a file picked mid-tour, the tab left).
    if (!fresh || (!isNew && !flagged) || readFlag(SEEN) === "1") {
      if (!fresh && flagged) writeFlag(WELCOME_FLAG, null);
      return;
    }
    const id = window.setTimeout(() => {
      writeFlag(SEEN, "1");
      writeFlag(WELCOME_FLAG, null);
      setPhase("hello");
    }, 500);
    return () => window.clearTimeout(id);
  }, [isNew, fresh]);

  const finish = useCallback(() => {
    writeFlag(SEEN, "1");
    writeFlag(WELCOME_FLAG, null);
    setPhase("off");
  }, []);

  // Follow the spotlighted element (scroll it into view first, then track resizes and scrolls).
  const measure = useCallback(() => {
    const el = phase === "tour" ? findTarget(STOPS[stop].target) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [phase, stop]);
  useLayoutEffect(() => {
    if (phase !== "tour") return;
    findTarget(STOPS[stop].target)?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = window.setTimeout(measure, 350);
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [phase, stop, measure]);

  const next = () => {
    // Skip stops whose element isn't on this layout.
    let n = stop + 1;
    while (n < STOPS.length && !findTarget(STOPS[n].target)) n++;
    if (n >= STOPS.length) setPhase("go");
    else setStop(n);
  };
  const upload = () => {
    finish();
    window.dispatchEvent(new Event(PICK_EVENT));
  };

  if (phase === "off") return null;
  const pad = 8;
  const vw = typeof window === "undefined" ? 1000 : window.innerWidth, vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const cardW = Math.min(340, vw - 32), CARD_H = 200;
  // Under the element if there's room, else above it, else (a tall panel) beside it, vertically centred.
  const below = rect ? rect.bottom + pad + 12 + CARD_H < vh : true;
  const above = rect ? rect.top - pad - 12 - CARD_H > 0 : false;
  const beside = Boolean(rect && !below && !above);
  const sideLeft = rect ? (rect.left - pad - 16 - cardW > 16 ? rect.left - pad - 16 - cardW : Math.min(vw - cardW - 16, rect.right + pad + 16)) : 16;
  const cardLeft = beside ? sideLeft : rect ? Math.max(16, Math.min(vw - cardW - 16, rect.left + rect.width / 2 - cardW / 2)) : (vw - cardW) / 2;
  const cardPos = !rect ? { top: vh / 2 - CARD_H / 2 } : beside ? { top: Math.max(16, vh / 2 - CARD_H / 2) } : below ? { top: rect.bottom + pad + 12 } : { bottom: vh - rect.top + pad + 12 };

  return (
    <div className="fixed inset-0 z-[80]" data-testid="welcome-tour" role="dialog" aria-modal="true" aria-label="Welcome to Unspool">
      <AnimatePresence mode="wait">
        {phase === "hello" && (
          <motion.div key="hello" className="absolute inset-0 flex items-center justify-center bg-black/70 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="relative w-full max-w-[420px] overflow-hidden border border-line bg-paper p-7 text-center"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Confetti />
              <motion.div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-thread text-[30px]" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 380, damping: 14 }}>
                🎉
              </motion.div>
              <h2 className="relative mt-5 font-display text-[28px] leading-[1.1] text-ink">You&apos;re in. Welcome to Unspool!</h2>
              <p className="relative mt-2 text-[14.5px] leading-snug text-muted">
                {email ? <>Your account <span className="text-ink">{email}</span> is ready. </> : "Your account is ready. "}
                Here&apos;s a quick look around before your first reel.
              </p>
              <button type="button" onClick={() => { setStop(0); setPhase(findTarget(STOPS[0].target) ? "tour" : "go"); }} className="btn-primary relative mt-6 w-full py-3 text-[15px]" data-testid="tour-start">
                Show me around
              </button>
              <button type="button" onClick={() => setPhase("go")} className="relative mt-2 w-full py-2 text-[13.5px] text-muted hover:text-ink">
                Skip the tour
              </button>
            </motion.div>
          </motion.div>
        )}

        {phase === "tour" && (
          <motion.div key="tour" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* The spotlight: a clear hole over the element, everything else dimmed */}
            {rect ? (
              <motion.div
                className="pointer-events-none absolute border-2 border-thread"
                animate={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,.72)", borderRadius: 4 }}
              />
            ) : (
              <div className="absolute inset-0 bg-black/70" />
            )}
            <motion.div
              key={stop}
              className="absolute border border-line bg-paper p-5"
              style={{ width: cardW, left: cardLeft, ...cardPos }}
              initial={{ opacity: 0, y: below ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid="tour-card"
            >
              <div className="font-mono text-[11.5px] text-thread">
                {stop + 1} / {STOPS.length}
              </div>
              <h3 className="mt-1 font-display text-[20px] leading-[1.15] text-ink">{STOPS[stop].title}</h3>
              <p className="mt-1.5 text-[14px] leading-snug text-muted">{STOPS[stop].body}</p>
              <div className="mt-4 flex items-center justify-between">
                <button type="button" onClick={() => setPhase("go")} className="text-[13px] text-muted hover:text-ink">
                  Skip
                </button>
                <button type="button" onClick={next} className="btn-primary px-5 py-2 text-[14px]" data-testid="tour-next">
                  {stop === STOPS.length - 1 ? "Got it" : "Next"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === "go" && (
          <motion.div key="go" className="absolute inset-0 flex items-center justify-center bg-black/70 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-[400px] border border-line bg-paper p-7 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <h2 className="font-display text-[26px] leading-[1.1] text-ink">Make your first reel</h2>
              <p className="mt-2 text-[14.5px] leading-snug text-muted">Pick a document you have to read: class notes, a chapter, a work PDF. Your first one is free.</p>
              <button type="button" onClick={upload} className="btn-primary mx-auto mt-6 flex w-full items-center justify-center gap-2 py-3.5 text-[15.5px]" data-testid="tour-upload">
                <PlusIcon size={18} strokeWidth={2.4} /> Upload a document
              </button>
              <button type="button" onClick={finish} className="mt-2 w-full py-2 text-[13.5px] text-muted hover:text-ink">
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
