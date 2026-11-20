# Time every line (and every caption word) to the real voice take, sped up by TEMPO.
import json, sys
sys.path.insert(0, sys.argv[1]); from words import W
TEMPO, LEAD = 1.12, 0.25
L = [
 ("hook", 0, "What would you do if your *homeboy* woke up as a *girl*?!"),
 ("turn", 12, "Like, a FULL *girl*"),
 ("mirror", 16, "on the morning of the bio *test*!"),
 ("call", 23, "Imagine. *Seven AM*. A call from your *best friend*."),
 ("answer", 32, "You answer, and a girl is *screaming* your name!"),
 ("memory", 41, "Memory search: absolutely *no idea* who this is."),
 ("itsit", 49, "Then she says your nickname. It's *him*!"),
 ("before", 56, "Same cap. Same hoodie. Same chain. Somehow *transformed* overnight!"),
 ("prank", 65, "At first, you think it's a *prank*. But it's *real*!"),
 ("today", 74, "And the bio test is in one *hour*!"),
 ("mission", 82, "Your homeboy has one *mission*: turn back!"),
 ("funny", 89, "But the *funniest* part?"),
 ("couch", 93, "He still acts exactly the *same*. Same couch. Same snacks. Same *scrolling*."),
 ("couch2", 106, "Except now, the scroll is his bio chapter, on *Unspool*!"),
 ("test", 116, "The test comes back, and he *aces* it!"),
 ("roof", 124, "And when it's all over..."),
 ("roof2", 129, "Would you treat your homeboy *exactly* the same?!"),
 ("end", 137, "What would *you* do? Try Unspool *free* at *unspool.cc*"),
]
T = lambda x: round(LEAD + x / TEMPO, 3)
out = []; i0 = 0
print(len(W), sum(len(t.split()) for _, _, t in L))
for k, (shot, _, text) in enumerate(L):
    i1 = i0 + len(text.split())
    ws = [T(W[i][0]) for i in range(i0, i1)]
    assert len(ws) == len(text.split()), (shot, len(ws), len(text.split()))
    out.append({"shot": shot, "text": text, "s": ws[0], "e": T(W[i1 - 1][1]), "ws": ws}); print(shot, " ".join(f"{W[i][0]}" for i in (i0, i1 - 1))); i0 = i1
dur = round(out[-1]["e"] + 1.8, 2)
json.dump({"dur": dur, "lines": out}, open(sys.argv[2], "w"), indent=1); print(dur)
