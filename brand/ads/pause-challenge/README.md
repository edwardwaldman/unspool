# Pause challenge ("Only 1% can pause it in the frame!")

A 3-second 3D loop (three.js). The phone drops out of the sky far away and small, spinning, fills the outline, then rushes past the camera. On exactly one frame (frame 30 of 90, at 1.0 s)
it is upright and lined up inside the red outline, which is drawn from the phone's own projected silhouette at
that frame, so it fits exactly. Only on that frame its screen shows an Unspool ad ("YOU GOT IT! · unspool ·
unspool.cc · First reel free"); every other frame shows a normal reel. After each pass a "SO CLOSE · 1 frame off!"
freeze shows it one frame late. Frame 0 and frame 89 match, so the video loops cleanly.

- `mix.py <dir>` makes `mix.wav` (a seamless 120 bpm loop, whooshes, the SO CLOSE sting).
- Render with WebGL on: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> pause-challenge`.
