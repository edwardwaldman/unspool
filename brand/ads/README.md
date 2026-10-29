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
   Letter grades are hyphenated ("A-plus", not "A plus"): the voice engine reads a lone "A" as "uh".
   When a word still comes out wrong, give its exact pronunciation in `lines.json` under `"pron"`
   (IPA, e.g. `"pron": {"hypergamy": "haɪpˈɜːɡəmi"}` for hy-PER-guh-mee); `vo.py` swaps it in.
3. **Stay inside the TikTok / Instagram safe zone.** The posted file is the render scaled to 86%, a little
   above centre, over a blurred copy of itself (see the commit that added `brand/social/full-frame/`), so
   nothing sits under the side buttons, search bar or caption. Full-frame originals live in
   `brand/social/full-frame/`.
4. **Show the product with the standard document → reels beat.** Whenever an ad shows a document turning
   into reels, use `shared/doc-to-reels.js` (the PDF that pops in, pulses a lime ring and splits into three
   reel cards, first used in rise-and-fall) rather than a new animation. Copy it and its three reel stills
   (`shared/*.jpg`) next to the ad's `index.html` and call `docToReels(lt)` during the beat.
5. Every ad ends on unspool.cc, and only states facts that can be checked.

## Posting checklist (every ad)

1. Post to **TikTok**, **Instagram Reels** and **YouTube Shorts** (Shorts title = a searchable topic, e.g.
   "Why you blank on tests | study tips"; Shorts also show up in Google video results).
2. Caption: one comment-bait question + 3–5 study hashtags (#studytok #studytips #college …), never #fyp/#xyzbca.
3. Pin your own comment: "try it free at unspool.cc". Reply to every comment in the first hour.
4. Post 1–2 a day in study season, roughly the same time of day, so results are comparable.

