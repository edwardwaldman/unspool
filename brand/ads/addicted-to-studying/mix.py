# An original triumphant bed for the "pov: addicted to studying" ad (no voice). The reference's track is dense, bright
# and around F major; this one is F major at 120 BPM so every 2-second shot starts on a bar: a big kick + crash on each
# cut, driving eighth-note bass, a wide pad, a bright plucked hook, and a last bright note (no end card, like the original).
import sys, numpy as np, soundfile as sf
D = sys.argv[1]; SR = 44100; DUR = 12.0; N = int(SR * DUR); out = np.zeros(N); rng = np.random.default_rng(3); tt = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]
    if a >= 0: out[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .5, .25), att=0.005):
    t = np.arange(int(SR * d)) / SR; env = np.minimum(1, t / att) * np.exp(-t * dec)
    return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * env
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def kick(): t = np.arange(int(SR * 0.4)) / SR; return np.sin(2 * np.pi * (45 + 110 * np.exp(-t * 28)) * t) * np.exp(-t * 7)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
B = 0.5; prog = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]   # F C Dm Bb F C
hook = [77, 79, 81, 84, 81, 79, 77, 72]
for bar in range(6):
    t0 = bar * 2.0; ch = prog[bar]
    add(t0, kick(), 0.9); add(t0, lp(noise(1.6, 2.2), 3), 0.18)                                            # cut: kick + crash
    for m in ch: add(t0, tone(note(m), 2.1, 0.6, (1, .35, .15), 0.25), 0.07); add(t0, tone(note(m + 12), 2.1, 0.8, (1, .3), 0.3), 0.04)   # pad
    for q in range(8):
        tq = t0 + q * B / 2
        add(tq, tone(note(ch[0] - 12), 0.24, 9, (1, .6, .3)), 0.22)                                         # driving bass
        if q % 2 == 1: add(tq, noise(0.05, 70), 0.06)
        if q in (2, 6): add(tq, kick(), 0.45); add(tq, lp(noise(0.18, 18), 2), 0.16)
        add(tq, tone(note(hook[(q + bar) % 8]), 0.22, 10, (1, .45, .2)), 0.07)                                # hook
    if bar < 5: add(t0 + 1.7, lp(noise(0.3, 1), 6) * np.linspace(0, 1, int(SR * 0.3)), 0.12)             # whoosh into the next cut
add(11.0, tone(note(77), 1.0, 2.5, (1, .4, .2)), 0.08)   # a last bright note to ring out (no end card)
m = np.tanh(out * 1.6) / np.tanh(1.6); m *= np.minimum(1, tt / 0.01) * np.minimum(1, (DUR - tt) / 0.6); m /= np.abs(m).max() / 0.85
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok")
