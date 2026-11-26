# Uranus ad mix: VO on top, a slow space pad, an impact on "hit", a whoosh as Voyager passes, a chime on unspool.cc.
import sys, numpy as np, soundfile as sf
D = sys.argv[1]; SR = 44100; DUR = 38.0; N = int(SR * DUR); t = np.arange(N) / SR; rng = np.random.default_rng(3)
vo, sr = sf.read(f"{D}/vo.wav"); vo = vo if vo.ndim == 1 else vo.mean(1); assert sr == SR
v = np.zeros(N); v[:min(N, len(vo))] = vo[:N]
note = lambda m: 440 * 2 ** ((m - 69) / 12)
bed = np.zeros(N)
for i, ch in enumerate([[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 60]] * 3):
    a = int(i * 3.2 * SR); L = int(3.6 * SR); a2 = min(N, a + L)
    if a >= N: break
    tt = np.arange(a2 - a) / SR; env = np.minimum(1, tt / 0.8) * np.minimum(1, (L / SR - tt) / 0.8)
    for m in ch: bed[a:a2] += np.sin(2 * np.pi * note(m) * tt) * env * 0.05 + np.sin(2 * np.pi * note(m) * 2.003 * tt) * env * 0.012
def add(t0, x, gain):
    a = int(t0 * SR); x = x[:max(0, N - a)]; bed[a:a + len(x)] += x * gain
# impact on "hit" (18.24) and a whoosh for Voyager (27..32)
tt = np.arange(int(1.2 * SR)) / SR
add(18.2, np.sin(2 * np.pi * (45 + 60 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3.5) + rng.standard_normal(len(tt)) * np.exp(-tt * 9) * 0.3, 0.55)
L = int(3.0 * SR); tt = np.arange(L) / SR; wn = np.convolve(rng.standard_normal(L), np.ones(60) / 60, "same"); add(28.0, wn * np.sin(np.pi * tt / 3.0) ** 2 * 3, 0.18)
for k, m in enumerate([76, 79, 84]): tt = np.arange(int(1.5 * SR)) / SR; add(35.5 + k * 0.09, np.sin(2 * np.pi * note(m) * tt) * np.exp(-tt * 3), 0.12)
env = np.convolve(np.abs(v), np.ones(2205) / 2205, "same"); duck = 1 - 0.45 * np.clip(env / (env.max() * 0.3), 0, 1)
m = bed * duck * 0.8 + v; m *= np.minimum(1, t / 0.02) * np.minimum(1, (DUR - t) / 0.6); m /= np.abs(m).max() / 0.9
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
