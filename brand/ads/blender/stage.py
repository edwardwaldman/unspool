"""
The red-curtain stage from the anime "supply and demand" explainer, built in Blender with your VRM character on it.

Run it any of three ways:
  1. Blender (4.2+): Scripting tab -> Open stage.py -> edit VRM_PATH below -> Run Script. Then press F12 to render.
  2. Command line:    blender -b -P stage.py -- --vrm path/to/character.vrm --out renders/ --frames 1-90
  3. Headless Python: pip install bpy bpy-vrm-format, then  python stage.py --vrm ... (what Claude uses in the cloud)

It makes: a stage with red curtains and wooden floor, a round pedestal, a price tag on a pole (like "$1,000,000"),
warm spot lighting, a 1080x1920 camera that slowly pushes in, and the character imported on the pedestal with the
VRM toon shading and spring bones (hair, ears, tie) left on, so they swing when she moves.
Captions and labels are added afterwards by brand/ads/tools (or in Blender with a Text object).
"""
import argparse, math, os, sys
import bpy

VRM_PATH = ""  # set this when running from inside Blender

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument("--vrm", default=VRM_PATH)
ap.add_argument("--out", default="")
ap.add_argument("--frames", default="1-1")
ap.add_argument("--tag", default="$1,000,000")
ap.add_argument("--engine", default="EEVEE", choices=["EEVEE", "CYCLES"])
ap.add_argument("--samples", type=int, default=24)
ap.add_argument("--scale", type=int, default=50, help="resolution percent of 1080x1920")
args = ap.parse_args(argv)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# the VRM add-on: installed in Blender, or the pip package (bpy-vrm-format) when running headless (loaded after the
# reset above, which unloads add-ons)
if "vrm" not in dir(bpy.ops.import_scene):
    try:
        import addon_utils, io_scene_vrm  # noqa: F401  (enabling, not register(), creates its preferences)
        addon_utils.enable("io_scene_vrm", default_set=True, handle_error=None)
        if "vrm" not in dir(bpy.ops.import_scene): raise ImportError
    except ImportError:
        sys.exit("Install the VRM add-on: Edit > Preferences > Get Extensions > search VRM (or pip install bpy-vrm-format)")

def mat(name, color, rough=0.6, emit=None):
    m = bpy.data.materials.new(name)
    if not m.node_tree: m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = 1.0
    return m

def add(obj, m=None, name=None):
    if m: obj.data.materials.append(m)
    if name: obj.name = name
    return obj

def srgb(h):  # "#8b1a1a" -> linear rgb
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

# ---- the stage -------------------------------------------------------------------------------------------------
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0)); add(bpy.context.object, mat("floor", srgb("#6b3f22"), 0.5), "Floor")
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 1.2, 0.18)); stage = bpy.context.object; stage.scale = (12, 5, 0.36); add(stage, mat("stage", srgb("#8a5531"), 0.45), "Stage")
# curtains: a wavy sheet behind, plus side drapes (simple deform makes the folds)
curtain = mat("curtain", srgb("#7e1416"), 0.75)
def drape(x, y, w, h, folds, name):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, h / 2)); o = bpy.context.object; o.rotation_euler = (math.pi / 2, 0, 0); o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.subdivide(number_cuts=folds * 4); bpy.ops.object.mode_set(mode="OBJECT")
    for v in o.data.vertices: v.co.y += 0.18 * math.sin(v.co.x / w * folds * 2 * math.pi)
    bpy.ops.object.shade_smooth(); return add(o, curtain, name)
drape(0, 3.6, 14, 8, 14, "Curtain back")
drape(-5.6, 2.4, 3.2, 8, 4, "Curtain left"); drape(5.6, 2.4, 3.2, 8, 4, "Curtain right")
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 2.6, 7.4)); v = bpy.context.object; v.scale = (14, 0.6, 1.2); add(v, curtain, "Valance")
# the round pedestal she stands on
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=1.05, depth=0.5, location=(0, 1.0, 0.61)); add(bpy.context.object, mat("pedestal", srgb("#9e2a24"), 0.5), "Pedestal")
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=1.1, depth=0.06, location=(0, 1.0, 0.89)); add(bpy.context.object, mat("pedestal top", srgb("#c9973f"), 0.3), "Pedestal rim")
# a price tag on a pole, the reference's "$1,000,000" sign
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.025, depth=3.2, location=(-1.25, 1.0, 1.55)); add(bpy.context.object, mat("pole", srgb("#c22d2d"), 0.4), "Tag pole")
bpy.ops.mesh.primitive_cube_add(size=1, location=(-1.25, 0.98, 2.75)); tag = bpy.context.object; tag.scale = (0.95, 0.03, 0.36); add(tag, mat("tag", srgb("#f4ecd6"), 0.8), "Tag")
bpy.ops.object.text_add(location=(-1.25, 0.94, 2.67)); txt = bpy.context.object; txt.data.body = args.tag; txt.data.align_x = "CENTER"; txt.data.size = 0.2
txt.rotation_euler = (math.pi / 2, 0, 0); add(txt, mat("tag text", srgb("#b3261e"), 0.5), "Tag text")

