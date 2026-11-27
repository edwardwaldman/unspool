# Original tense bed for "The Essay" (choose-your-path story ad): D minor drone, a ticking clock pulse, a low heartbeat,
# sub hits + reverse swells on each twist, a brighter lift when Unspool appears, a held suspense chord on the choice,
# and a light chime on the end sign. The voice sits on top; the bed ducks under it.
import sys, numpy as np, soundfile as sf, subprocess, json
D = sys.argv[1]; SR = 44100; DUR = 19.9; N = int(SR * DUR); bed = np.zeros(N); rng = np.random.default_rng(7); tt = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(buf, t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]
    if a >= 0: buf[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .5, .25), att=0.005):
    t = np.arange(int(SR * d)) / SR; env = np.minimum(1, t / att) * np.exp(-t * dec)
    return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * env
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
def sub(d=1.2): t = np.arange(int(SR * d)) / SR; return np.sin(2 * np.pi * (38 + 70 * np.exp(-t * 14)) * t) * np.exp(-t * 2.6)
def swell(d=0.6): t = np.arange(int(SR * d)) / SR; return lp(rng.standard_normal(len(t)), 8) * (t / d) ** 2.5
# drone: D minor (D2 + A2 + F3), slowly beating
for f, g in ((note(38), .16), (note(45), .08), (note(53), .05), (note(38) * 1.003, .1)):
    bed += np.sin(2 * np.pi * f * tt) * g * (0.8 + 0.2 * np.sin(tt * 0.7))
# clock tick on eighths at 120 BPM, heartbeat on beats 1 and 1-and
for i in range(int(DUR / 0.25)):
    t0 = i * 0.25
    if t0 > 18.7: break
    add(bed, t0, lp(noise(0.03, 120), 1) * (1 if i % 2 == 0 else .6), 0.05)
    if i % 4 == 0: add(bed, t0, sub(0.3), 0.22); add(bed, t0 + 0.18, sub(0.25), 0.13)
# twists: reverse swell into a sub hit + low cluster
for t in (1.94, 4.68, 5.62, 6.72, 7.88, 8.86, 15.81, 16.45):
    add(bed, t - 0.6, swell(0.6), 0.16); add(bed, t, sub(1.4), 0.75); add(bed, t, lp(noise(1.2, 3), 4), 0.12)
    for m in (38, 39, 45): add(bed, t, tone(note(m + 12), 1.6, 1.4, (1, .4)), 0.05)
# Unspool moment: a brighter lift (D major arpeggio, plucked) from 11.43 to 13.2
for i, m in enumerate([62, 66, 69, 74, 69, 66, 69, 74, 78, 74, 69, 74]):
    add(bed, 13.02 + i * 0.12, tone(note(m), 0.4, 7, (1, .5, .2)), 0.07)
add(bed, 13.02, tone(note(50), 1.8, 1, (1, .4, .2), 0.2), 0.12)
# the choice: held suspense chord swelling, then cut to silence on the end sign
t = np.arange(int(SR * 2.25)) / SR; env = (t / 2.25) ** 1.5
for m in (50, 53, 56, 62): add(bed, 16.45, np.sin(2 * np.pi * note(m) * t) * env, 0.05)
add(bed, 18.7, tone(note(86), 1.1, 3, (1, .3)), 0.12); add(bed, 18.7, tone(note(81), 1.1, 3, (1, .3)), 0.08); add(bed, 18.7, sub(0.8), 0.4)
# voice + ducking
vw, vsr = sf.read(f"{D}/vo.wav"); vw = vw if vw.ndim == 1 else vw.mean(1); assert vsr == SR
vo = np.zeros(N); vo[:min(N, len(vw))] = vw[:N]
envv = lp(np.abs(vo), 2205); duck = 1 - 0.45 * np.clip(envv / (envv.max() * 0.3), 0, 1)
m = np.tanh(bed * 1.3) / np.tanh(1.3) * duck * 0.55 + vo * 1.0
m *= np.minimum(1, tt / 0.01) * np.minimum(1, (DUR - tt) / 0.3); m /= np.abs(m).max() / 0.9
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok", len(vw) / SR)
