# Music + sound for the pause challenge: an upbeat loop, a whoosh as each thing flies past, a freeze "click"
# and a sting on each near miss, a big whoosh for the one that flies at you, and a win jingle.
import json, sys, numpy as np, soundfile as sf
D = sys.argv[1]; DUR = json.load(open(f"{D}/web/tl.json"))["dur"]; SR = 24000; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(4); tt = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); b = min(N, a + len(x))
    if 0 <= a < N: out[a:b] += x[:b - a] * g
def tone(f, d, dec=5, h=(1, .5, .25)): t = np.arange(int(SR * d)) / SR; return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t * dec)
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def kick(): k = np.arange(int(SR * .2)) / SR; return np.sin(2 * np.pi * (50 + 90 * np.exp(-k * 30)) * k) * np.exp(-k * 12)
def whoosh(d, up=True): x = noise(d, 0.1) * (np.linspace(0, 1, int(SR * d)) ** 2 if up else np.sin(np.linspace(0, np.pi, int(SR * d))) ** 2); return np.convolve(x, np.ones(5) / 5, "same")
B = 60 / 124; ch = [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]]
for i in range(int(8.3 / (B / 2))):
    t0 = i * B / 2; c = ch[(i // 8) % 4]
    add(t0, tone(note(c[[0, 1, 2, 1][i % 4]] + 12), B / 2, 9, (1, .4)), 0.06)
    if i % 4 == 0: add(t0, kick(), 0.4); add(t0, tone(note(c[0] - 24), B * 1.8, 3, (1, .5)), 0.12)
    if i % 4 == 2: add(t0, noise(.12, 26), 0.12)
    add(t0, noise(.02, 160), 0.03)
for tc in (1.5, 4.0, 6.5):
    add(tc - 0.7, whoosh(0.75), 0.22)                                     # flying in
    add(tc + 0.08, noise(0.04, 80), 0.3)                                   # the "pause" click
for tc in (1.5, 4.0):
    for j, m in enumerate([67, 63]): add(tc + 0.1 + j * 0.12, tone(note(m), 0.35, 6, (1, .4)), 0.12)   # so close (wah-wah)
add(4.35, whoosh(0.4), 0.4); add(4.72, kick(), 0.6); add(4.72, noise(0.3, 8), 0.25)                   # straight at you
for j, m in enumerate([72, 76, 79, 84, 88]): add(6.6 + j * 0.07, tone(note(m), 1.2, 2.5, (1, .3)), 0.12)  # you did it
for j, m in enumerate([67, 72, 76, 79]): add(8.35 + j * 0.06, tone(note(m), 1.2, 2, (1, .3)), 0.1)      # outro
m = np.tanh(out * 1.8) / np.tanh(1.8); m *= np.minimum(1, tt / 0.02) * np.minimum(1, (DUR - tt) / 0.5); m /= np.abs(m).max() / 0.79
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
