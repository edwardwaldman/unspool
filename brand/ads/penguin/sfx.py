import sys, numpy as np, soundfile as sf
S = sys.argv[1]; SR = 44100
SHOTS = [("intro",1.8),("read1",2.1),("wake",0.8),("friends",1.7),("teacher",1.4),("read2",1.9),("sweat",1.0),("teacher2",0.9),("nudge",1.6),("upload",2.3),("scroll",2.4),("test",1.8),("victory",2.0),("end",2.6)]
st = {}; acc = 0
for n, d in SHOTS: st[n] = (acc, acc + d); acc += d
DUR = acc; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(7)
def add(t0, x, g=1.0):
    a = int(t0 * SR); b = min(N, a + len(x)); 
    if a < N: out[a:b] += x[: b - a] * g
def mixs(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[: len(x)] += x
    return o
def tone(f, d, decay=6, shape="sine"):
    t = np.arange(int(SR * d)) / SR; w = np.sin(2 * np.pi * f * t) if shape == "sine" else np.sign(np.sin(2 * np.pi * f * t)) * 0.5
    return w * np.exp(-t * decay)
def sweep(f0, f1, d, decay=3):
    t = np.arange(int(SR * d)) / SR; f = np.linspace(f0, f1, len(t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay)
def noise(d, lo=0, decay=8, smooth=1):
    x = rng.standard_normal(int(SR * d)); 
    if smooth > 1: x = np.convolve(x, np.ones(smooth) / smooth, "same")
    t = np.arange(len(x)) / SR; return x * np.exp(-t * decay)
note = lambda m: 440 * 2 ** ((m - 69) / 12)
# playful plucky bed (bouncy bass + marimba arpeggio), ducked under the panic, bright at the end
beat = 0.32
prog = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
for i in range(int(DUR / beat)):
    t0 = i * beat; ch = prog[(i // 8) % 4]
    add(t0, tone(note(ch[0] - 24), 0.3, 9), 0.22 if i % 2 == 0 else 0.0)
    add(t0, mixs(tone(note(ch[i % 3] + 12), 0.25, 14), 0.3 * tone(note(ch[i % 3] + 24), 0.2, 18)), 0.07)
# panic section: low tense pulse
for k in range(int((st["teacher2"][1] - st["read1"][0]) / 0.5)):
    add(st["read1"][0] + k * 0.5, tone(55, 0.4, 5), 0.18)
# sound effects
s0, s1 = st["read1"]; 
for k in range(3): add(s0 + 0.9 + k * 0.45, noise(0.4, decay=4, smooth=40), 0.12)  # snore
add(st["wake"][0], sweep(300, 1200, 0.35, 5), 0.35)   # boing
add(st["friends"][0] + 0.4, tone(1318, 0.5, 6) + tone(1760, 0.5, 6), 0.18); add(st["friends"][0] + 0.9, tone(1568, 0.5, 6), 0.15)
for k in range(5): add(st["teacher"][0] + k * 0.28, tone(2400, 0.05, 60), 0.25)   # clock ticks
r0, _ = st["read2"]
for k in range(8): add(r0 + k * 0.22, noise(0.12, decay=25, smooth=6), 0.25)   # page flips
add(r0 + 0.1, tone(140, 0.45, 4, "square"), 0.18)   # error buzz
add(st["sweat"][0] + 0.2, sweep(500, 220, 0.3, 6), 0.25)   # gulp
for k in range(6): add(st["teacher2"][0] + k * 0.15, tone(2600, 0.04, 70), 0.3)
add(st["nudge"][0] + 0.3, noise(0.5, decay=6, smooth=60), 0.2)   # slide
u0, _ = st["upload"]
add(u0 + 0.05, sweep(200, 900, 0.5, 4), 0.3)   # whoosh in
for k in range(8): add(u0 + 0.6 + k * 0.13, tone(880 + k * 90, 0.06, 40), 0.15)   # progress blips
for k, m in enumerate([72, 76, 79, 84]): add(u0 + 1.72 + k * 0.08, tone(note(m), 0.6, 5), 0.2)   # ready chime
for k in range(6): add(st["scroll"][0] + k * 0.385, noise(0.18, decay=14, smooth=30), 0.22)   # swipes
add(st["scroll"][0] + 0.8, tone(1568, 0.3, 8), 0.12); add(st["scroll"][0] + 1.6, tone(1760, 0.3, 8), 0.12)
add(st["test"][0] + 0.45, mixs(tone(70, 0.4, 9), noise(0.1, decay=40, smooth=3) * 0.5), 0.6)   # stamp
v0, _ = st["victory"]
for k, m in enumerate([67, 72, 76, 79, 84, 88]): add(v0 + k * 0.07, mixs(tone(note(m), 0.7, 3), 0.4 * tone(note(m) * 2, 0.5, 5)), 0.16)   # fanfare
add(v0 + 0.2, noise(1.6, decay=1.5, smooth=8), 0.08)   # crowd cheer-ish
for k, m in enumerate([76, 79, 84]): add(st["end"][0] + 0.2 + k * 0.12, tone(note(m), 0.9, 3), 0.18)
t = np.arange(N) / SR
out *= np.minimum(1, t / 0.2) * np.minimum(1, (DUR - t) / 0.6)
out /= max(1e-6, np.abs(out).max() / 0.9)
sf.write(f"{S}/ad5/mix.wav", out.astype(np.float32), SR); print(round(DUR, 2))
