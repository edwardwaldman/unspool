"use client";

// The soft background bed under every reel (public/music/bed.mp3, made for Unspool). One shared, gapless loop
// for the whole page: it keeps going as you swipe between reels instead of restarting, sits well under the
// voiceover, and fades in and out with play, pause and mute.

const SRC = "/music/bed.mp3";
const LEVEL = 0.1;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let loading: Promise<AudioBuffer | null> | null = null;
const wants = new Set<string>();

function load() {
  if (!ctx) return Promise.resolve(null);
  loading ??= fetch(SRC)
    .then((r) => r.arrayBuffer())
    .then((b) => ctx!.decodeAudioData(b))
    .catch(() => null);
  return loading;
}

async function update() {
  const on = wants.size > 0;
  if (!on && !ctx) return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
  }
  const now = ctx.currentTime;
  gain!.gain.cancelScheduledValues(now);
  gain!.gain.setValueAtTime(gain!.gain.value, now);
  if (!on) {
    gain!.gain.linearRampToValueAtTime(0, now + 0.4);
    return;
  }
  if (ctx.state === "suspended") await ctx.resume().catch(() => undefined);
  if (!source) {
    const buf = await load();
    if (!buf || !ctx || source || wants.size === 0) return;
    source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.connect(gain!);
    source.start();
  }
  gain!.gain.linearRampToValueAtTime(LEVEL, ctx.currentTime + 0.8);
}

/** A reel asks for the music (playing, with sound on) or lets it go. Plays while anyone wants it. */
export function setMusic(id: string, on: boolean) {
  if (on === wants.has(id)) return;
  if (on) wants.add(id);
  else wants.delete(id);
  void update();
}
