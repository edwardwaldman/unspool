"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "../analytics/track";

// "Catch the key ideas": the loading screen's mini game. A spool follows your finger along the bottom; key ideas
// fall as lime pills and wind onto it, while "scroll" distractions fall too: catch three of those and it's over.
// It speeds up as the score climbs. Not a quiz, just something to do while the reels are made.

const GOOD = ["key idea", "fact", "date", "formula", "cause", "effect", "term", "name", "rule", "example"];
const BAD = "📱 scroll";
const H = 250;
const SPOOL_W = 64;
const BEST_KEY = "unspool:game-best";

type Drop = { id: number; x: number; y: number; good: boolean; word: string; v: number };

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function ThreadGame() {
  const area = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"idle" | "play" | "over">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(() => (typeof window === "undefined" ? 0 : readBest()));
  const [drops, setDrops] = useState<Drop[]>([]);
  const [spoolX, setSpoolX] = useState(0.5);
  const [pop, setPop] = useState<{ id: number; x: number; good: boolean } | null>(null);
  const s = useRef({ score: 0, lives: 3, drops: [] as Drop[], x: 0.5, next: 0, id: 0, last: 0, started: 0, width: 300 });

  const start = () => {
    const w = area.current?.clientWidth ?? 300;
    Object.assign(s.current, { score: 0, lives: 3, drops: [], next: 0, last: 0, started: Date.now(), width: w });
    setScore(0);
    setLives(3);
    setDrops([]);
    setMode("play");
    track("game_start");
  };

  // Finger / mouse moves the spool.
  const move = (clientX: number) => {
    const r = area.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    s.current.x = x;
    setSpoolX(x);
  };

  useEffect(() => {
    if (mode !== "play") return;
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const st = s.current;
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0;
      st.last = now;
      const speed = 1 + st.score * 0.06;
      // spawn
      st.next -= dt;
      if (st.next <= 0) {
        const good = Math.random() > 0.28;
        st.drops.push({ id: ++st.id, x: 0.08 + Math.random() * 0.84, y: -24, good, word: good ? GOOD[Math.floor(Math.random() * GOOD.length)] : BAD, v: (70 + Math.random() * 40) * speed });
        st.next = Math.max(0.35, 1.0 - st.score * 0.02);
      }
      // fall + catch
      const half = SPOOL_W / 2 / st.width;
      const kept: Drop[] = [];
      for (const d of st.drops) {
        d.y += d.v * dt;
        if (d.y > H - 58 && d.y < H - 22 && Math.abs(d.x - st.x) < half + 0.06) {
          if (d.good) {
            st.score += 1;
            setScore(st.score);
          } else {
            st.lives -= 1;
            setLives(st.lives);
          }
          setPop({ id: d.id, x: d.x, good: d.good });
          continue;
        }
        if (d.y < H + 10) kept.push(d);
      }
      st.drops = kept;
      setDrops([...kept]);
      if (st.lives <= 0) {
        cancelAnimationFrame(raf);
        const secs = Math.round((Date.now() - st.started) / 1000);
        track("game_over", `${st.score} pts, ${secs}s`);
        const b = Math.max(readBest(), st.score);
        try {
          localStorage.setItem(BEST_KEY, String(b));
        } catch {}
        setBest(b);
        setMode("over");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // A game left half-played (the reel arrived, or they left): still counts.
  useEffect(
    () => () => {
      const st = s.current;
      if (st.started && st.lives > 0 && st.last) track("game_over", `${st.score} pts, ${Math.round((Date.now() - st.started) / 1000)}s, unfinished`);
    },
    [],
  );

  const thread = Math.min(18, 4 + score * 0.7);
  return (
    <div
      ref={area}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (mode !== "play") start();
        move(e.clientX);
      }}
      onPointerMove={(e) => mode === "play" && move(e.clientX)}
      onClick={(e) => e.stopPropagation()}
      className="relative mt-6 touch-none select-none overflow-hidden rounded-[18px] border border-white/10 bg-black/25"
      style={{ height: H }}
      data-testid="thread-game"
    >
      {/* score */}
      <div className="absolute left-3 top-2.5 font-mono text-[13px] text-white/80">
        {mode === "play" ? `${score} wound` : best ? `best ${best}` : ""}
      </div>
      {mode === "play" && <div className="absolute right-3 top-2 text-[13px] tracking-[2px]">{"●".repeat(lives)}<span className="text-white/25">{"●".repeat(3 - lives)}</span></div>}

      {/* falling ideas */}
      {drops.map((d) => (
        <span
          key={d.id}
          className={`absolute -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${d.good ? "bg-thread text-[#0f1d18]" : "bg-white/15 text-white/80"}`}
          style={{ left: `${d.x * 100}%`, top: d.y }}
        >
          {d.word}
        </span>
      ))}

      {/* +1 / ouch */}
      {pop && mode === "play" && (
        <span key={pop.id} className="pointer-events-none absolute -translate-x-1/2 animate-[ping_0.6s_ease-out_1] font-mono text-[14px] font-bold" style={{ left: `${pop.x * 100}%`, top: H - 92, color: pop.good ? "var(--thread)" : "#ff6b6b" }}>
          {pop.good ? "+1" : "✕"}
        </span>
      )}

      {/* the spool: the thread on it thickens as you catch ideas */}
      <div className="absolute bottom-3 -translate-x-1/2 transition-[left] duration-75" style={{ left: `${spoolX * 100}%`, width: SPOOL_W }}>
        <div className="mx-auto h-[6px] w-full rounded-full bg-[#c9b48a]" />
        <div className="mx-auto rounded-[4px] bg-thread" style={{ width: SPOOL_W - 18, height: thread, transition: "height .2s" }} />
        <div className="mx-auto h-[6px] w-full rounded-full bg-[#c9b48a]" />
      </div>

      {/* start / game over */}
      {mode !== "play" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-center">
          {mode === "over" ? (
            <>
              <div className="font-display text-[24px] leading-tight text-white">You wound {score} ideas</div>
              <div className="mt-1 text-[13px] text-white/70">{score >= best && score > 0 ? "New best!" : `Best: ${best}`}</div>
            </>
          ) : (
            <>
              <div className="font-display text-[22px] leading-tight text-white">Catch the key ideas</div>
              <div className="mt-1 max-w-[240px] text-[13px] text-white/70">Slide the spool to wind them in. Dodge the scrolling.</div>
            </>
          )}
          <div className="mt-3 rounded-full bg-thread px-4 py-1.5 text-[14px] font-semibold text-[#0f1d18]">{mode === "over" ? "Play again" : "Tap to play"}</div>
        </div>
      )}
    </div>
  );
}
