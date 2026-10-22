import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S = sys.argv[1]
k = Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
VOICE, SP = "am_michael", 1.12
L = [
 ("ride", "Kids be acing tests like they have a private tutor,", 0.25),
 ("ride", "then ask you:", 0.3),
 ("eyes", "\"How did you know I had a tutor?\"", 0.45),
 ("track", "I don't know bro.", 0.2),
 ("track", "You skipped every lecture,", 0.15),
 ("track", "played games all week,", 0.2),
 ("wide", "and then came home", 0.15),
 ("wide", "still acing the test like you read the whole textbook.", 0.2),
 ("fall", "", 1.5),
 ("sky", "Having a tutor must be nice.", 0.3),
 ("sky", "I wish I could have a tutor,", 0.2),
 ("sky2", "but I can't,", 0.15),
 ("sky2", "because I spent all my money", 0.1),
 ("toss", "on some designer hoodie.", 0.35),
 ("phone", "Which is why I use Unspool instead.", 0.3),
 ("mech", "", 3.6),
 ("demo", "It turns my notes into reels that teach just as well as a tutor.", 0.25),
 ("demo", "But instead of eighty dollars an hour,", 0.15),
 ("demo", "it only costs four bucks a week.", 0.4),
 ("fly", "Uploading your notes to some random AI is scary as hell.", 0.25),
 ("eyes2", "That's why your first document is free.", 0.2),
 ("eyes2", "If you don't like the reels,", 0.15),
 ("mclose", "there's no risk from your side.", 0.5),
 ("end", "", 2.8),
]
SHOW = {"eighty dollars": "$80", "four bucks": "$4", "Unspool": "Unspool"}
SR = 24000; t = 0.3; pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for shot, text, gap in L:
    if not text:
        out.append({"shot": shot, "s": round(t, 3), "e": round(t + gap, 3), "text": ""}); pcm.append(np.zeros(int(SR * gap), np.float32)); t += gap; continue
    a, _ = k.create(text.replace("\"", ""), voice=VOICE, speed=SP, lang="en-us")
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 500): nz[-1] + 1000]
    d = len(a) / SR
    shown = text.replace("eighty dollars an hour", "$80 an hour").replace("four bucks a week", "$4 a week")
    out.append({"shot": shot, "s": round(t, 3), "e": round(t + d, 3), "text": shown})
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
sf.write(f"{S}/ad11/voice.wav", np.concatenate(pcm), SR)
json.dump({"dur": round(t, 3), "lines": out}, open(f"{S}/ad11/web/tl.json", "w"), indent=1)
print(round(t, 2))
