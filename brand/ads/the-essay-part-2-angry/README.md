# The Essay · Part 2, angry cut (19.9 s)

Same storyboard and 3D set as The Essay · Part 2 (the proven one), rewritten to be more infuriating in the same
20 seconds: the teacher **believes Jake**, you get the zero and he gets the A (two graded essays pop up: YOU 0 in red,
JAKE A in green), and next morning he smirks "Good luck, copycat." The brand line says "unspool dot cc" out loud.

| t (s) | shot | voice |
|---|---|---|
| 0.0 | PREVIOUSLY + poll (A tell the teacher / B stay quiet) | Most of you said, "Tell the teacher." |
| 1.9 | you at the teacher's desk | So you tell her your best friend copied your essay. |
| 4.1 | Jake stands, points; punch-in on your face | He doesn't even blink. "I wrote it. He copied me." |
| 6.4 | teacher glares at you; your face; the two graded essays | And she believes him. You get the zero. He gets the A. |
| 9.1 | teacher at the board; your face | Whoever really wrote it explains it tomorrow. |
| 11.1 | 11:47 PM, twelve pages; unspool.cc on the phone | One night. Twelve pages. You put them into unspool dot cc. |
| 14.1 | 7:58 AM hallway, Jake smirks, arms crossed | Next morning, he smirks: "Good luck, copycat." |
| 16.5 | you between Jake and the classroom door; A/B cards | Drop it… or explain every page? |
| 18.7 | sign: Made with UNSPOOL.CC · turn your notes into reels | (follow for part 3) |

- Voice: ElevenLabs eleven_v4, "Teke — Documentary Narrator" (`voice-take.mp3`). Pauses cut to 0.12 s (0.22 s after
  the four gut-punch lines) and sped up 1.125x, then 0.1 s of lead-in (`voice-tight.mp3`); `wt.json` has the word
  timings after that edit, which the captions use.
- Music: `mix.py` (the original's D minor bed, re-timed: sub hits on blink / "copied me" / believes / zero / A /
  copycat / the choice, the Unspool lift on "unspool dot cc").
- Teen audience: no violence, nothing sexual.
- Render: `node brand/ads/tools/render-fresh.mjs <dir> 4 --gl`, then `bash brand/ads/tools/encode.sh <dir> the-essay-part-2-angry`.
