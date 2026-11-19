# The script: one line per shot. *word* marks the word the caption highlights.
# No voice yet (ElevenLabs needs a sign-in), so each line gets a natural narration length: ~2.9 words/s.
import json, re, sys
L = [
 ("hook",     "What would you do if you woke up *tomorrow*..."),
 ("book",     "and your forty-page *textbook* chapter..."),
 ("turn",     "turned into *TikToks*?"),
 ("alarm",    "Imagine. It's *7 AM*. Bio test. *Today*."),
 ("open",     "You open the chapter, and your brain goes *blank*."),
 ("panic",    "Total *panic*."),
 ("memory",   "Memory search: chapter four. Absolutely *nothing*."),
 ("buzz",     "Then your phone *buzzes*."),
 ("itsit",    "Wait. It's the *chapter*!"),
 ("before",   "Same facts. Same diagrams. Somehow *transformed* overnight."),
 ("gimmick",  "At first, you think it's a *gimmick*."),
 ("quiz",     "But every reel ends with a *quiz*. And you *get it*."),
 ("breakfast","So you scroll at *breakfast*. Mom thinks nothing's *unusual*."),
 ("funny",    "But the *funniest* part?"),
 ("couch",    "You still act exactly the *same*. Same couch. Same snacks. Same *scrolling*."),
 ("couch2",   "Except now, you actually *remember* it."),
 ("test",     "Then the test comes back, and everyone treats you *differently*."),
 ("roof",     "Your best friend has one *question*."),
 ("roof2",    "Would you share it with your *best friend*?"),
 ("end",      "What would *you* do? Try it *free* at unspool dot cc."),
]
t, out = 0.25, []
for shot, text in L:
    n = len(text.split()); d = max(1.1, n / 2.9 + 0.15) + (0.6 if shot in ("panic", "funny", "itsit") else 0)
    out.append({"shot": shot, "text": text, "s": round(t, 3), "e": round(t + d - 0.2, 3)}); t += d
dur = round(t + 1.2, 2)
json.dump({"dur": dur, "lines": out}, open(sys.argv[1], "w"), indent=1)
print(dur, [(o["shot"], o["s"]) for o in out])
