"use client";

// Small synthesized sound effects under the voiceover (no files to load): a soft whoosh on every new beat, a
// bright chime for a right answer, a low thud for a wrong one. Quiet on purpose; they follow the reel's mute.

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Phones start it suspended until a tap; the reel's own tap-to-play unlocks it.
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx.state === "running" ? ctx : null;
}

/** A soft filtered-noise swish, rising then falling. */
export function whoosh(level = 0.05) {
  const a = audio();
  if (!a) return;
  const len = 0.32, n = Math.floor(a.sampleRate * len);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  const t = a.currentTime;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + len * 0.6);
  bp.frequency.exponentialRampToValueAtTime(1200, t + len);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + len * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t);
  src.stop(t + len);
}

function tone(freq: number, at: number, dur: number, level: number, type: OscillatorType = "sine") {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = a.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Right answer: a quick rising arpeggio. */
export function chime() {
  [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => tone(f, i * 0.07, 0.5, 0.06, "triangle"));
}

/** Wrong answer: a soft low double thud. */
export function thud() {
  tone(130.8, 0, 0.28, 0.12, "sine");
  tone(98, 0.12, 0.35, 0.1, "sine");
}