# ---- the character ----------------------------------------------------------------------------------------------
if args.vrm and os.path.exists(args.vrm):
    bpy.ops.import_scene.vrm(filepath=os.path.abspath(args.vrm))
    arm = next((o for o in scene.objects if o.type == "ARMATURE"), None)
    if arm:
        arm.location = (0, 1.0, 0.92)
        # hair, ears and tie keep swinging: the add-on's spring bone simulation
        try: arm.data.vrm_addon_extension.spring_bone1.enable_animation = True
        except AttributeError: pass
        # out of the T-pose and into a light idle (arms down, a sway, one hand toward the price tag), so the spring
        # bones have something to react to. Bones are found through the VRM humanoid map, so any VRM works.
        from mathutils import Matrix
        def human(name):
            ext = arm.data.vrm_addon_extension
            for spec in (ext.vrm1.humanoid.human_bones, ):
                b = getattr(spec, name, None)
                if b and b.node.bone_name in arm.pose.bones: return arm.pose.bones[b.node.bone_name]
            for hb in ext.vrm0.humanoid.human_bones:  # VRM 0.x models
                if hb.bone == name.replace("_", "").lower() or hb.bone == "".join(w.capitalize() if i else w for i, w in enumerate(name.split("_"))):
                    if hb.node.bone_name in arm.pose.bones: return arm.pose.bones[hb.node.bone_name]
            return None
        bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode="POSE")
        bones = {n: human(n) for n in ("left_upper_arm", "right_upper_arm", "hips", "chest", "head")}
        def turn(pb, axis, angle):  # rotate a bone about an armature-space axis through its head
            h = pb.head.copy(); pb.matrix = Matrix.Translation(h) @ Matrix.Rotation(angle, 4, axis) @ Matrix.Translation(-h) @ pb.matrix
            bpy.context.view_layer.update()
        f0, f1 = (int(x) for x in args.frames.split("-"))
        for f in range(f0, max(f1, f0) + 1, 6):
            s_ = math.sin(f / 18)
            for pb in bones.values():
                if pb: pb.rotation_mode = "QUATERNION"; pb.rotation_quaternion = (1, 0, 0, 0)
            bpy.context.view_layer.update()
            # which way is "down" depends on the side: the arm's head-to-tail x tells us
            for side, pb in (("l", bones["left_upper_arm"]), ("r", bones["right_upper_arm"])):
                if not pb: continue
                out = 1 if (pb.tail - pb.head).x > 0 else -1
                lift = 0.55 if side == "l" else 0.0           # one arm half raised, pointing at the tag
                turn(pb, "Y", out * (1.25 - lift) * (1 if True else -1))
            if bones["hips"]: turn(bones["hips"], "Z", s_ * 0.06)
            if bones["head"]: turn(bones["head"], "X", s_ * 0.05)
            for pb in bones.values():
                if pb: pb.keyframe_insert("rotation_quaternion", frame=f)
        bpy.ops.object.mode_set(mode="OBJECT")
else:
    print("No --vrm given: rendering the empty stage")

# ---- lights and camera ------------------------------------------------------------------------------------------
def light(kind, loc, rot, energy, color, size=1.0, name="Light"):
    d = bpy.data.lights.new(name, kind); d.energy = energy; d.color = color
    if kind == "SPOT": d.spot_size = math.radians(40); d.spot_blend = 0.5
    if kind == "AREA": d.size = size
    o = bpy.data.objects.new(name, d); scene.collection.objects.link(o); o.location = loc; o.rotation_euler = rot; return o
light("SPOT", (0, -3.5, 7.5), (math.radians(40), 0, 0), 2500, (1.0, 0.86, 0.66), name="Key spot")
light("AREA", (-4, -4, 3), (math.radians(70), 0, math.radians(-45)), 400, (1.0, 0.75, 0.6), 4, "Fill")
light("AREA", (0, 4.5, 6), (math.radians(-60), 0, 0), 300, (1.0, 0.4, 0.35), 6, "Rim")
scene.world = bpy.data.worlds.new("World"); scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (*srgb("#2a0d0d"), 1); scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4

cam_data = bpy.data.cameras.new("Camera"); cam_data.lens = 40; cam = bpy.data.objects.new("Camera", cam_data); scene.collection.objects.link(cam); scene.camera = cam
f0, f1 = (int(x) for x in args.frames.split("-"))
for f, y in ((f0, -5.6), (max(f1, f0 + 1), -4.6)):  # a slow push in
    cam.location = (0, y, 1.85); cam.rotation_euler = (math.radians(88), 0, 0); cam.keyframe_insert("location", frame=f)

# ---- render settings ---------------------------------------------------------------------------------------------
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1080, 1920, args.scale
scene.frame_start, scene.frame_end = f0, f1
scene.render.fps = 30
eng = "BLENDER_EEVEE" if args.engine == "EEVEE" else "CYCLES"
try: scene.render.engine = eng
except TypeError: scene.render.engine = "BLENDER_EEVEE_NEXT"
if scene.render.engine == "CYCLES": scene.cycles.samples = args.samples; scene.cycles.use_denoising = True
else:
    try: scene.eevee.taa_render_samples = args.samples
    except AttributeError: pass
scene.view_settings.view_transform = "Standard"
scene.render.image_settings.file_format = "PNG"

if args.out:
    os.makedirs(args.out, exist_ok=True)
    scene.render.filepath = os.path.join(os.path.abspath(args.out), "f")
    if f0 == f1:
        scene.frame_set(f0); scene.render.filepath = os.path.join(os.path.abspath(args.out), f"still_{f0:04d}.png"); bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)
    print("rendered to", args.out)
