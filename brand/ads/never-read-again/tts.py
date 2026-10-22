import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = sys.argv[1]
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
lines = [
 ("night", "What if you never had to read the whole thing again?"),
 ("upload", "Drop in the forty-page reading. Get it back as reels you'd actually watch."),
 ("scroll", "Hook, voiceover, captions, a quiz in every reel. Your thumb already knows how."),
 ("test", "And the question the test always asks? You've already seen it."),
 ("office", "Work reports too. Eighty pages, five reels, before your coffee goes cold."),
 ("park", "You still learned all of it. It just didn't take all night."),
 ("end", "Unspool. Turn any document into reels."),
]
SR = 24000; t = 0.5; pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for i, (shot, text) in enumerate(lines):
    a, _ = k.create(text, voice="af_heart", speed=1.02, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1200]
    d = len(a) / SR
    out.append({"shot": shot, "s": round(t, 3), "e": round(t + d, 3), "text": text})
    gap = 0.55 if i < len(lines) - 1 else 2.2
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
sf.write(f"{S}/ad/voice.wav", np.concatenate(pcm), SR)
json.dump({"dur": round(t, 3), "lines": out}, open(f"{S}/ad/web/tl.json", "w"), indent=1)
print(round(t, 2))
