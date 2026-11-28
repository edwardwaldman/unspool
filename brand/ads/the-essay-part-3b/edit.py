# Build the voiceover from the take, word by word: keep the phrases below, close up the gaps inside a phrase,
# short pauses between phrases (a longer one before each gut punch), then speed up without changing pitch.
# Writes vo.wav (44.1 kHz) and wt.json (word timings in the final audio, which the captions use).
import json, subprocess, sys, numpy as np, soundfile as sf
SR = 44100; TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.15
W = [w for w in json.load(open("words-take.json"))["words"] if w.get("type") == "word"]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice-take.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, "<f4").copy()
# phrases as word-index ranges [first, last] (inclusive) into the take, and the pause after each
idx = {i: w["text"] for i, w in enumerate(W)}
def find(seq, start=0):
    toks = seq.split()
    for i in range(start, len(W)):
        if all(W[i + k]["text"].strip('",.?').lower() == t.lower() for k, t in enumerate(toks)): return i, i + len(toks) - 1
    raise SystemExit(f"not found: {seq}")
PLAN = [  # (words as spoken, pause after)
    ("Most of you said", 0.06), ("Explain every page", 0.2),
    ("So you stand up", 0.05), ("and explain all 12 pages", 0.06), ("perfectly", 0.2),
    ("Then Jake stands up", 0.1), ("and reads your notes", 0.06), ("off his phone", 0.18),
    ("Great job both of you", 0.2),
    ("He still gets the A", 0.1), ("you get a B", 0.12), ("for copying", 0.24),
    ("he posts your essay", 0.04), ("with his name on it", 0.16),
    ("10,000 likes by lunch", 0.22),
    ("but you made your reels on unspool.cc", 0.04), ("the night before", 0.22),
    ("Report him", 0.12), ("or post the proof", 0.0),
]
out = [np.zeros(int(0.1 * SR))]; t = 0.1; words = []; pos = 0
for text, pause in PLAN:
    i0, i1 = find(text, pos); pos = i1 + 1
    for k in range(i0, i1 + 1):
        w = W[k]; s = max(0, int((w["start"] - 0.025) * SR)); e = int((w["end"] + 0.03) * SR)
        if k < i1:  # inside a phrase: keep at most 60 ms of the gap to the next word
            e = min(e, int((min(W[k + 1]["start"], w["end"] + 0.06)) * SR))
        seg = a[s:e].copy(); f = int(0.006 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
        words.append({"w": w["text"], "s": round(t / TEMPO, 3), "e": round((t + (w["end"] - w["start"])) / TEMPO, 3)})
        out.append(seg); t += len(seg) / SR
    out.append(np.zeros(int(pause * SR))); t += pause
y = np.concatenate(out); sf.write("vo-raw.wav", y, SR)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "vo-raw.wav", "-filter:a", f"atempo={TEMPO}", "-ar", str(SR), "-ac", "1", "vo.wav"], check=True)
json.dump({"tempo": TEMPO, "words": words}, open("wt.json", "w"))
print("dur", round(len(y) / SR / TEMPO, 2))
