"use client";

import { Heart, MessageCircle, MoreHorizontal, Music2, Send } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

type Reel = { id: string; index: number; hook: string; title: string };

const BASE_W = 184;
const ACCENTS = ["#d3f05a", "#ff8b6c", "#7fd3a6", "#f2d36b", "#9db8ff", "#e59cff"];
const loop = { repeat: Infinity, ease: "easeInOut" } as const;

/** An Instagram-style reel: tinted full-bleed scene with its own moving graphic, caption, action rail, account row. */
export function ReelMock({ r, width, height, liked = false }: { r: Reel; width: number; height: number; liked?: boolean }) {
  const s = width / BASE_W;
  const h = height / s;
  const v = (r.index - 1) % ACCENTS.length;
  const accent = ACCENTS[v];
  const [first, ...rest] = r.hook.split(" ");

  return (
    <div style={{ width, height, background: `color-mix(in srgb, ${accent} 16%, #08110e)` }} className="relative overflow-hidden">
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: BASE_W, height: h, transform: `scale(${s})` }}>
        {/* caption */}
        <div className="absolute inset-x-4 top-[13%] text-center font-hook text-[14px] font-extrabold leading-[1.2] text-white">
          <span className="rounded-[3px] px-1 text-[#08110e]" style={{ background: accent }}>
            {first}
          </span>{" "}
          {rest.join(" ")}
        </div>

        {/* moving graphic */}
        <div className="absolute inset-x-0 top-[44%] flex h-[34%] items-center justify-center">
          <Graphic v={v} accent={accent} />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        {/* action rail */}
        <div className="absolute bottom-14 right-2 flex flex-col items-center gap-2.5 text-white">
          <Rail icon={<Heart size={15} strokeWidth={2} fill={liked ? "#ff4d6d" : "none"} color={liked ? "#ff4d6d" : "currentColor"} />} n={`${(r.index * 3.7 + 1.2).toFixed(1)}K`} />
          <Rail icon={<MessageCircle size={15} strokeWidth={2} />} n={`${r.index * 41 + 12}`} />
          <Rail icon={<Send size={14} strokeWidth={2} />} n={`${r.index * 9 + 3}`} />
          <MoreHorizontal size={14} strokeWidth={2} />
        </div>

        {/* account + caption */}
        <div className="absolute bottom-3.5 left-3 right-10 text-white">
          <div className="flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full font-wordmark text-[9px] font-bold text-[#08110e]" style={{ background: accent }}>
              u
            </span>
            <span className="text-[10px] font-semibold">unspool</span>
            <span className="rounded-[4px] border border-white/60 px-1.5 py-[1px] text-[8px] font-semibold">Follow</span>
          </div>
          <div className="mt-1.5 truncate text-[9px] text-white/90">
            {r.title.toLowerCase()} · part {r.index}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[8px] text-white/70">
            <Music2 size={8} strokeWidth={2} /> Original audio · unspool
          </div>
        </div>

        {/* playback bar */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/20">
          <motion.div className="h-full bg-white" animate={{ width: ["0%", "100%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
        </div>
      </div>
    </div>
  );
}

function Graphic({ v, accent }: { v: number; accent: string }) {
  switch (v) {
    case 0:
      return <Crowd accent={accent} />;
    case 1:
      return <StatRing accent={accent} />;
    case 2:
      return <Bars accent={accent} />;
    case 3:
      return <Versus accent={accent} />;
    case 4:
      return <Wave accent={accent} />;
    default:
      return <Orbit accent={accent} />;
  }
}

/** A crowd where a random sample lights up in waves. */
function Crowd({ accent }: { accent: string }) {
  return (
    <div className="grid grid-cols-8 gap-[7px]">
      {Array.from({ length: 40 }, (_, k) => {
        const picked = (k * 7) % 9 === 0;
        return (
          <motion.span
            key={k}
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: picked ? accent : "rgba(255,255,255,.18)" }}
            animate={picked ? { scale: [1, 1.7, 1], opacity: [0.6, 1, 0.6] } : { opacity: [0.5, 0.8, 0.5] }}
            transition={{ ...loop, duration: 2, delay: (k % 8) * 0.12 }}
          />
        );
      })}
    </div>
  );
}

