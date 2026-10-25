# usage: vo.py <dir> ; reads <dir>/lines.json {voice, speed, lead, tail, lines:[[shot,text,gap?],...]}; writes voice.wav + web/tl.json
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = "/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad"
D = sys.argv[1]; cfg = json.load(open(f"{D}/lines.json"))
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
SR = 24000; t = cfg.get("lead", 0.3); pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for row in cfg["lines"]:
    shot, text = row[0], row[1]; gap = row[2] if len(row) > 2 else cfg.get("gap", 0.25)
    if not text:
        out.append({"shot": shot, "s": round(t, 3), "e": round(t + gap, 3), "text": ""}); pcm.append(np.zeros(int(SR * gap), np.float32)); t += gap; continue
    a, _ = k.create(text, voice=cfg["voice"], speed=cfg.get("speed", 1.05), lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 500): nz[-1] + 900]
    d = len(a) / SR
    out.append({"shot": shot, "s": round(t, 3), "e": round(t + d, 3), "text": row[3] if len(row) > 3 else text})
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
t += cfg.get("tail", 0); pcm.append(np.zeros(int(SR * cfg.get("tail", 0)), np.float32))
v = np.concatenate(pcm); sf.write(f"{D}/voice.wav", v, SR)
env = [float(np.sqrt(np.mean(v[int(i*SR/30):int((i+1)*SR/30)]**2) + 1e-9)) for i in range(int(len(v)/SR*30))]
m = max(env); env = [round(min(1, e / m * 1.8), 3) for e in env]
json.dump({"dur": round(t, 3), "lines": out, "env": env}, open(f"{D}/web/tl.json", "w"))
print(round(t, 2), [(l["shot"], l["s"]) for l in out])
