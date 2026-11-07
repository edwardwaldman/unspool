# Why you remember TikToks (and not your final): the low-poly explainer

`web/girl.js` decides who explains. With no `web/girl.vrm` it uses the built-in low-poly placeholder ("Uni").
To use your own character: export her from VRoid Studio or Blender as **VRM 1.0**, save it as
`web/girl.vrm`, and re-render. She is loaded with three-vrm, posed out of the T-pose, and gets talking (the `aa`
mouth shape follows the voice), blinking, smiling, a wave and pointing at the board. Her hair and skirt physics
(spring bones) need frames rendered in order, so render with one worker:

    node brand/ads/tools/render.mjs brand/ads/why-tiktok-sticks 1
    bash brand/ads/tools/encode.sh brand/ads/why-tiktok-sticks why-tiktok-sticks
