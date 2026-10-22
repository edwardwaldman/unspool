import json, sys, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = sys.argv[1]
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
V = {"K": ("am_michael", 1.26), "F": ("am_liam", 1.24), "U": ("af_heart", 1.2)}
lines = [
 ("f", "F", "Bro. The bio test is tomorrow. You have to study or you're gonna fail."),
 ("k", "K", "I am studying."),
 ("f2", "F", "You're literally scrolling."),
 ("swipe", "K", "Exactly. Every chapter's a reel. Voiceover, captions, a quiz in every one."),
 ("upload", "K", "I put the whole textbook into Unspool."),
 ("f2", "F", "Wait... that's actually the textbook?"),
 ("k", "K", "Yep. I'm on reel thirty."),
 ("f", "F", "Send me the link."),
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
    gap = {"swipe": 0.08, "upload": 1.1}.get(shot, 0.06) if i < len(lines) - 1 else 2.0
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
sf.write(f"{S}/ad4/voice.wav", np.concatenate(pcm), SR)
json.dump({"dur": round(t, 3), "lines": out}, open(f"{S}/ad4/web/tl.json", "w"), indent=1)
print(round(t, 2))
