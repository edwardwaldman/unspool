# A seamless 2-second loop: 120 bpm (exactly 4 beats), a rising whoosh into the pass, a swoosh past the camera. Nothing rings past the loop point, so it loops cleanly.
import json, sys, numpy as np, soundfile as sf
D = sys.argv[1]; DUR = 2.0; SR = 24000; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(2)
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]; out[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .4)): t = np.arange(int(SR * d)) / SR; return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t * dec)
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def kick(): k = np.arange(int(SR * .18)) / SR; return np.sin(2 * np.pi * (50 + 90 * np.exp(-k * 30)) * k) * np.exp(-k * 14)
B = 0.5
for i in range(8):
    t0 = i * B / 2; ch = [60, 64, 67, 72] if i < 4 else [57, 60, 64, 69]
    add(t0, tone(note(ch[i % 4] + 12), 0.24, 14), 0.07)
    if i % 2 == 0: add(t0, kick(), 0.45); add(t0, tone(note(ch[0] - 24), 0.45, 6, (1, .5)), 0.12)
    if i % 2 == 1: add(t0, noise(.1, 30), 0.1)
    add(t0, noise(.02, 160), 0.03)
r = np.linspace(0, 1, int(SR * 0.7)); add(0.3, np.convolve(rng.standard_normal(len(r)) * r ** 3, np.ones(5) / 5, "same"), 0.25)   # incoming
w = np.sin(np.linspace(0, np.pi, int(SR * 0.3))) ** 2; add(1.0, np.convolve(rng.standard_normal(len(w)) * w, np.ones(4) / 4, "same"), 0.4)  # past you
m = np.tanh(out * 1.7) / np.tanh(1.7); m /= np.abs(m).max() / 0.79
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
