import json, sys, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = sys.argv[1]
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
V = {"K": ("am_michael", 1.3), "U": ("af_heart", 1.24)}
lines = [
 ("kp", "K", "My bio test is in thirty minutes! I haven't read anything!"),
 ("u", "U", "How many pages?"),
 ("kp", "K", "Four hundred twelve! I'm so done!"),
 ("u", "U", "Relax. Upload the PDF. I'll turn it into reels."),
 ("screen", "K", "Wait... the whole PDF?!"),
 ("screen", "U", "Yep. Every chapter's a reel now."),
 ("swipe", "K", "Voiceover, captions, a quiz in every one!"),
 ("swipe2", "K", "I can study the whole textbook just by scrolling!"),
 ("k3", "K", "Wait... I actually get photosynthesis?!"),
 ("u2", "U", "You learned all of it."),
 ("test", "K", "Seen it."),
 ("end", "U", "Unspool dot C C. Your textbook, as reels."),
]
SR = 24000; t = 0.15; pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for i, (shot, who, text) in enumerate(lines):
    voice, sp = V[who]
    a, _ = k.create(text, voice=voice, speed=sp, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1200]
    d = len(a) / SR
    shown = text.replace("!!", "!").replace("one AM", "1 AM").replace("Unspool dot C C.", "unspool.cc")
    out.append({"shot": shot, "who": who, "s": round(t, 3), "e": round(t + d, 3), "text": shown})
    gap = {"screen": 0.04, "phone": 1.0, "swipe2": 0.2, "test": 0.25}.get(shot, 0.04) if i < len(lines) - 1 else 2.0
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
sf.write(f"{S}/ad3/voice.wav", np.concatenate(pcm), SR)
json.dump({"dur": round(t, 3), "lines": out}, open(f"{S}/ad3/web/tl.json", "w"), indent=1)
print(round(t, 2))
