# Pause challenge ("Only 1% can pause it in the frame!")

A 2-second 3D loop (three.js). The phone drops out of the sky far away and small, spinning, fills the outline, then rushes past the camera. On exactly one frame (frame 30 of 60, at 1.0 s)
it is upright and lined up inside the red outline, which is drawn from the phone's own projected silhouette at
that frame, so it fits exactly. Only on that frame its screen shows an Unspool ad ("YOU GOT IT! · unspool ·
unspool.cc · First reel free"); every other frame shows a normal reel. The near misses are printed on their own frames only: "SO CLOSE · 1 frame off!" (frames 29 and 31),
"2 frames off!" (28, 32), "Almost… 3 frames off" (27, 33). No freeze; it loops cleanly.

- `mix.py <dir>` makes `mix.wav` (a seamless 120 bpm loop and whooshes).
- Render with WebGL on: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> pause-challenge`.
