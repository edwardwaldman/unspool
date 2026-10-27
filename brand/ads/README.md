# Ad sources

Each folder holds the source for one ad in `brand/social/unspool-ad-<name>.mp4`: the page that is rendered
frame by frame (`index.html`), the voiceover script (`lines.json` or `tts.py`) and the sound mix (`mix*.py`).

## Rules for every ad

1. **The hook matches the ad.** The opening title and first line must promise exactly what the rest of the
   ad pays off. If the ad explains why rereading fails, the hook names rereading; if it tells the Netflix
   story, the hook is the Netflix moment. Check the hook against the payoff before rendering.
2. **Years are said the way people say them.** "nineteen eighty-five", "two thousand four", "twenty ten",
   never "nineteen hundred eighty-five". `vo.py` rewrites four-digit years automatically (`say_years`); any
   other voice script must spell years out the same way.
3. **Stay inside the TikTok / Instagram safe zone.** The posted file is the render scaled to 86%, a little
   above centre, over a blurred copy of itself (see the commit that added `brand/social/full-frame/`), so
   nothing sits under the side buttons, search bar or caption. Full-frame originals live in
   `brand/social/full-frame/`.
4. Every ad ends on unspool.cc, and only states facts that can be checked.
