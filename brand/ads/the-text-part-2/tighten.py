# Cap every pause in the raw take at CAP s (the "emotional" pauses keep LONG s), then speed up by TEMPO.
# Writes tight.wav and map.json (raw->output keep segments) so word timings can be remapped.
import numpy as np, wave, json, sys
CAP, LONG, TEMPO = 0.20, 0.42, 1.12
w = wave.open('raw.wav'); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)
sil = [tuple(map(float, l.split())) for l in open('sil.txt') if l.strip()]
longs = set(json.load(open('longs.json'))) if len(sys.argv) > 1 else set()
idx = np.nonzero(np.abs(a) > 300)[0]; st = max(0, idx[0] / sr - 0.03); en = idx[-1] / sr + 0.25
keep = []; cur = st
for i, (s, e) in enumerate(sil):
    if e <= st or s >= en: continue
    k = LONG if i in longs else CAP
    if e - s <= k: continue
    keep.append((cur, s + k / 2)); cur = e - k / 2
keep.append((cur, en))
out = np.concatenate([a[int(x * sr):int(y * sr)] for x, y in keep])
o = wave.open('tight.wav', 'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr); o.writeframes(np.clip(out, -32768, 32767).astype(np.int16).tobytes())
json.dump({"keep": keep, "tempo": TEMPO}, open('map.json', 'w')); print(len(out) / sr, len(out) / sr / TEMPO)
