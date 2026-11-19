# What would you do? (stick-figure story ad)

"What would you do if you woke up tomorrow and your textbook chapter turned into TikToks?"
A "what would you do" story in stick figures: flat rooms, one or two words of caption at a time,
comic sound bubbles, memory-search and before/after cards, a "WHAT WOULD YOU DO?" end card.

- `script.py` writes `web/tl.json` (the lines and their timings). There is no voice yet, so each
  line gets a natural narration length; once a voiceover exists, time the lines to it instead.
- `mix.py <dir>` makes `mix.wav` (music and sound effects; it mixes in `voice.wav` when present).
- Render with `node brand/ads/tools/render-fresh.mjs <dir> 6`, then `bash brand/ads/tools/encode.sh <dir> what-would-you-do`.
