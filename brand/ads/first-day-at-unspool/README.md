# First day at Unspool support ("my finger slipped")

A blocky-3D comedy story in the "first day at the call centre, my finger slipped" format, told by an Indian
narrator (ElevenLabs "Aakash - Young, Natural, Indian", eleven_v4). One slip turns one reel into a whole textbook of
reels; it escalates from one student to the class, the school, the city and the country, the bosses stack up behind
his chair, his mum calls ("beta, very good, first day only!"), only nine pages are left (a samosa recipe reel), and
everyone gets promoted. It ends on the same slip, so it loops. One yellow word of caption at a time.

- `voice-take.mp3` is the full take; `voice-pickup-unspool.mp3` re-says "My first day at Un-spool support" (the take
  sounded like "Unschool"), spliced over 2.52–4.245 s at the same length so every timing holds.
- `web/tl.json` has the word timings (ElevenLabs Scribe) grouped into the 25 shots.
- `mix.py <dir>` makes `mix.wav` (comedy bed + effects under the voice; needs `voice.wav`).
- Render: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> first-day-at-unspool`.
