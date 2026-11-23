# Addicted to studying (pov)

The "pov: how it feels getting addicted to ___ instead of doomscrolling" format: one static TikTok-style caption,
"pov: how it feels getting addicted to studying with unspool instead of doomscrolling", over six slow 2-second
"living the dream" shots in blocky 3D, then an Unspool end card (turn your notes into reels · unspool.cc). No voice.

1. Feet up at the desk, phone in one hand, fanning A+ tests with the other while tests float down.
2. Fist in the air in front of a wall of screens all going green (A+, rising grade charts), everyone cheering.
3. Golden hour at a tall window over the city, back to us.
4. Shaking the dean's hand over a scholarship certificate while people clap.
5. Walking up to the university at sunset, a professor waiting at the steps with a diploma.
6. A long candle-lit celebration dinner, everyone raising a glass (glasses of juice: nothing alcoholic shown).

`mix.py <dir>` makes `mix.wav`: an original triumphant F-major track at 120 BPM so each 2 s shot starts on a bar
(the reference's track measured as dense, bright, around F major). Render with
`node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> addicted-to-studying`.
