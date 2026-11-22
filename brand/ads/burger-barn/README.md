# Burger Barn

Blocky-3D deadpan story in the "everyone in town parties except me — HUSS!" format: one yellow word of caption at a
time, a flat narrator, a slam on every "HUSS!", and a top-down hands-eye view of each wrap.

He trains to wrap burgers for a job at Burger Barn while the town parties, wraps everything (the plate, the neighbor's
cat, the manager's clipboard and tie), and fails the interview because he can't cook. **Unspool slips in at the turn:**
"I put the whole cookbook into Unspool. Now it is reels and quizzes." (a phone shows a cookbook reel, then a quiz).
He gets hired and feeds the whole town at midnight. End card: turn any book into reels · unspool.cc. The unspool.cc
badge sits in the top-left corner the whole time.

- `lines.json` is the script, one shot per line. `voice-take.mp3` is the ElevenLabs take (voice "Teke — Documentary
  Narrator", eleven_v4). The voice track tightens every pause to 0.25 s (1.0 s kept before "Almost"), plays at 1.06x and
  starts 0.15 s in; `web/tl.json` already holds the word times after that.
- `mix.py <dir>` makes `mix.wav` from `voice.wav` (party groove that is muffled when we are inside, HUSS thumps,
  folds, clock ticks, quiz ding).
- Render: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> burger-barn`.
