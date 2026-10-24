import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = "/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad"
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
VOICE = sys.argv[1] if len(sys.argv) > 1 else "am_fenrir"
lines = [
 ("hook",  "Why is every textbook four hundred pages long?"),
 ("drop",  "You think you're studying."),
 ("student", "Rereading. Highlighting. Making flashcards."),
 ("eyes",  "But by the exam, half of it is gone."),
 ("vat",   "Every chapter is really just a few big ideas."),
 ("suit",  "So I built something."),
 ("dunk",  "Drop in any PDF, notes, or slides."),
 ("reveal","And out come short reels."),
 ("reveal","With a voiceover, captions, and a quiz."),
 ("offer", "Your first reel is free."),
 ("cta",   "Click the link and try it today."),
 ("end",   ""),
]
GAP = {"suit": 1.6, "dunk": 1.0, "drop": 0.5}
SR = 24000; t = 0.35; pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for shot, text in lines:
    if not text:
        out.append({"shot": shot, "s": round(t, 3), "e": round(t + 3.2, 3), "text": ""}); pcm.append(np.zeros(int(SR * 3.2), np.float32)); t += 3.2; break
    a, _ = k.create(text, voice=VOICE, speed=1.08, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1200]
    d = len(a) / SR
    out.append({"shot": shot, "s": round(t, 3), "e": round(t + d, 3), "text": text.replace("four hundred", "400")})
    g = GAP.get(shot, 0.35); pcm += [a, np.zeros(int(SR * g), np.float32)]; t += d + g
v = np.concatenate(pcm); sf.write(f"{S}/ad5/voice.wav", v, SR)
env = [float(np.sqrt(np.mean(v[int(i*SR/30):int((i+1)*SR/30)]**2) + 1e-9)) for i in range(int(len(v)/SR*30))]
m = max(env); env = [round(min(1, e / m * 1.8), 3) for e in env]
json.dump({"dur": round(t, 3), "lines": out, "env": env}, open(f"{S}/ad5/web/tl.json", "w"))
print(round(t, 2))
