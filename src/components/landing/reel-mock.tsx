import { Camera, Heart, MessageCircle, MoreHorizontal, Music2, Send } from "lucide-react";

type Reel = { id: string; index: number; hook: string; title: string };

const BASE_W = 184;

/** An Instagram-style reel screen: top bar, full-bleed visual, big caption, action rail, account row. */
export function ReelMock({ r, width, height, liked = false }: { r: Reel; width: number; height: number; liked?: boolean }) {
  const s = width / BASE_W;
  const h = height / s;
  return (
    <div style={{ width, height }} className="relative overflow-hidden bg-[#0a1411]">
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: BASE_W, height: h, transform: `scale(${s})` }}>
        {/* full-bleed "video": a drifting dot field */}
        <div className="absolute inset-0 grid grid-cols-10 content-center justify-items-center gap-y-[11px] px-3 opacity-80">
          {Array.from({ length: 90 }, (_, k) => (
            <span
              key={k}
              className="h-[4px] w-[4px] rounded-full"
              style={{ background: (k * 7 + r.index * 3) % 6 === 0 ? "var(--thread)" : "color-mix(in srgb, var(--ink) 14%, transparent)" }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 to-transparent" />

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-2.5 text-white">
          <span className="text-[12px] font-bold">Reels</span>
          <Camera size={13} strokeWidth={2} />
        </div>

        {/* burned-in caption */}
        <div className="absolute inset-x-4 top-[30%] text-center font-hook text-[15px] font-extrabold leading-[1.15] text-white [text-shadow:0_1px_6px_rgba(0,0,0,.6)]">
          {r.hook}
        </div>

        {/* action rail */}
        <div className="absolute bottom-12 right-2 flex flex-col items-center gap-2.5 text-white">
          <Rail icon={<Heart size={16} strokeWidth={2} fill={liked ? "var(--coral)" : "none"} color={liked ? "var(--coral)" : "currentColor"} />} n={`${(r.index * 3.7 + 1.2).toFixed(1)}K`} />
          <Rail icon={<MessageCircle size={16} strokeWidth={2} />} n={`${r.index * 41 + 12}`} />
          <Rail icon={<Send size={15} strokeWidth={2} />} n={`${r.index * 9 + 3}`} />
          <MoreHorizontal size={15} strokeWidth={2} />
        </div>

        {/* account + caption */}
        <div className="absolute bottom-3 left-3 right-10 text-white">
          <div className="flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-thread font-wordmark text-[9px] font-bold text-paper">u</span>
            <span className="text-[10px] font-semibold">unspool</span>
            <span className="rounded-[4px] border border-white/70 px-1.5 py-[1px] text-[8px] font-semibold">Follow</span>
          </div>
          <div className="mt-1.5 truncate text-[9px] text-white/90">
            {r.title.toLowerCase()} · part {r.index}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[8px] text-white/75">
            <Music2 size={8} strokeWidth={2} /> Original audio · unspool
          </div>
        </div>

        {/* playback bar */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/20">
          <div className="h-full w-2/5 bg-white" />
        </div>
      </div>
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
