# Original score for the long cut of "The Essay · Part 2" (77.6 s). Tense D minor drone + clock tick + heartbeat in the
# present; it drops out for the two flashbacks, where a soft music-box piano plays instead (sepia scenes); sub hits on each
# twist; a brighter lift on "Unspool"; a slow swell from the standoff to the choice; a chime on the end sign. Voice on top, bed ducked.
import sys, numpy as np, soundfile as sf
D = sys.argv[1]; SR = 44100; DUR = 77.6; N = int(SR * DUR); bed = np.zeros(N); rng = np.random.default_rng(11); tt = np.arange(N) / SR
note = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(t0, x, g):
    a = int(t0 * SR); x = x[:max(0, N - a)]
    if a >= 0: bed[a:a + len(x)] += x * g
def tone(f, d, dec=6, h=(1, .5, .25), att=0.005):
    t = np.arange(int(SR * d)) / SR; env = np.minimum(1, t / att) * np.exp(-t * dec)
    return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(h)) * env
def noise(d, dec=6): t = np.arange(int(SR * d)) / SR; return rng.standard_normal(len(t)) * np.exp(-t * dec)
def lp(x, n): return np.convolve(x, np.ones(n) / n, "same")
def sub(d=1.2): t = np.arange(int(SR * d)) / SR; return np.sin(2 * np.pi * (38 + 70 * np.exp(-t * 14)) * t) * np.exp(-t * 2.6)
def swell(d=0.6): t = np.arange(int(SR * d)) / SR; return lp(rng.standard_normal(len(t)), 8) * (t / d) ** 2.5
FLASH = [(17.92, 21.04), (29.0, 34.54)]
inflash = lambda t: any(a <= t < b for a, b in FLASH)
present = np.ones(N)
for a, b in FLASH: present[int(a * SR):int(b * SR)] = 0
present = lp(present, int(SR * 0.25))
drone = sum(np.sin(2 * np.pi * f * tt) * g for f, g in ((note(38), .16), (note(45), .08), (note(53), .05), (note(38) * 1.003, .1))) * (0.8 + 0.2 * np.sin(tt * 0.7))
bed += drone * present
for i in range(int(76.0 / 0.25)):
    t0 = i * 0.25
    if inflash(t0): continue
    add(t0, lp(noise(0.03, 120), 1) * (1 if i % 2 == 0 else .6), 0.045)
    if i % 4 == 0: add(t0, sub(0.3), 0.2); add(t0 + 0.18, sub(0.25), 0.12)
for t in (9.38, 10.29, 14.73, 17.32, 28.39, 34.54, 47.74, 54.22, 58.97, 62.83, 73.3):
    add(t - 0.6, swell(0.6), 0.15); add(t, sub(1.4), 0.7); add(t, lp(noise(1.2, 3), 4), 0.1)
    for m in (38, 39, 45): add(t, tone(note(m + 12), 1.6, 1.4, (1, .4)), 0.045)
# flashbacks: music box, F major, gentle
mb = [72, 76, 79, 84, 79, 76, 77, 81, 84, 81, 77, 74, 76, 79, 83, 79]
for a, b in FLASH:
    for i, m in enumerate(mb * 3):
        t0 = a + 0.1 + i * 0.36
        if t0 > b - 0.2: break
        add(t0, tone(note(m), 1.2, 3.2, (1, .3, .12)), 0.07)
    for m in (53, 57, 60): add(a, tone(note(m), b - a, 0.25, (1, .3), 0.6), 0.05)
# Unspool lift
for i, m in enumerate([62, 66, 69, 74, 69, 66, 69, 74, 78, 74, 69, 74, 62, 66, 69, 74, 69, 66, 69, 74, 78, 74, 69, 74, 81, 78, 74, 69, 74, 78, 81, 86]):
    add(42.6 + i * 0.16, tone(note(m), 0.4, 7, (1, .5, .2)), 0.06)
add(42.6, tone(note(50), 5.0, 0.4, (1, .4, .2), 0.3), 0.1)
# standoff -> choice swell
t = np.arange(int(SR * 11.2)) / SR; env = (t / 11.2) ** 1.6
for m in (50, 53, 56, 62): add(64.81, np.sin(2 * np.pi * note(m) * t) * env, 0.045)
add(76.0, tone(note(86), 1.4, 2.5, (1, .3)), 0.12); add(76.0, tone(note(81), 1.4, 2.5, (1, .3)), 0.08); add(76.0, sub(0.8), 0.4)
vw, vsr = sf.read(f"{D}/vo.wav"); vw = vw if vw.ndim == 1 else vw.mean(1); assert vsr == SR
vo = np.zeros(N); vo[:min(N, len(vw))] = vw[:N]
envv = lp(np.abs(vo), 2205); duck = 1 - 0.45 * np.clip(envv / (envv.max() * 0.3), 0, 1)
m = np.tanh(bed * 1.3) / np.tanh(1.3) * duck * 0.55 + vo
m *= np.minimum(1, tt / 0.01) * np.minimum(1, (DUR - tt) / 0.4); m /= np.abs(m).max() / 0.9
sf.write(f"{D}/mix.wav", m.astype(np.float32), SR); print("ok", len(vw) / SR)
