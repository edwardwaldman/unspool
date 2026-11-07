# Blender + Claude: the anime "supply and demand" explainer

The reference (a low-poly anime girl on a red-curtain stage, a price tag on a pole, one-word captions, labels with
pointer lines, hair and tie swinging) is a VRM character in Blender. `stage.py` builds that stage with your
character on it; `preview-stage.png` is a test render with a free sample model.

## To-do list

### On your computer (once, about 30 minutes)
- [ ] Install **Blender 4.2 or newer** (blender.org, free).
- [ ] Install the **VRM add-on**: Blender > Edit > Preferences > Get Extensions > search "VRM" > Install.
      (github.com/saturday06/VRM-Addon-for-Blender)
- [ ] Optional, extra bounce on any bone: **Jiggle Physics** (github.com/naelstrof/blender-jiggle-physics), zip from
      Releases > Preferences > Add-ons > Install from Disk. Bake it before rendering.
- [ ] Install **uv** (docs.astral.sh/uv) so the Claude connector can run.
- [ ] Connect **Claude to Blender** (github.com/ahujasid/mcp-for-blender):
  - Claude Code: `claude mcp add blender uvx mcp-for-blender`
  - Claude desktop app: Settings > Developer > Edit Config, add
    `"blender": {"command": "uvx", "args": ["mcp-for-blender"]}` under `mcpServers`
  - then `uvx mcp-for-blender install-addon`, open Blender, press N, **MCP for Blender** tab > **Start MCP Server**.

### The character (you)
- [ ] Make her in **VRoid Studio** (vroid.com, free) or commission one; export **VRM 1.0**. Use art you own:
      not a downloaded VRoid Hub model unless its licence allows commercial advertising.
- [ ] Put the `.vrm` file in this folder or send it to Claude in the chat.

### Build and render (Claude, with you watching in Blender)
- [ ] In Claude (connected to Blender): "Run brand/ads/blender/stage.py with my VRM". Or in Blender: Scripting tab >
      Open `stage.py` > set `VRM_PATH` > Run Script, then F12 to render a still.
- [ ] Add poses: Mixamo (mixamo.com) talking / pointing / shrugging animations, retargeted to the VRM in Blender,
      or ask Claude to keyframe poses (the script already lowers the arms and points one at the price tag).
- [ ] Render the frames (EEVEE is fast on your graphics card): `blender -b -P stage.py -- --vrm her.vrm --out renders/ --frames 1-300`.

### Finish (Claude, in the cloud)
- [ ] Upload the rendered frames (or the video) here. Claude adds the voice (`brand/ads/tools/vo.py`), the one-word
      captions and pointer labels, music, and makes the TikTok-safe MP4 (`brand/ads/tools/encode.sh`).

## Running it without a graphics card (what Claude does here)
`pip install bpy bpy-vrm-format` (Blender as a Python module, Python 3.11) and
`python stage.py --vrm her.vrm --out out --frames 1-1 --engine CYCLES --samples 16`. Cycles on a CPU takes about
20 seconds a frame at 40% size: fine for checking a shot, slow for a whole ad. Full ads render best on your computer.
