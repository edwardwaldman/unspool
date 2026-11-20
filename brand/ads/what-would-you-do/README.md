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
