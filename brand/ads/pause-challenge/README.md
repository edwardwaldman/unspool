# Pause challenge ("Only 1% can pause all 3 in the frame!")

Three study things (an Unspool reel on a phone, a BIO textbook, an A+ test) fly past a hand-drawn red frame.
Each is dead centre for exactly one frame (frames 45, 120 and 195 at 30 fps), so pausing really can catch them.
Near misses freeze with "SO CLOSE"; the last one lands with "YOU DID IT!", then "Comment UNSPOOL + screenshot it".

- `mix.py <dir>` makes `mix.wav` (music and sound, no voice).
- Render with `node brand/ads/tools/render-fresh.mjs <dir> 6`, then `bash brand/ads/tools/encode.sh <dir> pause-challenge`.
