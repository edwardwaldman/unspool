# Drop the real character here

Five PNGs with transparent backgrounds, all the same size and framing (head and shoulders, about 1200 x 1680 px,
character centred, chest cut off at the bottom edge):

- `neutral.png`  mouth closed, eyes open
- `talk.png`     same pose, mouth open (it flips between neutral and talk with the voice)
- `smile.png`    eyes closed happy, mouth open smile
- `wink.png`     one eye closed
- `think.png`    eyebrows tilted, mouth flat

Only `neutral.png` is required (missing ones fall back to it). Once it is here the ad uses these instead of the drawn placeholder ("Uni"). Then re-run:
`node brand/ads/tools/render.mjs brand/ads/active-recall-explainer 4 && bash brand/ads/tools/encode.sh brand/ads/active-recall-explainer active-recall-explainer`
