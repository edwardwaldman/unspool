# Music + sound effects for the stick-figure story ad. A light, bouncy loop (soft at night, brighter once
# the chapter turns out to be reels), with a cartoon sound on every beat of the story. Mixes in voice.wav if present.
import json, os, sys, numpy as np, soundfile as sf
D = sys.argv[1]
tl = json.load(open(f"{D}/web/tl.json")); DUR = tl["dur"]; SR = 24000; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(3); tt = np.arange(N) / SR
st = {l["shot"]: l["s"] - 0.12 for l in tl["lines"]}; note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); b = min(N, a + len(x))
    if 0 <= a < N: out[a:b] += x[:b - a] * g
def tone(f, d, dec=5, h=(1, .5, .25)):
    t = np.arange(int(SR * d)) / SR; return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * np.exp(-t * dec)
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def sweep(f0, f1, d, dec=3): t = np.arange(int(SR * d)) / SR; f = f0 + (f1 - f0) * t / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)
def kick(): k = np.arange(int(SR * .2)) / SR; return np.sin(2 * np.pi * (50 + 90 * np.exp(-k * 30)) * k) * np.exp(-k * 12)
def whoosh(d=0.35): x = noise(d, 0.1) * np.sin(np.linspace(0, np.pi, int(SR * d))) ** 2; return np.convolve(x, np.ones(6) / 6, "same")
def thud(): return kick() * 1.2 + np.pad(noise(.15, 25), (0, int(SR * .05)))[:int(SR * .2)] * 0.3
B = 60 / 112; bright_at = st["itsit"]
night = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]; day = [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]]
for i in range(int(DUR / (B / 2))):
    t0 = i * B / 2; prog = day if t0 >= bright_at else night; ch = prog[(i // 8) % 4]; br = t0 >= bright_at
    if st["turn"] <= t0 < st["turn"] + 0.6 or st["itsit"] - 0.3 <= t0 < st["itsit"] + 0.2: continue   # drop-outs for the big moments
    m = ch[[0, 2, 1, 2][i % 4]] + (12 if br else 0)
    add(t0, tone(note(m), B / 2 * 0.95, 9, (1, .45, .2)), 0.07 if br else 0.05)           # plucky arpeggio
    if i % 4 == 0: add(t0, tone(note(ch[0] - 24), B * 1.9, 2.5, (1, .5)), 0.12)            # bass
    if br:
        if i % 4 == 0: add(t0, kick(), 0.35)
        if i % 4 == 2: add(t0, noise(.12, 26), 0.12)
        add(t0, noise(.02, 160), 0.035)
# --- the story's sounds ---
for k in range(14): add(st["book"] + 0.1 + k * 0.12, tone(note(84 + (k * 5) % 12), 0.3, 8, (1, .3)), 0.05)        # sparkles
add(st["turn"] - 0.25, whoosh(0.4), 0.3); add(st["turn"] + 0.02, sweep(200, 1400, 0.5, 2), 0.18); add(st["turn"] + 0.02, thud(), 0.5)   # FWOOMP
for k in range(12): add(st["alarm"] + 0.15 + k * 0.11, tone(2400, 0.07, 30, (1,)), 0.12)                            # alarm clock
add(st["open"] + 0.3, noise(0.25, 12), 0.08)                                                                       # page flip
add(st["panic"] + 0.05, sweep(900, 300, 0.6, 1.5), 0.2); add(st["panic"] + 0.05, thud(), 0.4)                       # panic
for k in range(3): add(st["memory"] + 0.4 + k * 0.45, sweep(220, 160, 0.18, 6), 0.25)                             # error buzzes
add(st["memory"] + 1.7, tone(180, 0.5, 4, (1, .8, .6)), 0.2)                                                       # 0 matches
for k in range(4): add(st["buzz"] + 0.05 + k * 0.32, np.sin(2 * np.pi * 150 * np.arange(int(SR * .2)) / SR) * np.sign(np.sin(2 * np.pi * 30 * np.arange(int(SR * .2)) / SR)), 0.12)   # phone buzz
for j, m in enumerate([76, 83, 88]): add(st["itsit"] + 0.2 + j * 0.06, tone(note(m), 0.8, 3, (1, .3)), 0.12)        # ding!
add(st["before"], whoosh(), 0.25)
for s in ("gimmick",): add(st[s] + 0.52, thud(), 0.5)                                                              # stamp
add(st["quiz"] + 1.2, thud(), 0.45); add(st["quiz"] + 1.25, tone(note(84), 0.5, 4, (1, .3)), 0.1)
for k in range(3): add(st["funny"] + 0.22 + k * 0.2, tone(note(72 + k * 4), 0.15, 12, (1, .3)), 0.12)               # HA HA HA pops
for k in range(3): add(st["couch"] + 0.6 + k * 1.0, tone(note(79), 0.12, 15, (1, .3)), 0.1)                         # chip pops
for j, m in enumerate([72, 76, 79, 84]): add(st["test"] + 0.3 + j * 0.08, tone(note(m), 0.9, 3, (1, .3)), 0.1)      # the A
for s in st:                                                                                                        # a soft swoosh on every cut
    if s not in ("hook", "turn"): add(st[s], whoosh(0.22), 0.1)
for j, m in enumerate([67, 72, 76, 79, 84]): add(st["end"] + 0.15 + j * 0.07, tone(note(m), 1.4, 2, (1, .3)), 0.1)  # end jingle
m = out * 0.9
if os.path.exists(f"{D}/voice.wav"):
    v, _ = sf.read(f"{D}/voice.wav"); vv = np.zeros(N); vv[:min(N, len(v))] = v[:N]; vv /= np.abs(vv).max() or 1
    env = np.convolve(np.abs(vv), np.ones(2400) / 2400, "same"); m = out * (1 - 0.6 * np.minimum(1, env / 0.08)) * 0.5 + vv * 1.3
m = np.tanh(m * 1.6) / np.tanh(1.6); m *= np.minimum(1, tt / 0.02) * np.minimum(1, (DUR - tt) / 0.6); m /= np.abs(m).max() / 0.79
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
