# What if your textbook turned into REELS? (20s)

Format: flat 2D "what if" short (timer chip, caption up top, live stats bar, speech bubbles), told entirely on screen.
No voiceover and a silent audio track, so any sound or trend audio can be laid over it.

The textbook -> reels transformation is the hook at 0s and then repeats a different way every ~2.5s:
1. ribbon (0): the textbook opens and a ribbon of chapter reels spools out of it
2. history (2.6): pages tear out and snap into a row of reels (knight: "follow for part 2, peasant")
3. bio (5.0): the book morphs into a phone already playing the cell reel
4. math (7.4): the word-problem train drives off the worksheet into a reel
5. notes (9.8): snap your messy notes; they become a feed you swipe
6. backpack (12.2): five books get pulled into unspool.cc and reels fountain out
7. quiz (14.8): each reel flips over into a quiz, all correct
8. end (17.5): textbook -> phone reel, "turn your textbook into reels", unspool.cc

Page counts are the story's own fictional books; the REELS counter only counts the cards shown on screen.

Render: `node brand/ads/tools/render-fresh.mjs <dir> 4` then `bash brand/ads/tools/encode.sh <dir> textbook-to-reels` (dir needs web/ and a 20s silent mix.wav).
