import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = sys.argv[1]
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
lines = [
 ("hook", "What if studying only took you ten minutes, instead of two hours?"),
 ("reels", "Your whole reading, as reels. A hook, a voiceover, captions, and a quiz."),
 ("click", "Drop in the PDF. Click once. That's the whole thing."),
 ("scroll", "Now your reading feels like scrolling. Because it is."),
 ("test", "And when the test asks? You've already seen it."),
 ("park", "Ten minutes of reels. Done before dinner."),
 ("end", "Unspool. One click, and your reading's a reel."),
]
SR = 24000; t = 0.5; pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for i, (shot, text) in enumerate(lines):
    a, _ = k.create(text, voice="af_heart", speed=1.02, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 600): nz[-1] + 1200]
    d = len(a) / SR
    out.append({"shot": shot, "s": round(t, 3), "e": round(t + d, 3), "text": text})
    gap = 0.6 if i < len(lines) - 1 else 2.2
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
sf.write(f"{S}/ad2/voice.wav", np.concatenate(pcm), SR)
json.dump({"dur": round(t, 3), "lines": out}, open(f"{S}/ad2/web/tl.json", "w"), indent=1)
print(round(t, 2))
