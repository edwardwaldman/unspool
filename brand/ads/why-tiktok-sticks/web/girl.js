// The explainer's girl. If web/girl.vrm exists (your character, exported from VRoid or Blender as VRM), it is
// loaded with three-vrm and used: talking (mouth shapes from the voice), blinking, a wave and pointing. Otherwise a
// built-in low-poly anime girl ("Uni") stands in, with the same controls. Both take update(t, state):
//   state = { talk 0..1, blink 0..1, smile 0..1, pose: "idle" | "wave" | "point" | "think", dt }
import * as THREE from "three";

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...o });
const mesh = (g, m, p, parent) => { const x = new THREE.Mesh(g, m); x.castShadow = x.receiveShadow = true; if (p) x.position.copy(p); parent.add(x); return x; };
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

export async function loadGirl(scene) {
  const has = await fetch("girl.vrm", { method: "HEAD" }).then((r) => r.ok).catch(() => false);
  if (has) {
    try { return await vrmGirl(scene); } catch (e) { console.warn("girl.vrm failed to load, using the placeholder", e); }
  }
  return placeholderGirl(scene);
}

// ---------------- your VRM character ----------------
async function vrmGirl(scene) {
  const { GLTFLoader } = await import("./jsm/loaders/GLTFLoader.js");
  const { VRMLoaderPlugin, VRMUtils } = await import("./three-vrm.module.min.js");
  const loader = new GLTFLoader(); loader.register((p) => new VRMLoaderPlugin(p));
  const gltf = await loader.loadAsync("girl.vrm"); const vrm = gltf.userData.vrm;
  VRMUtils.rotateVRM0(vrm); vrm.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const root = new THREE.Group(); root.add(vrm.scene); scene.add(root);
  // scale to the placeholder's height (about 1.6 units to the top of the head)
  const box = new THREE.Box3().setFromObject(vrm.scene); const s = 1.62 / (box.max.y - box.min.y); root.scale.setScalar(s);
  const bone = (n) => vrm.humanoid.getNormalizedBoneNode(n);
  const ex = vrm.expressionManager;
  return {
    root, kind: "vrm",
    update(t, st) {
      const L = bone("leftUpperArm"), R = bone("rightUpperArm"), LL = bone("leftLowerArm"), RL = bone("rightLowerArm"), head = bone("head"), spine = bone("spine");
      // arms down by default (VRM rest pose is a T-pose)
      // arms down by default (VRM rest pose is a T-pose; in normalized bones +z lifts the right arm, -z the left)
      L.rotation.set(0, 0, -1.2); R.rotation.set(0, 0, 1.2); LL.rotation.set(0, 0, 0); RL.rotation.set(0, 0, 0);
      if (st.pose === "point") { L.rotation.set(0, 0.5, -0.15 + Math.sin(t * 2) * 0.04); LL.rotation.set(0, 0.15, 0); }
      if (st.pose === "wave") { R.rotation.set(0, 0, -0.9); RL.rotation.set(0, 0, -0.6 + Math.sin(t * 9) * 0.4); }
      if (st.pose === "think") { R.rotation.set(0, 0, 1.0); RL.rotation.set(0, 2.0, 0); }
      head.rotation.set(Math.sin(t * 1.3) * 0.04, Math.sin(t * 0.7) * 0.08, Math.sin(t * 1.1) * 0.03 + (st.pose === "think" ? 0.15 : 0));
      spine.rotation.set(0, 0, Math.sin(t * 1.6) * 0.02);
      if (ex) { ex.setValue("aa", st.talk * 0.8); ex.setValue("blink", st.blink); ex.setValue("happy", st.smile); }
      vrm.update(st.dt ?? 1 / 30);   // spring bones (hair, skirt): render frames in order for these to swing
    },
  };
}

