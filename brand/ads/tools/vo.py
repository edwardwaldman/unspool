# Voiceover for an ad: reads <dir>/lines.json, writes <dir>/voice.wav and <dir>/web/tl.json (line timings + loudness).
#   python brand/ads/tools/vo.py brand/ads/<ad>          (or a scratch copy of it)
# lines.json: {"engine": "elevenlabs"|"kokoro", "voice": ..., "speed": 1.1, "lead": 0.3, "tail": 0, "gap": 0.2,
#              "pron": {"word": "IPA"}, "lines": [[shot, text, gap?, caption?], ...]}
# ElevenLabs is used when the engine says so and api.elevenlabs.io is reachable with a key: either ELEVENLABS_API_KEY,
# or a network secret on the cloud environment (the proxy adds the key, so a placeholder header is sent).
# "voice" is then an ElevenLabs voice id; "model" defaults to eleven_v3, which reads tags like [shouting] [whispers].
# Otherwise it falls back to Kokoro (local, free): voice = am_michael, am_fenrir, af_heart ...
import io, json, os, re, ssl, sys, urllib.request
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 24000
D = sys.argv[1]
cfg = json.load(open(os.path.join(D, "lines.json")))
os.makedirs(os.path.join(D, "web"), exist_ok=True)

def say_years(t):  # "1985" -> "nineteen eighty-five" (rule 2 in brand/ads/README.md)
    ones = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
    tens = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
    two = lambda n: ones[n] if n < 20 else tens[n // 10] + ("-" + ones[n % 10] if n % 10 else "")
    def year(m):
        y = int(m.group(0)); a, b = divmod(y, 100)
        if 2000 <= y < 2010: return "two thousand" + (" " + ones[b] if b else "")
        return two(a) + (" hundred" if b == 0 else (" oh " + ones[b] if b < 10 else " " + two(b)))
    return re.sub(r"\b(1[1-9]\d\d|20\d\d)\b", year, t)

def eleven(text):
    key = os.environ.get("ELEVENLABS_API_KEY", "placeholder-the-proxy-adds-the-real-key")
    body = {"text": text, "model_id": cfg.get("model", "eleven_v3"),
            "voice_settings": cfg.get("voice_settings", {"stability": 0.35, "similarity_boost": 0.8, "style": 0.6, "speed": min(1.2, cfg.get("speed", 1.0))})}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice']}?output_format=pcm_24000",
                                 data=json.dumps(body).encode(), headers={"xi-api-key": key, "Content-Type": "application/json"})
    ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE"))
    with urllib.request.urlopen(req, context=ctx, timeout=120) as r:
        return np.frombuffer(r.read(), dtype="<i2").astype(np.float32) / 32768

kok = None
def kokoro(text):
    global kok
    if kok is None:
        from kokoro_onnx import Kokoro
        m = os.environ.get("KOKORO_DIR", os.path.join(HERE, ".models"))
        kok = Kokoro(os.path.join(m, "kokoro-v1.0.onnx"), os.path.join(m, "voices-v1.0.bin"))
    a, _ = kok.create(text, voice=cfg.get("kokoro_voice", cfg["voice"] if "_" in cfg["voice"] else "am_michael"), speed=cfg.get("speed", 1.05), lang="en-us")
    return a.astype(np.float32)

engine = cfg.get("engine", "kokoro")
def speak(text):
    global engine
    for word, ipa in cfg.get("pron", {}).items():
        if engine == "kokoro": text = re.sub(rf"\b{re.escape(word)}\b", f"[{word}](/{ipa}/)", text)
    text = say_years(text)
    if engine == "elevenlabs":
        try: return eleven(text)
        except Exception as e:
            print(f"ElevenLabs unavailable ({e}); falling back to Kokoro", file=sys.stderr); engine = "kokoro"
    return kokoro(re.sub(r"\[[a-z ]+\]\s*", "", text))  # Kokoro can't read [shouting]-style tags

t = cfg.get("lead", 0.3); pcm = [np.zeros(int(SR * t), np.float32)]; out = []
for row in cfg["lines"]:
    shot, text = row[0], row[1]; gap = row[2] if len(row) > 2 else cfg.get("gap", 0.25)
    if not text:
        out.append({"shot": shot, "s": round(t, 3), "e": round(t + gap, 3), "text": ""}); pcm.append(np.zeros(int(SR * gap), np.float32)); t += gap; continue
    a = speak(text); nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz): a = a[max(0, nz[0] - 500): nz[-1] + 900]
    d = len(a) / SR
    caption = row[3] if len(row) > 3 else re.sub(r"\[[a-z ]+\]\s*", "", text)
    out.append({"shot": shot, "s": round(t, 3), "e": round(t + d, 3), "text": caption})
    pcm += [a, np.zeros(int(SR * gap), np.float32)]; t += d + gap
t += cfg.get("tail", 0); pcm.append(np.zeros(int(SR * cfg.get("tail", 0)), np.float32))
v = np.concatenate(pcm); sf.write(os.path.join(D, "voice.wav"), v, SR)
env = [float(np.sqrt(np.mean(v[int(i * SR / 30):int((i + 1) * SR / 30)] ** 2) + 1e-9)) for i in range(int(len(v) / SR * 30))]
m = max(env) or 1; env = [round(min(1, e / m * 1.8), 3) for e in env]
json.dump({"dur": round(t, 3), "lines": out, "env": env, "engine": engine}, open(os.path.join(D, "web", "tl.json"), "w"))
print(engine, round(t, 2), [(l["shot"], l["s"]) for l in out])
