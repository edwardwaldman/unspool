import json, sys, numpy as np, soundfile as sf
S = sys.argv[1]; SR = 24000
tl = json.load(open(f"{S}/ad2/web/tl.json")); dur = tl["dur"]
n = int(SR * dur); t = np.arange(n) / SR; out = np.zeros(n)
note = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]  # C Am F G: hopeful
bar = 2.2
for i in range(int(dur / bar) + 1):
    s0 = i * bar; idx = (t >= s0) & (t < s0 + bar + 0.6); tt = t[idx] - s0
    env = np.minimum(1, tt / 0.4) * np.exp(-np.maximum(0, tt - bar) * 4)
    for m in prog[i % 4]:
        f = note(m); out[idx] += env * (np.sin(2*np.pi*f*tt) + 0.3*np.sin(2*np.pi*f*2.004*tt)) * 0.05
    # plucked arpeggio
    for k, m in enumerate(prog[i % 4] * 2):
        st = k * bar / 8; bt = tt - st; on = bt >= 0
        out[idx] += on * np.sin(2*np.pi*note(m+12)*np.maximum(bt,0)) * np.exp(-np.maximum(bt,0)*7) * 0.05
    if i >= 2:
        for b in range(4):
            bt = tt - b * bar / 4; on = bt >= 0
            out[idx] += on * np.sin(2*np.pi*55*np.maximum(bt,0)) * np.exp(-np.maximum(bt,0)*13) * 0.25
rng = np.random.default_rng(3); noise = rng.standard_normal(n)
for L in tl["lines"][1:]:
    c = L["s"] - 0.3; a = int((c - 0.3) * SR); ln = int(0.45 * SR)
    if a < 0 or a + ln >= n: continue
    w = np.convolve(noise[a:a+ln] * np.sin(np.linspace(0, np.pi, ln))**2, np.ones(10)/10, "same"); out[a:a+ln] += w * 0.22
voice, _ = sf.read(f"{S}/ad2/voice.wav"); v = np.zeros(n); v[:min(n, len(voice))] = voice[:n]
envv = np.convolve(np.abs(v), np.ones(int(.15*SR))/int(.15*SR), "same")
mixd = out * (1 - 0.5*np.minimum(1, envv/0.05)) * 0.6 + v
mixd *= np.minimum(1, t/0.3) * np.minimum(1, (dur - t)/1.0)
mixd /= max(1, np.abs(mixd).max()/0.95)
sf.write(f"{S}/ad2/mix.wav", mixd.astype(np.float32), SR); print("ok")
