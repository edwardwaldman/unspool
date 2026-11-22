# A quirky D-minor groove at the reference video's tempo (77 BPM, double-time feel) with a held bassline and a plucked lead, ducked under the deadpan voice. It plays
# full in the party shots and muffled (low-passed, quieter) when we are inside with him, like music through a window.
# Every "HUSS!" gets a paper whoosh + a table thump; folds get a crinkle; the clock ticks; a ding for the quiz;
# a crowd swell when the town walks in; a sting on "Almost"; an end-card chime.
import json, sys, numpy as np, soundfile as sf
D = sys.argv[1]; tl = json.load(open(f"{D}/web/tl.json")); DUR = tl["dur"]
v, SR = sf.read(f"{D}/voice.wav"); v = v if v.ndim == 1 else v.mean(1)
N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(7); tt = np.arange(N) / SR
lines = tl["lines"]; note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(buf, t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]
    if a >= 0: buf[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .4)): t = np.arange(int(SR * d)) / SR; return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t * dec)
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def drum(f0, f1, d=0.2, dec=14): t = np.arange(int(SR * d)) / SR; return np.sin(2 * np.pi * (f1 + (f0 - f1) * np.exp(-t * 30)) * t) * np.exp(-t * dec)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
music = np.zeros(N); B = 60 / 77   # the reference track's tempo (about 77 BPM) and key (D minor), measured from its audio
prog = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]]   # Dm  Bb  C  A
mel = [74, 72, 69, 72, 74, 77, 76, 74, 70, 69, 67, 69, 72, 69, 73, 76]
for bar in range(int(DUR / (B * 4)) + 1):
    t0 = bar * B * 4; ch = prog[bar % 4]
    add(music, t0, tone(note(ch[0] - 12), B * 4, 0.6, (1, .35, .1)), 0.22)                 # held low bass, a bar at a time
    for q in range(8):                                                                       # double-time groove (154)
        tq = t0 + q * B / 2
        if q in (0, 3, 4): add(music, tq, drum(140, 48, 0.32, 9), 0.45)
        if q in (2, 6): add(music, tq, noise(0.14, 22), 0.12); add(music, tq, drum(240, 160, 0.12, 22), 0.12)
        add(music, tq + B / 4, noise(0.03, 90), 0.05)
        if q % 2 == 0: [add(music, tq, tone(note(m + 12), 0.18, 14, (1, .6, .25)), 0.03) for m in ch]
    for k in range(4): add(music, t0 + k * B, tone(note(mel[(bar * 4 + k) % 16]), 0.32, 9, (1, .5, .3, .15)), 0.06)   # plucked lead
PARTY = {"town", "anything", "birthday", "tuesday", "rock", "outthere", "shift", "midnight"}
gain = np.full(N, 0.5); inside = np.ones(N, bool)
for l in lines:
    if l["shot"] in PARTY:
        a, b = int((l["s"] - 0.08) * SR), int((l["e"] + 0.3) * SR); gain[a:b] = 1.0; inside[a:b] = False
gain = lp(gain, int(SR * 0.08)); muffled = lp(music, 24)
music = np.where(inside, muffled * 1.6, music) * gain
for l in lines:
    if "HUSS" in l["text"]:
        for w in l["ws"]: add(out, w - 0.06, lp(noise(0.18, 14), 6), 0.35); add(out, w + 0.08, drum(110, 45, 0.3, 10), 0.8); add(out, w + 0.08, noise(0.04, 90), 0.25)
    if l["shot"] in ("fold", "fold2", "breakfast"):
        for w in l["ws"]: add(out, w, lp(noise(0.25, 10), 3) * (1 + 0.5 * np.sin(np.arange(int(SR * 0.25)) * 0.02)), 0.12)
    if l["shot"] in ("foursec", "train", "fold2"):
        for k in range(int((l["e"] - l["s"]) / 0.25)): add(out, l["s"] + k * 0.25, noise(0.015, 200), 0.18)
    if l["shot"] == "unspool": add(out, l["ws"][7], tone(note(88), 0.25, 10, (1, .3)), 0.15); add(out, l["ws"][-1], tone(note(84), 0.6, 4, (1, .3)), 0.15)
    if l["shot"] == "almost": add(out, l["s"], tone(note(50), 1.4, 1.5, (1, .5, .3)), 0.18); add(out, l["s"] + 0.25, tone(note(49), 1.2, 1.5, (1, .5)), 0.15)
    if l["shot"] == "midnight": c = lp(rng.standard_normal(int(SR * 3)), 30) * np.sin(np.linspace(0, np.pi, int(SR * 3))); add(out, l["s"], c, 0.5)
    if l["shot"] == "already": add(out, l["s"], tone(note(79), 0.5, 5, (1, .3)), 0.12)
for j, m in enumerate([72, 76, 79, 84]): add(out, DUR - 1.5 + j * 0.06, tone(note(m), 1.2, 2.5, (1, .3)), 0.12)
vv = np.zeros(N); vv[:min(N, len(v))] = v[:N]; vv /= np.abs(vv).max()
env = lp(np.abs(vv), int(SR * 0.1)); bed = music * (1 - 0.55 * np.minimum(1, env / 0.05)) * 0.5 + out * 0.6
m = bed + vv * 1.25; m = np.tanh(m * 1.4) / np.tanh(1.4); m *= np.minimum(1, tt / 0.02) * np.minimum(1, (DUR - tt) / 0.5); m /= np.abs(m).max() / 0.79
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
