# Original bed for "Which outfit looks better?": a soft, slightly awkward lo-fi loop under a deadpan narrator (Rhodes-style
# chords Fmaj7-Em7-Dm7-Cmaj7 at 84 BPM, brushed kit, round bass), a lift while Unspool does the reading (51.3-61.2),
# a record-scratch-style stop on "never mind", and a light chime on the end sign. Voice on top with the swears bleeped.
import sys, numpy as np, soundfile as sf
D = sys.argv[1]; SR = 44100; DUR = 86.0; N = int(SR * DUR); bed = np.zeros(N); rng = np.random.default_rng(5); tt = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]
    if a >= 0: bed[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .5, .25), att=0.005):
    t = np.arange(int(SR * d)) / SR; env = np.minimum(1, t / att) * np.exp(-t * dec)
    return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * env
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
def kick(): t = np.arange(int(SR * 0.3)) / SR; return np.sin(2 * np.pi * (50 + 80 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
B = 60 / 84; bar = 4 * B
prog = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
STOP = (66.74, 67.7)
t0 = 0.0; i = 0
while t0 < 83.7:
    ch = prog[i % 4]; lift = 51.28 <= t0 < 61.2
    if not (STOP[0] <= t0 < STOP[1]):
        for m in ch: add(t0, tone(note(m + (12 if lift else 0)), bar * 1.05, 0.9, (1, .3, .1), 0.02), 0.05)
        for q in range(4):
            tq = t0 + q * B
            if STOP[0] <= tq < STOP[1]: continue
            if q in (0, 2): add(tq, kick(), 0.35)
            if q in (1, 3): add(tq, lp(noise(0.12, 25), 3), 0.08)
            add(tq + B / 2, lp(noise(0.04, 80), 1), 0.035)
            add(tq, tone(note(ch[0] - 12), B * 0.9, 3, (1, .4)), 0.12)
        if lift:
            for k, m in enumerate([72, 76, 79, 84, 79, 76, 79, 84]): add(t0 + k * B / 2, tone(note(m), 0.4, 6, (1, .4, .2)), 0.04)
    t0 += bar; i += 1
add(STOP[0], lp(noise(0.25, 8), 2) * np.linspace(1, 0, int(SR * 0.25)), 0.15)   # the stop on "never mind"
add(83.7, tone(note(84), 1.6, 2.2, (1, .3)), 0.1); add(83.7, tone(note(88), 1.6, 2.2, (1, .3)), 0.07)
vw, vsr = sf.read(f"{D}/vo.wav"); vw = vw if vw.ndim == 1 else vw.mean(1); assert vsr == SR
vo = np.zeros(N); vo[:min(N, len(vw))] = vw[:N]
envv = lp(np.abs(vo), 2205); duck = 1 - 0.5 * np.clip(envv / (envv.max() * 0.3), 0, 1)
m = np.tanh(bed * 1.2) / np.tanh(1.2) * duck * 0.35 + vo   # music ~3dB lower (owner asked for quieter)
m *= np.minimum(1, tt / 0.01) * np.minimum(1, (DUR - tt) / 0.5); m /= np.abs(m).max() / 0.9
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok", len(vw) / SR)
