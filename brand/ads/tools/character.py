# Turn the anime pictures you send into the character files the explainer ads use.
#   .venv/bin/python brand/ads/tools/character.py <folder of pictures> <ad>/web/char
# Name the pictures by expression: neutral, talk, smile, wink, think (any image type; only neutral is required).
# Each picture gets its background removed (rembg, isnet-anime model, made for anime art), is trimmed to the
# character, and is placed on a 1200x1680 transparent canvas with the head at the same height in every file,
# so swapping between expressions doesn't jump.
import os, sys
from PIL import Image
os.environ.setdefault("U2NET_HOME", os.path.join(os.path.dirname(os.path.abspath(__file__)), ".models", "rembg"))
from rembg import new_session, remove

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
session = new_session("isnet-anime")
W, H = 1200, 1680
done = []
for name in sorted(os.listdir(src)):
    stem, ext = os.path.splitext(name)
    if stem.lower() not in ("neutral", "talk", "smile", "wink", "think") or ext.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
        continue
    im = Image.open(os.path.join(src, name)).convert("RGBA")
    # keep artwork that already has a transparent background; cut out the rest
    if im.getextrema()[3][0] == 255:
        im = remove(im, session=session, post_process_mask=True)
    box = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    if not box: print(f"skipped {name}: nothing found"); continue
    im = im.crop(box)
    # fit the width to 92% of the canvas, top of the head 8% from the top, anything below the frame is cut
    s = min(W * 0.92 / im.width, H * 1.4 / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((W - im.width) // 2, round(H * 0.08)))
    canvas.save(os.path.join(dst, f"{stem.lower()}.png"))
    done.append(stem.lower())
print("made:", ", ".join(done) or "nothing (name the files neutral.png, talk.png, smile.png, wink.png, think.png)")
