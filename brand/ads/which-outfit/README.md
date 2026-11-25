# Which outfit looks better? (86 s)

Same premise and storyboard as the reference we were given (your girlfriend holds up two dresses; every answer you give is
wrong; a deadpan second-person narrator; living room, sofa, coffee table, close-ups of your face between wide shots), with
one new beat that brings in Unspool naturally: the twenty minutes she spends changing, you drop your bio chapter into
Unspool, watch the reels and ace the quiz. Ending: "You went through an entire interrogation to find out your vote doesn't
count. But you know mitosis now, so the night wasn't a total loss." Then you hold the Made with UNSPOOL.CC sign.

- Voice: ElevenLabs eleven_v4 "James" (deadpan). Strong swears are bleeped for a teen audience (`voice-bleeped.mp3`);
  captions show F***ING. Pauses kept as recorded: the deadpan timing is the joke.
- Captions: `caps.py` (reference style: up to 5 words, white with a black outline, one key word on a red box).
- Music: `mix.py` (original lo-fi loop; lift during the Unspool beat; a stop on "never mind").
- Render: `node brand/ads/tools/render-fresh.mjs <dir> 6 --gl`, then `bash brand/ads/tools/encode.sh <dir> which-outfit`.
