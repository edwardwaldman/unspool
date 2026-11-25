# Captions in the reference's style: up to ~5 words, two lines, white with a black outline, one key word on a red box.
# Breaks at sentence ends; swears shown bleeped (F***ING).
import json, re
ws = json.load(open('wt.json'))
KEY = {"girlfriend", "outfit", "mistake", "f***ing", "black", "red", "wrong", "nothing", "bad", "insulted", "different", "both", "why", "asked",
       "sentence", "great", "fine", "good", "stops", "now", "cross-examined", "beautiful", "sighs", "help", "bedroom", "twenty", "minimum", "tomorrow",
       "forty", "unspool", "reels", "mitosis", "meiosis", "cycle", "quiz", "every", "never", "this", "hesitate", "mind", "word", "ready", "wearing",
       "interrogation", "count", "night", "total"}
caps, cur = [], []
def flush():
    global cur
    if not cur: return
    hl = next((i for i, (_, t) in enumerate(cur) if re.sub(r"[^a-z*\-']", "", t.lower()) in KEY), None)
    words = []
    for i, (_, t) in enumerate(cur):
        words.append(f'<b class="hl">{t}</b>' if i == hl else t)
    caps.append([cur[0][0], " ".join(words)]); cur = []
for i, w in enumerate(ws):
    t = w["w"].upper().replace('"', "")
    if "FUCK" in t: t = re.sub(r"FUCKING", "F***ING", t)
    cur.append((w["s"], t))
    end = re.search(r'[.?!]"?$', w["w"]) is not None
    gap = ws[i + 1]["s"] - w["e"] if i + 1 < len(ws) else 9
    if end or len(cur) >= 5 or gap > 0.45: flush()
flush()
open('web/caps.js', 'w').write("const CAPS = " + json.dumps(caps, ensure_ascii=False) + ";\n")
print(len(caps)); [print(f"{c[0]:6.2f} {re.sub('<[^>]+>','',c[1])}") for c in caps]
