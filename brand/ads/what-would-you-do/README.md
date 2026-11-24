# What would you do? (stick-figure story ad)

"What would you do if your homeboy woke up tomorrow... and turned into a girl?" The bio test is today, he still
scrolls exactly the same, but now the scroll is his bio chapter on Unspool, and he aces it.
A "what would you do" story in stick figures: flat rooms, one or two words of caption at a time,
comic sound bubbles, memory-search and before/after cards, a "WHAT WOULD YOU DO?" end card.

- `script.py` writes `web/tl.json` (the lines and their timings). There is no voice yet, so each
  line gets a natural narration length; once a voiceover exists, time the lines to it instead.
- `mix.py <dir>` makes `mix.wav` (music and sound effects; it mixes in `voice.wav` when present).
- Render with `node brand/ads/tools/render-fresh.mjs <dir> 6`, then `bash brand/ads/tools/encode.sh <dir> what-would-you-do`.

Voiceover: `voice-take.mp3` is the yelled take (ElevenLabs Charlie, eleven_v4, from `vo-prompt.txt`). `words.py` holds
its word timings (Scribe); `timing.py <this dir> web/tl.json` times every line and caption word to it, sped up 1.12x.
Make `voice.wav` with `ffmpeg -i voice-take.mp3 -af "atempo=1.12,adelay=250:all=1" -ar 24000 -ac 1 voice.wav`, then run `mix.py`.

**Quick cut (22 s):** only the hook, "Like, a FULL girl", "on the morning of the bio test!",
the couch ("He still acts exactly the same… Same scrolling."), the Unspool reveal (now at about 10 s instead of 34 s),
the test he aces, "Would you treat your homeboy exactly the same?!" and the end card. The call, memory search, nickname,
before/after, prank, "one hour", mission and "funniest part" beats are cut. Lines are joined with 0.14 s gaps and the
voice plays at 1.08x; the end line runs to where the voice really goes silent (47.49 s in the long take), not the transcript's word end, so "unspool.cc" is not clipped, with 1.8 s of end card after it. `web/tl.json` holds the final timings. `mix.py` skips the effects of lines that are not in the cut.

**20 s cut:** no name card. A loud, high-pitched "OHHHH!" plays underneath the first words of the hook
(`voice-open-moan.mp3`: pitched up about 6 semitones, boosted, about 1.3 s, mixed at 0.75x on top of the voice). Same
beats as the quick cut, with 0.1 s gaps and the voice at 1.18x so the whole ad is exactly 20 s (the voice ends at
18.46 s, then 1.54 s of end card). `web/tl.json` holds the final timings.

**Hook variants (A/B test the opening line):** same 20 s ad, same moan, new first line in the same voice (Charlie):
`hook2` "POV: your homeboy wakes up as a girl… on test day?!" (21.3 s) and `hook3` "Your homeboy woke up as a girl.
Guess what he did first?!" (20.9 s). `variants/voice-hooks.mp3` is the take with both lines; `variants/<name>-tl.json`
is that variant's timeline (copy it over `web/tl.json` and rebuild `voice.wav` with the new hook in front of the
20 s voice from "Like, a FULL girl" on). Videos: `brand/social/full-frame/unspool-ad-what-would-you-do-hook2.mp4` / `-hook3.mp4`.
