import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = sys.argv[1]
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
V = {"G": ("af_bella", 1.05), "S": ("am_echo", 1.0)}
lines = [
 ("g", "G", "Spool. I got a hundred on the bio test."),
 ("s", "S", "Nice."),
 ("g", "G", "I didn't read the textbook. You did."),
 ("s", "S", "I just turned it into reels."),
 ("g2", "G", "Thirty-eight of them."),
 ("s", "S", "You watched all thirty-eight."),
 ("g2", "G", "Some of them twice."),
 ("s2", "S", "The mitochondria one? Four times."),
 ("g", "G", "...It was a good reel."),
 ("s2", "S", "It makes A T P. Knowing that is the job."),
 ("wide", "G", "Okay. Chemistry's next."),
 ("s", "S", "Upload the PDF."),
 ("end", "S", ""),
]
SR = 24000; t = 0.4; pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for i, (shot, who, text) in enumerate(lines):
    if not text:
        out.append({"shot": shot, "who": who, "s": round(t, 3), "e": round(t + 2.6, 3), "text": ""}); pcm.append(np.zeros(int(SR * 2.6), np.float32)); t += 2.6; break
    voice, sp = V[who]
    a, _ = k.create(text, voice=voice, speed=sp, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1200]
    d = len(a) / SR
    out.append({"shot": shot, "who": who, "s": round(t, 3), "e": round(t + d, 3), "text": text.replace("A T P", "ATP").replace("a hundred", "a 100")})
    gap = 0.75 if text.startswith("...") or shot == "s2" else 0.45
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
sf.write(f"{S}/ad9/voice.wav", np.concatenate(pcm), SR)
json.dump({"dur": round(t, 3), "lines": out}, open(f"{S}/ad9/web/tl.json", "w"), indent=1)
print(round(t, 2))