// ---------------- the placeholder: a low-poly anime girl ----------------
function placeholderGirl(scene) {
  const root = new THREE.Group(); scene.add(root);
  const SKIN = "#f6d9c6", HAIR = "#2a2f5a", HAIR2 = "#3b4380", SHIRT = "#f4f3ee", NAVY = "#24305e", RED = "#d8414a", SOCK = "#1d2340";
  const skin = M(SKIN), hair = M(HAIR, { roughness: 0.5 }), hair2 = M(HAIR2, { roughness: 0.5 }), shirt = M(SHIRT), navy = M(NAVY), red = M(RED), sock = M(SOCK), shoe = M("#3a2a22");
  // legs, skirt, body
  const hips = new THREE.Group(); hips.position.y = 0.72; root.add(hips);
  [-1, 1].forEach((s) => { mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.5, 6), skin, v3(s * 0.08, -0.35, 0), hips);
    mesh(new THREE.CylinderGeometry(0.058, 0.052, 0.26, 6), sock, v3(s * 0.08, -0.52, 0), hips);
    mesh(new THREE.BoxGeometry(0.1, 0.07, 0.18), shoe, v3(s * 0.08, -0.69, 0.03), hips); });
  const skirt = mesh(new THREE.ConeGeometry(0.27, 0.3, 10, 1, true), navy, v3(0, -0.08, 0), hips); skirt.material.side = THREE.DoubleSide;
  const chest = new THREE.Group(); chest.position.y = 0.08; hips.add(chest);
  mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.36, 7), shirt, v3(0, 0.15, 0), chest);
  const collar = mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.08, 7), navy, v3(0, 0.33, -0.01), chest); collar.scale.z = 0.9;
  mesh(new THREE.OctahedronGeometry(0.06, 0), red, v3(-0.035, 0.27, 0.15), chest).scale.set(1, 0.6, 0.4);
  mesh(new THREE.OctahedronGeometry(0.06, 0), red, v3(0.035, 0.27, 0.15), chest).scale.set(1, 0.6, 0.4);
  mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.08, 6), skin, v3(0, 0.38, 0), chest);
  // arms: shoulder -> elbow -> hand
  const arm = (s) => { const sh = new THREE.Group(); sh.position.set(s * 0.19, 0.3, 0); chest.add(sh);
    mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.24, 6), shirt, v3(0, -0.12, 0), sh);
    const el = new THREE.Group(); el.position.y = -0.24; sh.add(el);
    mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.22, 6), skin, v3(0, -0.11, 0), el);
    mesh(new THREE.IcosahedronGeometry(0.04, 0), skin, v3(0, -0.24, 0), el); return { sh, el }; };
  const LA = arm(1), RA = arm(-1);   // LA is on the girl's left (screen right when she faces us)
  // head
  const head = new THREE.Group(); head.position.y = 0.58; chest.add(head);
  const skull = mesh(new THREE.IcosahedronGeometry(0.2, 1), skin, v3(0, 0.12, 0), head); skull.scale.set(1, 1.05, 0.95);
  // the face: a canvas on the front with big anime eyes, blinking, a mouth that moves with the voice
  const fc = document.createElement("canvas"); fc.width = 256; fc.height = 256; const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const face = mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: ft, transparent: true, toneMapped: false }), v3(0, 0.09, 0.205), head); face.castShadow = false; face.renderOrder = 2;
  function drawFace(talk, blink, smile) {
    const c = fc.getContext("2d"); c.clearRect(0, 0, 256, 256);
    [[84, 1], [172, -1]].forEach(([x, s]) => {
      if (blink > 0.5 || smile > 0.6) { c.strokeStyle = "#2a2f5a"; c.lineWidth = 7; c.beginPath(); if (smile > 0.6) c.arc(x, 126, 20, Math.PI * 1.15, Math.PI * 1.85); else { c.moveTo(x - 24, 120); c.quadraticCurveTo(x, 132, x + 24, 120); } c.stroke(); return; }
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, 120, 24, 30, 0, 0, 7); c.fill();
      const g = c.createLinearGradient(0, 92, 0, 150); g.addColorStop(0, "#1e2a6e"); g.addColorStop(1, "#5a78e0"); c.fillStyle = g; c.beginPath(); c.ellipse(x, 124, 17, 25, 0, 0, 7); c.fill();
      c.fillStyle = "#101433"; c.beginPath(); c.ellipse(x, 126, 8, 12, 0, 0, 7); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x - 6 * s, 112, 6, 8, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + 6 * s, 138, 3, 0, 7); c.fill();
      c.strokeStyle = "#2a2f5a"; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 28, 104); c.quadraticCurveTo(x, 84, x + 28, 102); c.stroke();
    });
    c.fillStyle = "rgba(240,130,140,.45)"; c.beginPath(); c.ellipse(64, 166, 18, 9, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(192, 166, 18, 9, 0, 0, 7); c.fill();
    const o = Math.max(talk, smile * 0.4);
    if (o > 0.12) { c.fillStyle = "#a83a4c"; c.beginPath(); c.ellipse(128, 188, 11 + o * 4, 3 + o * 12, 0, 0, 7); c.fill(); }
    else { c.strokeStyle = "#a83a4c"; c.lineWidth = 4; c.beginPath(); c.moveTo(118, 186); c.quadraticCurveTo(128, 192, 138, 186); c.stroke(); }
    ft.needsUpdate = true;
  }
  // hair: a cap, spiky bangs, long back hair, twin tails that sway
  const cap = mesh(new THREE.IcosahedronGeometry(0.215, 1), hair, v3(0, 0.2, -0.06), head); cap.scale.set(1.04, 0.92, 0.95);
  for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2, b = mesh(new THREE.ConeGeometry(0.048, 0.13, 4), i % 2 ? hair2 : hair, v3(Math.sin(a) * 0.17, 0.25, Math.cos(a) * 0.15 + 0.01), head); b.rotation.set(Math.PI + 0.5, 0, -a * 0.6); }
  const back = mesh(new THREE.BoxGeometry(0.4, 0.5, 0.14), hair, v3(0, -0.06, -0.12), head); back.geometry.translate(0, 0, 0);
  const tails = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.21, 0.22, -0.05); head.add(g);
    mesh(new THREE.OctahedronGeometry(0.04, 0), red, v3(0, 0, 0), g);   // a red hair tie
    const segs = []; let parent = g;
    for (let k = 0; k < 4; k++) { const sg = new THREE.Group(); sg.position.y = k ? -0.13 : -0.02; parent.add(sg);
      mesh(new THREE.ConeGeometry(0.075 - k * 0.012, 0.16, 5), k % 2 ? hair2 : hair, v3(0, -0.07, 0), sg).rotation.x = Math.PI; segs.push(sg); parent = sg; }
    return { g, segs, s }; });
  root.traverse((o) => { if (o.isMesh && o !== face) o.castShadow = true; });
  return {
    root, kind: "placeholder",
    update(t, st) {
      drawFace(st.talk, st.blink, st.smile);
      // breathing and a little bounce
      hips.position.y = 0.72 + Math.sin(t * 2.4) * 0.006; chest.rotation.z = Math.sin(t * 1.5) * 0.025;
      head.rotation.set(Math.sin(t * 1.3) * 0.05 + st.talk * 0.04, Math.sin(t * 0.7) * 0.1, Math.sin(t * 1.1) * 0.04 + (st.pose === "think" ? 0.18 : 0));
      // arms
      LA.sh.rotation.set(0, 0, 0.12); RA.sh.rotation.set(0, 0, -0.12); LA.el.rotation.set(0, 0, 0); RA.el.rotation.set(0, 0, 0);
      if (st.pose === "point") { LA.sh.rotation.set(-0.3, 0, 2.0 + Math.sin(t * 2) * 0.05); LA.el.rotation.set(0, 0, 0.2); }
      if (st.pose === "wave") { RA.sh.rotation.set(0, 0, -2.5); RA.el.rotation.set(0, 0, -0.5 + Math.sin(t * 9) * 0.45); }
      if (st.pose === "think") { RA.sh.rotation.set(-1.1, 0, -0.5); RA.el.rotation.set(-1.9, 0, 0.6); }
      // twin tails swing a beat behind the head (a simple, frame-independent spring)
      tails.forEach(({ segs, s }) => segs.forEach((sg, k) => { sg.rotation.z = s * (0.18 + Math.sin(t * 2.2 - k * 0.6) * 0.09 * (k + 1)) ; sg.rotation.x = Math.sin(t * 1.7 - k * 0.5) * 0.06 * (k + 1); }));
    },
  };
}
