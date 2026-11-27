# Original tense bed for "The Text · Part 2" (long cut): D minor drone, a low heartbeat that speeds up, sub hits on each twist
# (the window, the hands, her text, the notes, the final), a brighter lift on "Unspool", a held suspense chord on the
# choice and a chime on the sign. Voice on top, bed ducks under it, loudness-normalised to -14 LUFS.
import sys, subprocess, numpy as np, soundfile as sf
D = sys.argv[1]; SR = 44100; DUR = 48.8; N = int(SR * DUR); bed = np.zeros(N); rng = np.random.default_rng(11); T = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]; bed[a:a + len(x)] += x * g
def tone(f, d, dec=1.5, h=(1, .3, .1), att=0.02):
    t = np.arange(int(SR * d)) / SR; env = np.minimum(1, t / att) * np.exp(-t * dec); return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * env
# drone (D minor), darker until Unspool, brighter after
for m, g in [(38, .05), (45, .035), (50, .025)]: bed += np.sin(2 * np.pi * note(m) * T) * g * (0.6 + 0.4 * np.sin(T * 0.7))
lift = np.clip((T - 38.1) / 0.6, 0, 1) * np.clip((43.7 - T) / 0.5, 0, 1)
for m in [62, 65, 69]: bed += np.sin(2 * np.pi * note(m) * T) * 0.03 * lift
# heartbeat: 70 bpm, 100 bpm from the hands, quiet during Unspool, back for the choice
t = 0.3
while t < 46.6:
    bpm = 84 if t < 2.5 else 100 if t < 11.1 else 124 if t < 15.4 else 60 if t < 19.4 else 112 if t < 34.5 else 80 if t < 43.7 else 120
    if not (30.0 > 99 or 34.6 < t < 41.26 or 15.6 < t < 17.4):
        for o, g in [(0, .5), (0.16, .3)]:
            tt = np.arange(int(0.25 * SR)) / SR; add(t + o, np.sin(2 * np.pi * (55 + 30 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 18), g * 0.5)
    t += 60 / bpm
# sub hits + reverse swells on the twists
for th in [2.53, 4.24, 5.31, 6.66, 9.93, 13.63, 14.69, 17.5, 21.1, 24.93, 27.72, 30.13, 31.61, 33.2]:
    L = int(0.6 * SR); sw = rng.standard_normal(L); sw = np.convolve(sw, np.ones(40) / 40, "same") * np.linspace(0, 1, L) ** 2; add(th - 0.6, sw, 0.12)
    tt = np.arange(int(1.0 * SR)) / SR; add(th, np.sin(2 * np.pi * (40 + 50 * np.exp(-tt * 10)) * tt) * np.exp(-tt * 4), 0.45)
# Unspool lift: a quick bright arpeggio
for k, m in enumerate([74, 77, 81, 86]): add(38.24 + k * 0.11, tone(note(m), 0.8, 4, (1, .4)), 0.06)
# suspense chord on the choice, cut on the sign; chime
for m in [50, 53, 56, 60]: add(43.73, tone(note(m), 3.0, 0.4, (1, .5, .25), 0.4), 0.05)
for k, m in enumerate([76, 79, 84]): add(46.76 + k * 0.08, tone(note(m), 1.5, 3), 0.1)
tt = np.arange(int(0.12 * SR)) / SR; add(35.76, rng.standard_normal(len(tt)) * np.exp(-tt * 60), 0.35); add(35.81, rng.standard_normal(len(tt)) * np.exp(-tt * 45), 0.25)  # camera shutter
vo, sr = sf.read(f"{D}/vo.wav"); vo = vo if vo.ndim == 1 else vo.mean(1); v = np.zeros(N); v[:min(N, len(vo))] = vo[:N]
env = np.convolve(np.abs(v), np.ones(2205) / 2205, "same"); duck = 1 - 0.5 * np.clip(env / (env.max() * 0.3), 0, 1)
m = np.tanh(bed * 1.3) / np.tanh(1.3) * duck * 0.5 + v; m *= np.minimum(1, T / 0.01) * np.minimum(1, (DUR - T) / 0.4); m /= np.abs(m).max() / 0.9
sf.write(f"{D}/pre.wav", m.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/pre.wav", "-af", "loudnorm=I=-14:TP=-1:LRA=11", "-ar", "44100", f"{D}/mix.wav"], check=True); print("ok")
