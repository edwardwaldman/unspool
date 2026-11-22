# A light, bouncy comedy bed (plucks + a tabla-ish hand-drum groove) ducked under the voice, with a hit on the
# slip, a sting on every "aiyo", key clicks, phone pings, a crowd-ish swell for the city, and a fanfare for the promotion.
import json, sys, numpy as np, soundfile as sf
D = sys.argv[1]; tl = json.load(open(f"{D}/web/tl.json")); DUR = tl["dur"]; SR = 24000; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(5); tt = np.arange(N) / SR
L = {l["shot"]: l for l in tl["lines"]}; note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]
    if a >= 0: out[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .4)): t = np.arange(int(SR * d)) / SR; return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t * dec)
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def drum(f0, f1, d=0.18, dec=16): t = np.arange(int(SR * d)) / SR; return np.sin(2 * np.pi * (f1 + (f0 - f1) * np.exp(-t * 30)) * t) * np.exp(-t * dec)
B = 60 / 118; scale = [62, 64, 66, 69, 71, 74]
for i in range(int((DUR - 1.6) / (B / 2))):
    t0 = i * B / 2
    if i % 2 == 0: add(t0, tone(note(scale[(i * 3) % 6] + 12), 0.2, 12, (1, .5, .2)), 0.035)
    add(t0, drum(180, 90) if i % 4 in (0, 3) else drum(420, 300, 0.1, 30), 0.09 if i % 4 in (0, 3) else 0.05)
    if i % 8 == 0: add(t0, tone(note(50), B * 3.5, 1.5, (1, .5)), 0.06)
for w in L["slipped"]["ws"][1:2]: add(w + 0.25, noise(0.04, 80), 0.4); add(w + 0.3, drum(90, 45, 0.5, 5), 0.5)                        # the slip
for sh in ["aiyo", "aiyo3"] + [k for k in L if k.startswith("whine")]:
    for w in L[sh]["ws"]: add(w, tone(note(55), 0.5, 4, (1, .6, .3)), 0.12); add(w, drum(140, 60, 0.4, 6), 0.3)                       # aiyo stings
for sh in ("msg", "watchwhat", "nextmorning"): add(L[sh]["s"] + 0.25, tone(note(88), 0.25, 10, (1, .3)), 0.12); add(L[sh]["s"] + 0.34, tone(note(93), 0.3, 10, (1, .3)), 0.1)  # pings
for k in range(14): add(L["mistake"]["s"] + 0.3 + k * 0.09, noise(0.02, 120), 0.12)                                                    # frantic typing
add(L["quiz"]["ws"][5], tone(note(84), 0.6, 4, (1, .3)), 0.12)                                                                         # full marks ding
c = np.convolve(rng.standard_normal(int(SR * 2.5)), np.ones(40) / 40, "same") * np.sin(np.linspace(0, np.pi, int(SR * 2.5))); add(L["city"]["s"], c, 0.3)   # the city
for j, m in enumerate([67, 72, 76, 79, 84]): add(L["promote"]["s"] + 0.3 + j * 0.09, tone(note(m), 0.9, 3, (1, .3)), 0.12)          # promotion
for sh in L:
    if sh not in ("omg",): add(L[sh]["s"] - 0.08, noise(0.12, 25) * np.linspace(1, 0, int(SR * 0.12)), 0.06)                          # a tick on each cut
for j, m in enumerate([74, 79, 83, 86]): add(DUR - 1.5 + j * 0.06, tone(note(m), 1.2, 2.5, (1, .3)), 0.1)                              # end card
v, _ = sf.read(f"{D}/voice.wav"); vv = np.zeros(N); vv[:min(N, len(v))] = v[:N]; vv /= np.abs(vv).max()
env = np.convolve(np.abs(vv), np.ones(2400) / 2400, "same"); m = out * (1 - 0.6 * np.minimum(1, env / 0.06)) * 0.55 + vv * 1.25
m = np.tanh(m * 1.5) / np.tanh(1.5); m *= np.minimum(1, tt / 0.02) * np.minimum(1, (DUR - tt) / 0.5); m /= np.abs(m).max() / 0.79
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
