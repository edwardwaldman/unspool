# The script: one line per shot. *word* marks the word the caption highlights.
# No voice yet (ElevenLabs needs a sign-in), so each line gets a natural narration length: ~2.9 words/s.
import json, re, sys
L = [
 ("hook",     "What would you do if your *homeboy* woke up as a *girl*?!"),
 ("turn",     "Like, a FULL *girl*!"),
 ("mirror",   "On the morning of the bio *test*!"),
 ("call",     "Imagine. *7 AM*. A call from your *best friend*."),
 ("answer",   "You answer, and a girl is *screaming* your name."),
 ("memory",   "Memory search: absolutely *no idea* who this is."),
 ("itsit",    "Then she says your nickname. It's *him*!"),
 ("before",   "Same cap. Same hoodie. Same chain. Somehow *transformed* overnight."),
 ("prank",    "At first, you think it's a *prank*. But it's *real*."),
 ("today",    "And the bio test is in one *hour*!"),
 ("mission",  "Your homeboy has one *mission*: turn back."),
 ("funny",    "But the *funniest* part?"),
 ("couch",    "He still acts exactly the *same*. Same couch. Same snacks. Same *scrolling*."),
 ("couch2",   "Except now, the scroll is his bio chapter, on *Unspool*."),
 ("test",     "The test comes back, and he *aces* it."),
 ("roof",     "And when it's all over..."),
 ("roof2",    "Would you treat your homeboy *exactly* the same?"),
 ("end",      "What would *you* do? Try Unspool *free* at unspool dot cc."),
]
t, out = 0.25, []
for shot, text in L:
    n = len(text.split()); d = max(1.1, n / 2.9 + 0.15) + (0.6 if shot in ("funny", "itsit", "turn") else 0) + (1.0 if shot in ("couch2", "roof") else 0)
    out.append({"shot": shot, "text": text, "s": round(t, 3), "e": round(t + d - 0.2, 3)}); t += d
dur = round(t + 1.2, 2)
json.dump({"dur": dur, "lines": out}, open(sys.argv[1], "w"), indent=1)
print(dur, [(o["shot"], o["s"]) for o in out])
