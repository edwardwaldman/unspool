"use client";

import { Check, X as Cross } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "../analytics/track";
import { markStudied } from "./streak";

/** One quiz question from a reel the account has already made, picked on the server for the day (Eastern). */
export type DailyRefreshQ = { day: string; docId: string; docName: string; reel: number; question: string; options: string[]; answer: number };

const KEY = "unspool_refresh";
type Saved = { day: string; picked: number };

function readSaved(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    return s && typeof s.day === "string" && typeof s.picked === "number" ? s : null;
  } catch {
    return null;
  }
}
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => (listeners.add(cb), () => listeners.delete(cb));

/**
 * "Daily refresh": once a day, one question from a spool they've already watched. Tap an answer to see if it's right,
 * with a link back to the reel it came from. Answering counts towards the streak. Remembered per device for the day.
 */
export function DailyRefresh({ q }: { q: DailyRefreshQ }) {
  const saved = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY), () => null);
  const done = saved ? readSaved() : null;
  const picked = done && done.day === q.day ? done.picked : null;
  const [justNow, setJustNow] = useState(false);
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current || picked !== null) return;
    shown.current = true;
    track("refresh_shown", q.docName);
  }, [picked, q.docName]);

  const answer = (i: number) => {
    if (picked !== null) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ day: q.day, picked: i }));
    } catch {
      /* private mode: it still shows the result until they leave */
    }
    listeners.forEach((l) => l());
    setJustNow(true);
    markStudied();
    track("refresh_answered", i === q.answer ? "right" : "wrong");
  };
  const right = picked === q.answer;

  return (
    <section className="rounded-[20px] border border-line bg-surface p-4" data-testid="daily-refresh" aria-label="Daily refresh">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-thread">Daily refresh</span>
        <span className="truncate text-[12px] text-muted">From {q.docName}</span>
      </div>
      <p className="mt-2 text-[16px] font-semibold leading-snug text-ink">{q.question}</p>
      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Answers">
        {q.options.map((o, i) => {
          const isAnswer = i === q.answer;
          const isPicked = i === picked;
          const tone =
            picked === null
              ? "border-line hover:border-thread"
              : isAnswer
                ? "border-thread bg-thread/[0.12]"
                : isPicked
                  ? "border-coral bg-coral/[0.1]"
                  : "border-line opacity-55";
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={picked !== null}
              onClick={() => answer(i)}
              className={`flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left text-[14.5px] leading-snug text-ink transition-colors ${tone}`}
              data-testid={`refresh-option-${i}`}
            >
              <span className="min-w-0 flex-1">{o}</span>
              {picked !== null && isAnswer && <Check size={17} strokeWidth={2.6} className="shrink-0 text-thread" aria-hidden />}
              {picked !== null && isPicked && !isAnswer && <Cross size={17} strokeWidth={2.6} className="shrink-0 text-coral" aria-hidden />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2" aria-live="polite">
          <span className={`text-[13.5px] font-semibold ${right ? "text-thread" : "text-coral"}`}>
            {right ? (justNow ? "Nice, you remembered it." : "You got today's right.") : "Not quite. Worth a rewatch."}
            <span className="ml-1 font-normal text-muted">New question tomorrow.</span>
          </span>
          <Link href={`/s/${q.docId}?reel=${q.reel}`} onClick={() => track("refresh_rewatch")} className="text-[13.5px] font-semibold text-ink underline underline-offset-4 hover:text-thread">
            Rewatch that reel
          </Link>
        </div>
      )}
    </section>
  );
}
