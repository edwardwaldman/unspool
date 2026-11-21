# 120 bpm, no voice: a filtered, tense intro under the hook, a riser and a hard drop at 2.0 s, a whoosh on every reel
# swipe, a tap + ding on the quiz, a win sting on the A. Also writes mix-silent.wav (for adding a trending sound in-app).
import sys, numpy as np, soundfile as sf
D = sys.argv[1]; DUR = 11.0; SR = 24000; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(9); tt = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]; out[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .4)): t = np.arange(int(SR * d)) / SR; return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t * dec)
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def kick(): k = np.arange(int(SR * .22)) / SR; return np.tanh(2.5 * np.sin(2 * np.pi * (48 + 110 * np.exp(-k * 30)) * k) * np.exp(-k * 10))
def whoosh(d): w = np.sin(np.linspace(0, np.pi, int(SR * d))) ** 2; return np.convolve(rng.standard_normal(len(w)) * w, np.ones(4) / 4, "same")
B = 0.5; prog = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]
for i in range(int(DUR / (B / 2))):
    t0 = i * B / 2; ch = prog[(i // 8) % 4]
    if t0 < 2.0:   # intro: soft plucks only
        add(t0, tone(note(ch[i % 3] + 12), 0.22, 14, (1, .2)), 0.04); continue
    if 10.6 < t0: continue
    add(t0, tone(note(ch[[0, 2, 1, 2][i % 4]] + 12), 0.24, 12, (1, .4)), 0.06)
    if i % 2 == 0: add(t0, kick(), 0.5); add(t0, np.tanh(2 * tone(note(ch[0] - 24), 0.45, 5, (1, .6))), 0.15)
    if i % 4 == 2: add(t0, noise(.14, 24), 0.18)
    add(t0, noise(.02, 160), 0.035 if i % 2 else 0.05)
r = np.linspace(0, 1, int(SR * 0.6)); add(1.4, np.convolve(rng.standard_normal(len(r)) * r ** 3, np.ones(5) / 5, "same"), 0.22)   # riser
add(2.0, kick(), 0.8); add(2.0, noise(0.5, 5), 0.2)                                                  # the drop
for k in range(4): add(4.2 + k * 1.0, whoosh(0.22), 0.16)                                            # swipes
add(8.0, noise(0.03, 90), 0.3); add(8.05, tone(note(88), 0.6, 5, (1, .3)), 0.12)                     # tap + ding
for j, m in enumerate([72, 76, 79, 84]): add(9.0 + j * 0.07, tone(note(m), 1.0, 3, (1, .3)), 0.1)    # the A
m = np.tanh(out * 1.8) / np.tanh(1.8); m *= np.minimum(1, tt / 0.02) * np.minimum(1, (DUR - tt) / 0.4); m /= np.abs(m).max() / 0.79
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); sf.write(f"{D}/mix-silent.wav", np.zeros(N, np.float32), SR); print("ok")
