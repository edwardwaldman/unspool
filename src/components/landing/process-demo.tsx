"use client";

import { Check, FileText, Heart, Plus } from "lucide-react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { SAMPLE_SPOOL } from "@/lib/sample";
import { useMedia } from "../ui/use-media";

// Stage is drawn at 900×520 and scaled to fit.
const W = 900;
const H = 520;
const REELS = SAMPLE_SPOOL.reels.slice(0, 5);
const FILES = ["unit-3-notes.pdf", "apartment-lease.pdf", "onboarding-guide.docx"];
const STAGES = ["Read", "Plan", "Write"];
const TILE = 420;

// Scroll progress (0..1) → scene. Each scene gets a slice of the scroll.
const SCENES = [
  { id: "plus", from: 0, to: 0.16 },
  { id: "pick", from: 0.16, to: 0.36 },
  { id: "load", from: 0.36, to: 0.6 },
  { id: "reels", from: 0.6, to: 1 },
] as const;
type SceneId = (typeof SCENES)[number]["id"];

function sceneAt(p: number): { id: SceneId; t: number } {
  for (const s of SCENES) if (p < s.to) return { id: s.id, t: Math.max(0, (p - s.from) / (s.to - s.from)) };
  return { id: "reels", t: 1 };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

function cursorFor(id: SceneId, t: number) {
  if (id === "plus") return { x: lerp(760, 445, t / 0.7), y: lerp(420, 205, t / 0.7), press: t > 0.75 };
  if (id === "pick") return { x: lerp(445, 400, t / 0.6), y: lerp(205, 236, t / 0.6), press: t > 0.7 };
  if (id === "load") return { x: lerp(400, 700, t), y: lerp(236, 420, t), press: false };
  // reels: swipe up once per reel
  const local = (t * (REELS.length - 1)) % 1;
  return { x: 470, y: 380 - Math.sin(local * Math.PI) * 160, press: local > 0.1 && local < 0.9 };
}

function Stage({ p, narrow, h }: { p: number; narrow: boolean; h: number }) {
  const { id, t } = sceneAt(p);
  const raw = cursorFor(id, t);
  // Cursor paths are authored for the 900px stage; squeeze them toward the centre of the phone stage.
  const c = narrow ? { ...raw, x: (raw.x - 450) * 0.4 + 180, y: (raw.y - 240) * 0.85 + (h - 40) / 2 } : raw;
  const loaded = id === "load" ? Math.round(t * 10) : id === "reels" ? 10 : 0;
  const stage = loaded < 3 ? 0 : loaded < 7 ? 1 : loaded < 10 ? 2 : 3;
  const reelPos = id === "reels" ? t * (REELS.length - 1) : 0;
  const reelIdx = Math.round(reelPos);

  return (
    <div className="relative" style={{ height: h - 40 }}>
      {(id === "plus" || id === "pick") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center bg-ink text-paper" style={{ transform: `scale(${id === "plus" && c.press ? 0.9 : 1})`, transition: "transform .15s" }}>
            <Plus size={44} strokeWidth={1.75} />
          </div>
          <div className="label mt-5">Upload a document</div>
        </div>
      )}

      {id === "pick" && (
        <div
          className="absolute left-1/2 top-1/2 z-20 border border-line bg-paper"
          style={{ width: narrow ? 300 : 380, transform: `translate(-50%, calc(-50% + ${lerp(20, 0, t / 0.3)}px))`, opacity: lerp(0, 1, t / 0.3) }}
        >
          <div className="label border-b border-line px-4 py-2.5">Choose a file</div>
          {FILES.map((f, i) => (
            <div
              key={f}
              className="flex items-center gap-3 border-b border-line px-4 py-3 text-[14px] last:border-b-0"
              style={{
                background: i === 0 && t > 0.7 ? "color-mix(in srgb, var(--thread) 18%, transparent)" : undefined,
                color: i === 0 ? "var(--ink)" : "var(--muted)",
              }}
            >
              <FileText size={16} strokeWidth={1.5} />
              {f}
            </div>
          ))}
        </div>
      )}

      {id === "load" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 text-muted">
            <FileText size={18} strokeWidth={1.5} />
            <span className="font-mono text-[13px]">unit-3-notes.pdf</span>
          </div>
          <div className={`mt-5 text-center font-display leading-none ${narrow ? "text-[32px]" : "text-[40px]"}`}>Unspooling your doc</div>
          <div className={`mt-8 flex ${narrow ? "flex-col gap-3" : "gap-8"}`}>
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-[14px]" style={{ color: i < stage ? "var(--ink)" : i === stage ? "var(--thread)" : "var(--muted)" }}>
                {i < stage ? <Check size={14} strokeWidth={2} /> : <span className="font-mono text-[11px]">0{i + 1}</span>}
                {s}
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-10 gap-1.5" style={{ width: narrow ? 280 : 460 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-2" style={{ background: i < loaded ? "var(--thread)" : "var(--border)" }} />
            ))}
          </div>
          <div className="mt-3 font-mono text-[12px] text-muted">{loaded}/10 reels</div>
        </div>
      )}

      {id === "reels" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[250px] border border-ink/60 bg-paper p-[7px]">
            <div className="relative overflow-hidden border border-line" style={{ height: TILE }}>
              <div style={{ transform: `translateY(${-reelPos * TILE}px)` }}>
                {REELS.map((r) => (
                  <div key={r.id} className="flex flex-col justify-between p-4" style={{ height: TILE }}>
                    <div>
                      <div className="font-mono text-[10px] text-muted">{r.index}/{REELS.length}</div>
                      <div className="mt-2 font-hook text-[18px] font-extrabold leading-[1.12]">{r.hook}</div>
                    </div>
                    <div className="grid grid-cols-8 gap-[7px] self-center">
                      {Array.from({ length: 40 }, (_, k) => (
                        <span key={k} className="h-[5px] w-[5px] rounded-full" style={{ background: (k * 7 + r.index) % 5 === 0 ? "var(--thread)" : "var(--border)" }} />
                      ))}
                    </div>
                    <div className="font-hook text-[13px] font-bold uppercase text-thread">{r.title}</div>
                  </div>
                ))}
              </div>
              <div className="absolute bottom-16 right-4 text-thread" style={{ opacity: Math.abs(reelPos - reelIdx) < 0.12 ? 1 : 0, transition: "opacity .2s" }}>
                <Heart size={22} fill="currentColor" strokeWidth={0} />
              </div>
            </div>
          </div>
          <div className={narrow ? "absolute right-3 top-3 text-right" : "absolute right-16 top-1/2 -translate-y-1/2 text-right"}>
            <div className={`font-mono leading-none text-thread ${narrow ? "text-[22px]" : "text-[44px]"}`}>
              {reelIdx + 1}
              <span className="text-muted">/{REELS.length}</span>
            </div>
            {!narrow && <div className="label mt-2">Keep scrolling</div>}
          </div>
        </div>
      )}

      {/* Cursor */}
      <div className="pointer-events-none absolute left-0 top-0 z-30" style={{ transform: `translate(${c.x}px, ${c.y}px) scale(${c.press ? 0.85 : 1})` }}>
        <svg width="26" height="30" viewBox="0 0 18 20">
          <path d="M1 1 L1 15 L5 11.5 L8 18 L10.5 17 L7.6 10.6 L13 10.6 Z" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        {c.press && <span className="absolute -left-4 -top-4 h-9 w-9 rounded-full border-2 border-thread opacity-70" />}
      </div>
    </div>
  );
}

/** The whole product flow, scrubbed by scroll: progress 0 → 1 plays click +, pick, unspool, swipe. */
export function ProcessDemo({ progress }: { progress: MotionValue<number> }) {
  const [p, setP] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setP(v));
  const lg = useMedia("(min-width: 1024px)");
  const md = useMedia("(min-width: 640px)");
  const narrow = !md;
  const vw = useViewportWidth();
  const w = narrow ? 360 : W;
  const h = narrow ? 600 : H;
  const k = lg ? 1.05 : md ? 0.7 : Math.min(1, (vw - 32) / w);

  return (
    <div className="mx-auto" style={{ width: w * k }} aria-hidden>
      <div style={{ width: w * k, height: h * k }}>
        <div className="relative origin-top-left overflow-hidden border border-line bg-surface" style={{ width: w, height: h, transform: `scale(${k})` }}>
          <div className="flex h-10 items-center gap-2 border-b border-line px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="ml-4 font-mono text-[11px] text-muted">unspool.cc</span>
          </div>
          <Stage p={p} narrow={narrow} h={h} />
        </div>
      </div>
    </div>
  );
}

function useViewportWidth() {
  const [vw, setVw] = useState(390);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vw;
}
