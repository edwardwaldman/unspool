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
6. **Every ad has a person in it.** Use Maya, the recurring student (`shared/maya-*.png` cut-outs, or the 3D toy in
   `life-of-a-textbook/world.js`), or another real character, never only phones, cards and text.
7. **Open on a real hook, not a list.** A question, a confession or a story line ("Test tomorrow. Zero notes. Here's
   what I did.", "This is the laziest way to actually understand your homework."), never a run of red negatives.

## Posting checklist (every ad)

1. Post to **TikTok**, **Instagram Reels** and **YouTube Shorts** (Shorts title = a searchable topic, e.g.
   "Why you blank on tests | study tips"; Shorts also show up in Google video results).
2. Caption: one comment-bait question + 3–5 study hashtags (#studytok #studytips #college …), never #fyp/#xyzbca.
3. Pin your own comment: "try it free at unspool.cc". Reply to every comment in the first hour.
4. Post 1–2 a day in study season, roughly the same time of day, so results are comparable.


### YouTube Shorts tags (paste into the Tags field; 497 of YouTube's 500 characters)

```
study tips,studytok,how to study,study hacks,studying,exam tips,finals week,how to study for exams,study tips for students,college study tips,how to remember what you study,active recall,spaced repetition,forgetting curve,retrieval practice,study smarter,study techniques,memory tips,learning tips,study motivation,ai study app,ai study tool,study app,textbook to video,pdf to video,notes to video,study reels,unspool,unspool app,student,college
```

## Making an ad (tools)

Everything needed is in `brand/ads/tools/`:

1. `bash brand/ads/tools/setup.sh` once (Python voice tools, the free Kokoro voice model, Playwright check).
2. Write `<ad>/lines.json` (the script) and `<ad>/web/index.html` (the page: sets `window.DUR`, `window.ready`, and
   draws any moment with `window.renderAt(seconds)`). Copy an existing ad as a start.
3. Voice: `brand/ads/tools/.venv/bin/python brand/ads/tools/vo.py <ad>` → `voice.wav` + `web/tl.json` (line timings).
   `"engine": "elevenlabs"` with an ElevenLabs voice id uses ElevenLabs (real shouting, acting; `eleven_v3` reads tags
   like `[shouting]`, `[whispers]`, `[laughs]` in the line); without a key it falls back to Kokoro automatically.
4. Sound: a `mix.py` per ad (music + effects under `voice.wav`) → `mix.wav`.
5. Frames: `node brand/ads/tools/render.mjs <ad> 4` → `<ad>/frames/`.
6. Video: `bash brand/ads/tools/encode.sh <ad> <name>` → `brand/social/unspool-ad-<name>.mp4` (safe zone) and the
   full-frame copy.

**ElevenLabs:** add your API key to the cloud environment as a network secret for `api.elevenlabs.io` (header
`xi-api-key`), or locally as `ELEVENLABS_API_KEY`. Pick voice ids in the ElevenLabs Voice Library.

## The anime explainer character (your pictures)

The explainer ads (`active-recall-explainer` and copies of it) animate a still picture of a character: it bobs and
breathes, flips between expressions and "talks" with the voice. Put the pictures in a folder named by expression
(`neutral`, `talk`, `smile`, `wink`, `think`; only `neutral` is required) and run
`brand/ads/tools/.venv/bin/python brand/ads/tools/character.py <folder> brand/ads/<ad>/web/char`. It removes the
background (rembg's anime model), trims and lines up every picture on the same 1200x1680 canvas. Then render.
Use art you own or have commercial rights to.

## Keys

- **ElevenLabs** (better voices): cloud environment settings, network secret for `api.elevenlabs.io`, header
  `xi-api-key`; or an environment variable `ELEVENLABS_API_KEY`.
- **Anthropic** (the reel-critic agent generating fresh reels with the real writer, `scripts/reel-lab/gen.ts`): an
  environment variable `ANTHROPIC_API_KEY` in the cloud environment settings (Anthropic hosts can't take a network
  secret). Use a separate, spend-limited key from the one the live site uses.