/** A ring that fills while the number counts up. */
function StatRing({ accent }: { accent: string }) {
  const p = useMotionValue(0);
  const label = useTransform(p, (x) => `${Math.round(x * 72)}%`);
  const arc = useTransform(p, (x) => x * 0.72);
  useEffect(() => {
    const c = animate(p, [0, 1, 1, 0], { duration: 4, times: [0, 0.5, 0.85, 1], repeat: Infinity, ease: "easeInOut" });
    return () => c.stop();
  }, [p]);
  return (
    <div className="relative h-[86px] w-[86px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r="42" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" style={{ pathLength: arc }} />
      </svg>
      <motion.span className="absolute inset-0 flex items-center justify-center font-mono text-[20px] font-bold text-white">{label}</motion.span>
    </div>
  );
}

/** A bar chart that keeps re-sorting itself. */
function Bars({ accent }: { accent: string }) {
  const sets = [
    [40, 75, 55, 90, 30],
    [85, 35, 70, 45, 60],
  ];
  return (
    <div className="flex h-[78px] items-end gap-[7px]">
      {sets[0].map((a, k) => (
        <motion.span
          key={k}
          className="w-[16px] rounded-t-[3px]"
          style={{ background: k === 3 ? accent : "rgba(255,255,255,.35)" }}
          animate={{ height: [`${a}%`, `${sets[1][k]}%`, `${a}%`] }}
          transition={{ ...loop, duration: 2.6, delay: k * 0.08 }}
        />
      ))}
    </div>
  );
}

/** Two sides squaring off. */
function Versus({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        className="flex h-[54px] w-[54px] items-center justify-center rounded-full font-hook text-[18px] font-extrabold text-[#08110e]"
        style={{ background: accent }}
        animate={{ x: [0, 8, 0], rotate: [0, -6, 0] }}
        transition={{ ...loop, duration: 1.4 }}
      >
        A
      </motion.span>
      <motion.span className="font-hook text-[13px] font-extrabold text-white" animate={{ scale: [1, 1.35, 1] }} transition={{ ...loop, duration: 1.4 }}>
        VS
      </motion.span>
      <motion.span
        className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-2 font-hook text-[18px] font-extrabold text-white"
        style={{ borderColor: accent }}
        animate={{ x: [0, -8, 0], rotate: [0, 6, 0] }}
        transition={{ ...loop, duration: 1.4 }}
      >
        B
      </motion.span>
    </div>
  );
}

/** A voice waveform. */
function Wave({ accent }: { accent: string }) {
  return (
    <div className="flex h-[70px] items-center gap-[4px]">
      {Array.from({ length: 16 }, (_, k) => (
        <motion.span
          key={k}
          className="w-[4px] rounded-full"
          style={{ background: k % 4 === 0 ? accent : "rgba(255,255,255,.55)" }}
          animate={{ height: [8, 18 + ((k * 13) % 44), 8] }}
          transition={{ ...loop, duration: 0.9 + (k % 3) * 0.2, delay: k * 0.05 }}
        />
      ))}
    </div>
  );
}

/** Ideas orbiting a core concept. */
function Orbit({ accent }: { accent: string }) {
  return (
    <div className="relative h-[90px] w-[90px]">
      <span className="absolute inset-0 rounded-full border border-white/15" />
      <span className="absolute inset-[22px] rounded-full border border-white/10" />
      <span className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: accent }} />
      {[0, 1, 2].map((k) => (
        <motion.div key={k} className="absolute inset-0" animate={{ rotate: [k * 120, k * 120 + 360] }} transition={{ duration: 3 + k, repeat: Infinity, ease: "linear" }}>
          <span className="absolute left-1/2 top-0 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </motion.div>
      ))}
    </div>
  );
}

function Rail({ icon, n }: { icon: React.ReactNode; n: string }) {
  return (
    <div className="flex flex-col items-center gap-[2px]">
      {icon}
      <span className="text-[7px] font-semibold">{n}</span>
    </div>
  );
}
