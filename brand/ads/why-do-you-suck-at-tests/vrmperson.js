// Your VRM character standing in for a toy() person: same scene graph slot (the toy's group), the toy's own meshes
// hidden, and the toy's poses (sit, sitphone, sitdesk, sitsad, phone, stand) re-made on the VRM's humanoid bones.
// Spring bones (hair) are left still so frames can render in any order (parallel workers).
import * as THREE from "three";
import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "./three-vrm.module.min.js";

const loader = new GLTFLoader(); loader.register((p) => new VRMLoaderPlugin(p));
let buf = null;
async function load(url) {
  buf ??= await (await fetch(url)).arrayBuffer();
  const gltf = await loader.parseAsync(buf.slice(0), "./");
  const vrm = gltf.userData.vrm; VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  return vrm;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
const aim = (from, to) => new THREE.Quaternion().setFromUnitVectors(from, to);
// arm directions in the chest's frame (+z forward, +y up, +x the character's left); the right arm mirrors x
const ARMS = {
  stand: [V(0.2, -1, 0), V(0.1, -1, 0.1)],
  sit: [V(0.2, -1, 0.15), V(0.1, -0.6, 0.8)],
  sitphone: [V(0.3, -0.45, 0.85), V(-0.35, 0.8, 0.45)],   // phone held up at face height
  phone: [V(0.3, -0.45, 0.85), V(-0.35, 0.8, 0.45)],
  sitdesk: [V(0.3, -0.55, 0.78), V(-0.25, -0.12, 1)],
  sitsad: [V(0.3, -0.45, 0.85), V(-0.7, 0.05, 0.7)],
};

export async function vrmPerson(toy, { url = "girl.vrm", height = 2.85 } = {}) {
  const vrm = await load(url);
  toy.body.visible = false; toy.legs.forEach((l) => (l.l.visible = false));   // the toy's body only: props held in its group (a phone) stay
  const wrap = new THREE.Group(); wrap.add(vrm.scene); toy.g.add(wrap);
  vrm.scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(vrm.scene); const s = height / (box.max.y - box.min.y);
  wrap.scale.setScalar(s); wrap.position.y = -box.min.y * s - 0.15;
  const B = (n) => vrm.humanoid.getNormalizedBoneNode(n);
  const hips = B("hips"), hipY = (() => { const p = new THREE.Vector3(); hips.getWorldPosition(p); toy.g.worldToLocal(p); return p.y; })();
  // rotateVRM0 turns the model 180 degrees inside vrm.scene: in bone space forward is -z and her left is -x
  const restL = new THREE.Vector3(-1, 0, 0), restR = new THREE.Vector3(1, 0, 0);
  const ex = vrm.expressionManager;
  let pose = "stand";
  const P = { vrm, wrap, pose: (name) => { pose = name; } };
  P.update = (t) => {
    const sitting = pose.startsWith("sit");
    ["hips", "spine", "chest", "neck", "head", "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg"].forEach((n) => B(n)?.rotation.set(0, 0, 0));
    // seat the hips where the toy's hips sit (1.02 above its feet)
    wrap.position.y = sitting ? -box.min.y * s - 0.15 + (1.0 - hipY) : -box.min.y * s - 0.15;
    if (sitting) for (const side of ["left", "right"]) { B(side + "UpperLeg").rotation.set(Math.PI / 2 - 0.08, 0, side === "left" ? 0.08 : -0.08); B(side + "LowerLeg").rotation.set(-(Math.PI / 2 - 0.1), 0, 0); }
    // the toy's body and head tilt carry over (sitsad slumps forward; head nods are set by the shot code)
    const lean = pose === "sitsad" ? 0.12 : pose === "sitdesk" ? 0.12 : 0;
    B("spine").rotation.x = -lean * 0.6; B("chest").rotation.x = -lean * 0.4;
    const nod = toy.head.rotation.x; B("neck").rotation.x = -nod * 0.45; B("head").rotation.x = -nod * 0.55;
    const [u, f] = ARMS[pose] ?? ARMS.stand;
    for (const [side, rest, mx] of [["left", restL, 1], ["right", restR, -1]]) {
      const d1 = new THREE.Vector3(-u.x * mx, u.y, -u.z), d2 = new THREE.Vector3(-f.x * mx, f.y, -f.z);
      const q1 = aim(rest, d1), q2 = q1.clone().invert().multiply(aim(rest, d2));
      B(side + "UpperArm").quaternion.copy(q1); B(side + "LowerArm").quaternion.copy(q2);
      B(side + "Hand")?.rotation.set(0, 0, 0);
    }
    if (ex) {
      const smile = Math.abs(toy.mouth.rotation.z - Math.PI) < 0.1;
      ex.setValue("happy", smile ? 0.55 : 0); ex.setValue("sad", smile ? 0 : 0.45);
      ex.setValue("blink", (t % 3.3) < 0.12 ? 1 : 0); ex.update();
    }
    vrm.humanoid.update();
    vrm.scene.updateMatrixWorld(true);
  };
  // a point between her hands, in the toy's local space (where a held phone goes)
  P.handsMid = () => { const a = new THREE.Vector3(), b = new THREE.Vector3(); B("leftHand").getWorldPosition(a); B("rightHand").getWorldPosition(b); return toy.g.worldToLocal(a.add(b).multiplyScalar(0.5)); };
  // where her face is, in world space (for cameras that push in on her)
  P.facePos = () => { const p = new THREE.Vector3(); B("head").getWorldPosition(p); return p.add(new THREE.Vector3(0, 0.06 * s, 0)); };
  P.update(0);
  return P;
}
