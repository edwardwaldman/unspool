# The Essay · Part 2 (choose-your-path story ad, 19.7 s)

A second-person "what would you do" story in the format of the blocky-3D "Part 2" series videos: **PREVIOUSLY** + an
A/B poll card, "most of you said…", a twist every ~2 s, Unspool as the turning point of the plot, an unresolved A/B
choice ("comment A or B"), then the character holds the sponsor sign.

| t (s) | shot | voice |
|---|---|---|
| 0.0 | PREVIOUSLY + poll (A tell the teacher / B stay quiet) | Most of you said: "Tell the teacher." |
| 2.1 | you at the teacher's desk | So you tell her your best friend copied your essay. |
| 4.4 | Jake stands, points; punch-in on your face | He doesn't even blink. "I wrote it. He copied me." |
| 6.9 | teacher writes on the board; your face | Whoever wrote it explains it tomorrow. Out loud. |
| 9.3 | 11:47 PM, twelve pages; Unspool on the phone | One night. Twelve pages. You put them into Unspool and learn every line. |
| 13.2 | 7:58 AM hallway, Jake whispers | Next morning, he whispers: "Drop it, or we're done." |
| 16.0 | you between Jake and the classroom door; A/B cards | Do you drop it… or explain every page? |
| 18.6 | sign: Made with UNSPOOL.CC · turn your notes into reels | (follow for part 3) |

- Voice: ElevenLabs eleven_v4, "Teke — Documentary Narrator" (`voice-take.mp3`). Pauses trimmed to 0.14 s and sped up
  1.13x (`voice-tight.mp3`); `wt.json` holds the word timings after that edit, which the captions use.
- Music: original, synthesised by `mix.py` (D minor drone, clock tick, heartbeat, sub hits on each twist, a brighter
  lift on "Unspool", a suspense chord on the choice). Loudness-normalised to -14 LUFS.
- Render: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> the-essay-part-2`.
