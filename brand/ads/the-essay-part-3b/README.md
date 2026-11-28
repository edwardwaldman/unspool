# The Essay · Part 3, path B (21.5 s)

Follows the angry cut of Part 2, on the path most people voted for ("B: explain every page").
The opening is deliberately tame (the PREVIOUSLY poll card over a calm classroom, no shove or slap: the slap cut
seemed to lower reach). The anger then builds: you nail the presentation, Jake reads your notes off his phone, the
teacher gives him the A and you a B "for copying", and he posts your essay under his name. Unspool is the turn (you made
the reels the night before), and it ends on an unresolved A/B choice.

| t (s) | shot | voice |
|---|---|---|
| 0.0 | PREVIOUSLY + poll (A drop it / B explain it, B ticks) | Most of you said, "Explain every page." |
| 2.15 | you at the front, the board counts to 12/12; Jake smug, then worried | So you stand up and explain all twelve pages. Perfectly. |
| 5.2 | Jake stands, reading off his phone; a photo of your notes pops up | Then Jake stands up and reads your notes off his phone. |
| 8.15 | teacher claps; JAKE A, YOU B "for copying"; your face | "Great job, both of you." He still gets the A. You get a B, for copying. |
| 11.95 | AFTER CLASS, Jake on the lockers; his post, likes climb to 10,000 | He posts your essay with his name on it. Ten thousand likes by lunch. |
| 15.55 | LAST NIGHT 11:47 PM, the twelve pages, the Unspool reels on your phone | But you made your reels on unspool dot cc, the night before. |
| 18.75 | hallway, you between Jake and the teacher; A/B cards | Report him, or post the proof? |
| 20.35 | sign: Made with UNSPOOL.CC | (follow for part 4) |

- Voice: ElevenLabs eleven_v4, "Teke — Documentary Narrator", one take (`voice-take.mp3`). `edit.py` rebuilds it word by
  word from the transcript (`words-take.json`): drops "in front of the whole class", "and she says" and "after class",
  closes the gaps, then 1.2x without changing pitch (`vo.wav`, timings in `wt.json`).
- Music: `mix.py` (the Part 2 bed, re-timed; no hits in the first five seconds so the opening stays calm).
- Teen audience: no violence, nothing sexual, no swearing. No product claims beyond "you made reels on unspool.cc".
- Render: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> the-essay-part-3b`.
