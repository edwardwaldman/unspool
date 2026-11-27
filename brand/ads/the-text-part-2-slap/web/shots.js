
// ================= "The Text · Part 2" long cut (44.1 s): girlfriend + best friend, choose-your-path =================
// Opens like The Essay · Part 2: PREVIOUSLY + the poll, and the intense option won ("walk in and confront them").
// Same storyboard as The Essay · Part 2: hook card, a twist every ~2 s, Unspool as the turn in the plot, an unresolved
// A/B choice ("comment A or B"), then the sponsor sign. Teen audience: the betrayal is holding hands and a text, nothing more.
window.DUR = 48.8;
const SH = [["poll", 0], ["door", 2.53], ["letgo", 5.3], ["hoodie", 6.6], ["anniv", 7.6], ["says", 9.3], ["shrug", 11.15], ["raise", 14.55], ["stop", 17.45], ["bond", 19.4], ["notes", 21.05], ["begged", 23.1], ["studying", 25.9], ["fury2", 27.7], ["chat", 28.35], ["final", 33.15], ["unspool", 34.5], ["locker", 41.26], ["choice", 43.71], ["end", 46.71]];
const GF = blocky({ shirt: "#2f6fd6", pants: "#3a3550", hair: "#5a3420", style: "long", skin: "#f0c7a2" }); hood(GF, "#2a62c0"); // your hoodie
const kYOU = blocky({ shirt: "#f0c419", pants: "#3a5a9a", hair: "#4a2c1a", style: "short", scale: 0.74 });
const kJAKE = blocky({ shirt: "#3bb273", pants: "#30323a", hair: "#151515", style: "spiky", skin: "#e2b08a", scale: 0.74 });
const away = (...Ps) => Ps.forEach((P) => P.g.removeFromParent());
// your notebook, in her hands
const nbTex = canvasTex(256, 320, (g) => { g.fillStyle = "#2f6fd6"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#fff"; g.fillRect(30, 70, 196, 90); g.fillStyle = "#111"; g.font = "800 34px Arc"; g.textAlign = "center"; g.fillText("CHEM", 128, 110); g.font = "800 26px Arc"; g.fillText("my notes", 128, 145); });
const notebook = new THREE.Group(); { box(0.9, 1.1, 0.08, M("#2f6fd6"), 0, 0, 0, notebook); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.06), new THREE.MeshBasicMaterial({ map: nbTex })); s.position.z = 0.05; notebook.add(s); }
const libTable = new THREE.Group(); box(2.6, 0.12, 1.1, M("#b98a5e"), 0, 1.5, 2.25, libTable); for (const sx of [-1.15, 1.15]) box(0.1, 1.5, 0.1, M("#6a4a30"), sx, 0.75, 2.25, libTable);
const library = (keep = false) => { // the classroom set dressed as the library: GF and JAKE side by side at the middle desk
  away(MS); if (!keep) away(ex1, ex2); else { cls.add(ex1.g); cls.add(ex2.g); sit(ex1, true); sit(ex2, true); } sit(GF, true); sit(JAKE, true); put(GF, cls, -0.55, 1.1, 0.15); put(JAKE, cls, 0.55, 1.1, -0.15);
  GF.pose({ la: [-0.9, 0.1], ra: [-1.0, -0.55] }); JAKE.pose({ la: [-1.0, 0.55], ra: [-0.9, -0.1] }); };

const SC = {
  raise(lt) { // you raise your hand; the whole library goes silent
    library(true); const up = ease(lt / 0.4); sit(YOU, false); put(YOU, cls, 0.1, 3.0, Math.PI); YOU.setFace("angry"); YOU.pose({ ra: [-0.3 * up, 2.4 * up], la: [0, 0.2] });
    GF.setFace("shock"); JAKE.setFace("shock"); JAKE.pose({ la: [-1.2, 0.5], ra: [-1.2, -0.5], headTilt: -0.12 }); GF.pose({ la: [-0.6, 0.2], ra: [-0.6, -0.2], headTurn: 0.3 });
    [ex1, ex2].forEach((P) => { P.setFace("shock"); P.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1], headTurn: -0.5 }); });
    const k = ease(lt / 2.9); cam(v3(mix(3.1, 2.6, k), mix(5.0, 4.7, k), mix(-1.6, -1.0, k)), v3(0.6, 3.8, 3.0), 46); return cls; },
  stop(lt) { // ...and you stop. He's not worth it.
    library(true); away(GF, JAKE); const dn = ease(lt / 0.5); sit(YOU, false); put(YOU, cls, -0.2, 3.4, Math.PI); YOU.setFace(lt > 1.0 ? "determined" : "angry"); YOU.pose({ ra: [-0.3 * (1 - dn), 2.4 * (1 - dn) - 0.06], la: [0, 0.2] });
    const k = lt / 1.95; cam(v3(-0.2, 3.5, 1.1 - k * 0.15), v3(-0.2, 3.35, 3.4), 36); return cls; },
  hoodie(lt) { // she's wearing your hoodie
    library(); GF.setFace("shock"); JAKE.setFace("worried"); GF.pose({ la: [-0.5, 0.2], ra: [-0.5, -0.2], headTurn: -0.2 });
    const k = lt / 1.1; cam(v3(-0.7, 3.0, 5.0 - k * 0.6), v3(-0.55, 2.4, 1.1), 34); return cls; },
  anniv(lt) { // flashback: the anniversary, you hand her the hoodie
    away(JAKE); sit(YOU, false); sit(GF, false); put(YOU, hall, -0.6, -1.2, 0.35); put(GF, hall, 0.6, -1.3, -0.35); YOU.setFace("happy"); GF.setFace("grin");
    YOU.pose({ ra: [-1.3, -0.2], headTilt: 0.05 }); GF.pose({ la: [-1.3, 0.2], ra: [-1.3, -0.2], headTilt: Math.sin(lt * 4) * 0.05 });
    drift(lt / 1.6, v3(0, 3.6, 6.4), v3(0, 3.5, 5.4), v3(0, 2.6, -1.2), v3(0, 2.7, -1.2), 40); return hall; },
  shrug(lt) { // he doesn't even stand up; he shrugs: "bro, it's not that deep"
    library(); GF.setFace("worried"); JAKE.setFace(lt > 1.5 ? "smug" : "neutral"); const sh = ease((lt - 1.2) / 0.3) * (lt < 3.2 ? 1 : 1 - ease((lt - 3.2) / 0.3));
    JAKE.pose({ la: [-0.3 - 0.5 * sh, 0.2 + 1.0 * sh], ra: [-0.3 - 0.5 * sh, -0.2 - 1.0 * sh], headTilt: 0.18 * sh, headTurn: 0.15 });
    const k = lt / 3.5; cam(v3(0.9, 3.2, 5.9 - k * 0.8), v3(0.55, 2.35, 1.1), 38); return cls; },
  fury(lt) { // your face
    library(true); away(GF, JAKE); sit(YOU, false); put(YOU, cls, -0.2, 3.4, Math.PI); YOU.setFace("angry"); YOU.pose({ la: [0, 0.25], ra: [0, -0.25] });
    const k = lt / 1.0; cam(v3(-0.2, 3.5, 1.0 + k * 0.1), v3(-0.2, 3.35, 3.4), 34); return cls; },
  fury2(lt) { return SC.fury(lt); },
  begged(lt) { // flashback: last month at your locker, "pls bro i'll fail without them"
    away(GF); sit(YOU, false); sit(JAKE, false); put(YOU, hall, -0.7, -1.4, 0.35); put(JAKE, hall, 0.7, -1.5, -0.35); YOU.setFace("happy"); JAKE.setFace("worried");
    JAKE.pose({ la: [-1.5, -0.35], ra: [-1.5, 0.35], headTilt: 0.12 }); hall.add(notebook); notebook.position.set(-0.25, 2.25, -0.85); notebook.rotation.set(-0.2, 0.3, 0); YOU.pose({ ra: [-1.1, -0.2] });
    drift(lt / 2.8, v3(0.2, 3.7, 6.2), v3(0.1, 3.5, 5.0), v3(0, 2.6, -1.4), v3(0, 2.7, -1.4), 40); return hall; },
  studying(lt) { // he's been studying with your notes... and your girlfriend
    library(); GF.setFace("happy"); JAKE.setFace("happy"); GF.pose({ la: [-0.9, 0.1], ra: [-0.95, -0.34], headTurn: -0.35 }); JAKE.pose({ la: [-0.95, 0.34], ra: [-0.9, -0.1], headTurn: 0.35 });
    cls.add(libTable); cls.add(notebook); notebook.position.set(0, 1.62, 2.25); notebook.rotation.set(-Math.PI / 2, 0, 0.12);
    const k = ease(lt / 2.0); cam(v3(0.2, 4.0, 7.2 - k * 1.4), v3(0, 2.3, 1.6), 36); return cls; },
  chat(lt) { // the group chat buzzes: everyone knew
    library(true); away(GF, JAKE); sit(YOU, false); put(YOU, cls, -0.2, 3.4, Math.PI); YOU.setFace(lt > 3.2 ? "angry" : lt > 2.0 ? "shock" : "worried"); YOU.pose({ ra: [-1.4, 0.35], headTilt: 0.2 });
    const k = lt / 4.9; cam(v3(-0.2, 3.7, 0.4 + k * 0.4), v3(-0.2, 3.1, 3.4), 40); return cls; },
  final(lt) { return SC.notes(lt + 2.2); },
  poll(lt) { // PREVIOUSLY: the two of them through the window, blurred behind the poll
    library(); GF.setFace("happy"); JAKE.setFace("happy"); GF.pose({ la: [-0.9, 0.1], ra: [-0.95, -0.34], headTurn: -0.35 }); JAKE.pose({ la: [-0.95, 0.34], ra: [-0.9, -0.1], headTurn: 0.35 });
    drift(lt / 2.85, v3(-6.5, 4.6, 7.5), v3(-5.8, 4.4, 6.6), v3(0, 2.6, 1.1), v3(0, 2.5, 1.1), 36); return cls; },
  door(lt) { // you push open the library door; at "every head turns" the room looks at you
    library(true); const turned = lt > 1.71, tk = ease((lt - 1.71) / 0.35);
    GF.setFace(turned ? "shock" : "happy"); JAKE.setFace(turned ? "shock" : "happy");
    GF.pose({ la: [-0.9, 0.1], ra: [-0.95, -0.34], headTurn: mix(-0.35, -0.9, tk) }); JAKE.pose({ la: [-0.95, 0.34], ra: [-0.9, -0.1], headTurn: mix(0.35, -0.9, tk) });
    [ex1, ex2].forEach((P) => { P.setFace(turned ? "shock" : "neutral"); P.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1], headTurn: -0.9 * tk }); });
    sit(YOU, false); const wk = ease(lt / 1.4); put(YOU, cls, -1.6, mix(9.4, 7.4, wk), Math.PI); const sw = Math.sin(lt * 9) * (1 - wk); YOU.pose({ ll: sw * 0.5, rl: -sw * 0.5 }); YOU.setFace("angry");
    if (lt < 1.71) drift(lt / 1.71, v3(-1.2, 4.0, 13.0), v3(-0.6, 4.2, 13.2), v3(-1.6, 2.7, 4.0), v3(-0.8, 2.6, 3.0), 44); else { const k = (lt - 1.71) / 1.06; cam(v3(-3.0 + k * 0.4, 3.6, 5.6 - k * 0.4), v3(-0.2, 2.6, 1.4), 40); }
    return cls; },
  letgo(lt) { // their hands let go
    library(); const k = ease(lt / 0.45); GF.setFace("shock"); JAKE.setFace("shock");
    GF.pose({ la: [-0.9, 0.1], ra: [mix(-0.95, -0.35, k), mix(-0.34, 0.05, k)], headTurn: -0.5 }); JAKE.pose({ la: [mix(-0.95, -0.35, k), mix(0.34, -0.05, k)], ra: [-0.9, -0.1], headTurn: 0.5 });
    cam(v3(0.2, 5.2, 5.2 - lt * 0.2), v3(0, 2.0, 1.7), 32); return cls; },
  says(lt) { // "It's not what it looks like."
    library(); GF.setFace(lt > 0.7 ? "worried" : "shock"); JAKE.setFace("worried"); GF.pose({ la: [-0.4, 0.2], ra: [-0.6, -0.3], headTurn: -0.25, headTilt: 0.06 }); JAKE.pose({ headTurn: 0.2 });
    const k = lt / 1.95; cam(v3(-1.0, 3.25, 4.7 - k * 0.4), v3(-0.55, 2.85, 1.1), 34); return cls; },
  look(lt) { // he can't even look at you
    library(); JAKE.setFace("worried"); GF.setFace("worried"); JAKE.pose({ la: [-0.5, 0.2], ra: [-0.5, -0.2], headTurn: 0.3 }); JAKE.head.rotation.x = 0.4;
    const k = lt / 1.2; cam(v3(1.2, 3.3, 4.7 - k * 0.3), v3(0.55, 2.7, 1.1), 34); return cls; },
  hook(lt) { // 4:10 PM, the hallway: her text on your phone
    away(JAKE, GF); sit(YOU, false); put(YOU, hall, 0.4, -0.8, 0.15); YOU.setFace("neutral"); YOU.pose({ ra: [-1.4, -0.35], headTilt: 0.25 });
    hall.add(phone); phone.position.set(0.15, 2.55, -0.05); phone.rotation.set(-0.5, 0.1, 0); drawText(1);
    drift(lt / 3.3, v3(0.9, 4.0, 5.6), v3(0.7, 3.8, 4.6), v3(0.3, 3.0, -0.8), v3(0.3, 3.1, -0.8), 38); return hall; },
  window(lt) { // through the library window: they're holding hands
    library(); GF.setFace("happy"); JAKE.setFace("happy"); GF.pose({ la: [-0.9, 0.1], ra: [-0.95, -0.34], headTurn: -0.35 }); JAKE.pose({ la: [-0.95, 0.34], ra: [-0.9, -0.1], headTurn: 0.35 });
    if (lt < 1.66) drift(lt / 1.66, v3(-6.5, 4.6, 7.5), v3(-5.6, 4.4, 6.4), v3(0, 2.6, 1.1), v3(0, 2.5, 1.1), 36);
    else { const k = (lt - 1.66) / 1.04; cam(v3(0.2, 5.2, 5.4 - k * 0.4), v3(0, 2.0, 1.7), 32); }
    return cls; },
  text(lt) { // her text lands; your face
    away(JAKE, GF); sit(YOU, false); put(YOU, hall, 0.4, -0.8, 0.15); YOU.setFace(lt > 1.0 ? "cry" : "worried"); YOU.pose({ ra: [-1.4, -0.35], headTilt: 0.12 });
    const k = lt / 2.0; cam(v3(0.5, 3.75, 2.6 - k * 0.4), v3(0.4, 3.45, -0.8), 34); return hall; },
  bond(lt) { // flashback: second grade, side by side at the lockers
    away(YOU, JAKE, GF); sit(kYOU, false); sit(kJAKE, false); put(kYOU, hall, -0.5, -1.2, 0.25); put(kJAKE, hall, 0.6, -1.3, -0.25); kYOU.setFace("grin"); kJAKE.setFace("grin");
    kYOU.pose({ ra: [-0.3, -1.0], headTilt: Math.sin(lt * 5) * 0.06 }); kJAKE.pose({ la: [-0.3, 1.0], headTilt: -Math.sin(lt * 5) * 0.06 });
    drift(lt / 1.8, v3(0.0, 2.8, 5.6), v3(0.0, 2.7, 4.8), v3(0, 1.9, -1.2), v3(0, 2.0, -1.2), 40); return hall; },
  notes(lt) { // then you see your notes, open on their table
    library(); GF.setFace("worried"); JAKE.setFace("worried"); GF.pose({ la: [-0.5, 0.2], ra: [-0.5, -0.2], headTurn: -0.5 }); JAKE.pose({ la: [-0.5, 0.2], ra: [-0.5, -0.2], headTurn: -0.5 });
    cls.add(libTable); cls.add(notebook); notebook.position.set(0, 1.62, 2.25); notebook.rotation.set(-Math.PI / 2, 0, 0.12);
    const k = ease(lt / 3.45); cam(v3(0.3, mix(4.6, 3.7, k), mix(6.6, 4.4, k)), v3(0, mix(2.2, 1.6, k), 2.2), 36); return cls; },
  unspool(lt) { // 11:58 PM: textbook into Unspool, reel after reel, alone
    away(JAKE, GF); sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); if (lt >= 4.05) room.add(phone);
    if (lt < 4.05) { phone.position.set(0.4, 2.85, 0.6); phone.rotation.set(-0.1, 0, 0); YOU.setFace("determined"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: 0.18 });
      if (lt < 1.5) drawCamera(lt); else drawUpload(clamp((lt - 1.8) / 2.2)); glow.intensity = 3; glow.position.set(0.4, 2.9, 1.4); cam(v3(0.7, 3.2, 4.3 - lt * 0.1), v3(0.4, 2.95, 0.6), 38); }
    else { phone.position.set(0.4, 2.2, 0.75); phone.rotation.set(-1.0, Math.PI, 0); YOU.setFace(lt > 3.3 ? "grin" : "determined"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: -0.04 });
      glow.intensity = 7; glow.position.set(0.4, 2.7, 1.1); drawPhone(clamp((lt - 4.05) / 2.6)); const k = (lt - 4.05) / 2.7; cam(v3(1.7 - k * 0.2, 3.8, 5.0 - k * 0.8), v3(0.4, 3.0, -0.3), 36); }
    return room; },
  locker(lt) { // 7:52 AM: both of them at your locker. "Can we talk?"
    sit(YOU, false); sit(GF, false); sit(JAKE, false); put(GF, hall, -0.7, -2.2, 0.35); put(JAKE, hall, 0.5, -2.3, -0.1);
    GF.setFace(lt > 1.6 ? "worried" : "neutral"); JAKE.setFace("worried"); GF.pose({ la: [-0.5, 0.2], ra: [-0.5, -0.2], headTilt: 0.12 }); JAKE.pose({ la: [0, 0.3], ra: [0, -0.3], headTilt: 0.1 });
    const k = ease(lt / 1.6); put(YOU, hall, mix(4.6, 2.0, k), -1.2, -0.7); const s = Math.sin(lt * 9) * (1 - k); YOU.pose({ ll: s * 0.5, rl: -s * 0.5 }); YOU.setFace(lt > 1.6 ? "shock" : "neutral");
    if (lt < 1.6) drift(lt / 1.6, v3(2.6, 4.2, 8.0), v3(1.8, 4.0, 6.6), v3(0.6, 2.8, -1.6), v3(0.2, 3.0, -1.6), 42);
    else { const q = (lt - 1.6) / 1.15; cam(v3(-0.1, 3.8, 2.0 - q * 0.3), v3(-0.6, 3.4, -2.2), 34); }
    return hall; },
  choice(lt) { // you between them and the exam room door
    sit(YOU, false); sit(GF, false); sit(JAKE, false); put(GF, hall, -1.8, -2.0, 0.5); put(JAKE, hall, -0.7, -2.2, 0.3); GF.setFace("worried"); JAKE.setFace("worried");
    put(YOU, hall, 1.6, -0.6, Math.sin(lt * 1.2) * 0.4); YOU.setFace(lt > 1.4 ? "determined" : "worried"); YOU.pose({ headTilt: Math.sin(lt * 1.5) * 0.04 });
    const k = lt / 2.9; cam(v3(0.3, 3.9, 7.4 - k * 0.8), v3(0.1, 2.7, -1.2), 46); return hall; },
  end(lt) { // you hold up the sign
    away(JAKE, GF); sit(YOU, false); put(YOU, hall, 0, -0.6, 0); YOU.setFace("happy"); YOU.pose({ la: [-1.45, -0.15], ra: [-1.45, 0.15] });
    hall.add(sign); sign.position.set(0, 2.05 + Math.sin(lt * 4) * 0.02 - 0.3 * (1 - outBack(lt / 0.3)), 0.75); sign.rotation.set(0, 0, Math.sin(lt * 3) * 0.02);
    cam(v3(0, 3.0, 8.4 - lt * 0.3), v3(0, 3.2, -0.2), 40); return hall; },
};
// the phone camera pointed at a textbook page (then the shutter)
function drawCamera(k) { const { g } = phoneTex.userData; g.fillStyle = "#050605"; g.fillRect(0, 0, 360, 740);
  g.save(); g.translate(180, 360); g.rotate(-0.05 + Math.sin(k * 3) * 0.01); g.fillStyle = "#f4f1e8"; g.fillRect(-140, -200, 280, 400);
  g.fillStyle = "#8a8577"; g.font = "700 13px Arc"; g.textAlign = "left"; g.fillText("CHEMISTRY · p. 212", -120, -168); g.fillStyle = "#222"; g.font = "800 22px Arc"; g.fillText("7.3 Limiting reagents", -120, -136);
  g.fillStyle = "#cfcabd"; for (let i = 0; i < 11; i++) g.fillRect(-120, -110 + i * 26, 240 - (i % 3) * 40, 8); g.restore();
  g.strokeStyle = "#b6f24a"; g.lineWidth = 5; for (const [x, y, sx, sy] of [[40, 130, 1, 1], [320, 130, -1, 1], [40, 590, 1, -1], [320, 590, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * 34); g.lineTo(x, y); g.lineTo(x + sx * 34, y); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, 640, 360, 100); g.fillStyle = "#fff"; g.beginPath(); g.arc(180, 690, 30, 0, 7); g.fill(); g.strokeStyle = "#050605"; g.lineWidth = 4; g.beginPath(); g.arc(180, 690, 24, 0, 7); g.stroke();
  g.fillStyle = "#fff"; g.font = "700 18px Arc"; g.textAlign = "center"; g.fillText("PHOTO", 180, 625); g.textAlign = "left"; phoneTex.needsUpdate = true; }
// the Unspool upload screen: the chem textbook going in, then "12 reels ready"
function drawUpload(k) { const { g } = phoneTex.userData; g.fillStyle = "#08110e"; g.fillRect(0, 0, 360, 740); g.textAlign = "left";
  g.fillStyle = "#f4f4ea"; g.font = "800 30px Arc"; g.fillText("unspool.cc", 26, 70); g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.roundRect(22, 120, 316, 150, 18); g.fill();
  g.fillStyle = "#f4f1e8"; g.fillRect(44, 146, 54, 76); g.fillStyle = "#cfcabd"; for (let i = 0; i < 6; i++) g.fillRect(50, 158 + i * 10, 40, 4); g.fillStyle = "#f4f4ea"; g.font = "700 24px Arc"; g.fillText("Photo · p. 212", 112, 180); g.fillStyle = "#9aa"; g.font = "700 20px Arc"; g.fillText("your chem textbook", 112, 212);
  g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(22, 320, 316, 14); g.fillStyle = "#b6f24a"; g.fillRect(22, 320, 316 * clamp(k * 1.25), 14);
  g.fillStyle = "#f4f4ea"; g.font = "700 24px Arc"; g.fillText(k > 0.8 ? "12 reels ready ✓" : "Turning your photo into reels…", 22, 380);
  g.textAlign = "center"; g.fillStyle = "#b6f24a"; g.font = "800 120px Arc"; g.fillText(String(Math.min(12, Math.floor(clamp(k * 1.25) * 12))), 180, 560); g.font = "800 34px Arc"; g.fillText("REELS", 180, 610); g.textAlign = "left"; phoneTex.needsUpdate = true; }
// phone lock screen with her text (drawn before the shots use it)
function drawText(k) { const { g } = phoneTex.userData; const gr = g.createLinearGradient(0, 0, 0, 740); gr.addColorStop(0, "#3a1f3a"); gr.addColorStop(1, "#1b1f3a"); g.fillStyle = gr; g.fillRect(0, 0, 360, 740);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "800 92px Arc"; g.fillText("4:10", 180, 180); g.font = "700 22px Arc"; g.fillText("Tuesday", 180, 216);
  g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect(18, 300, 324, 120, 22); g.fill(); g.textAlign = "left"; g.fillStyle = "#e86a92"; g.fillRect(36, 320, 40, 40);
  g.fillStyle = "#111"; g.font = "800 26px Arc"; g.fillText("Mia ❤️", 90, 346); g.fillStyle = "#333"; g.font = "700 22px Arc"; g.fillText("studying w jake again 📚", 36, 396); phoneTex.needsUpdate = true; }

// ---------------- overlay ----------------
const ov = document.getElementById("ov"), glc = document.getElementById("gl");
const capAt = (t) => { let c = null; for (const x of CAPS) if (t >= x[0] - 0.03) c = x; return c && t < 46.6 ? c : null; };
const card = (letter, text, col, k) => `<div style="display:flex;align-items:center;gap:18px;margin:14px 0;padding:18px 24px;border-radius:20px;background:rgba(255,255,255,.94);color:#111;font:800 40px/1.1 Arc;transform:scale(${0.6 + 0.4 * outBack(k)});opacity:${clamp(k * 3)};box-shadow:0 8px 20px rgba(0,0,0,.35)"><span style="display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:${col};color:#fff">${letter}</span>${text}</div>`;
const pick = (letter, text, col, on, k) => `<div style="display:flex;align-items:center;gap:18px;margin:14px 0;padding:18px 22px;border-radius:20px;background:${on ? col : "rgba(255,255,255,.94)"};color:${on ? "#fff" : "#111"};font:800 34px/1.1 Arc;transform:scale(${0.6 + 0.4 * outBack(k)});opacity:${clamp(k * 3)};box-shadow:0 8px 20px rgba(0,0,0,.35)"><span style="display:inline-flex;align-items:center;justify-content:center;width:58px;height:58px;flex:none;border-radius:50%;background:${on ? "rgba(255,255,255,.25)" : col};color:#fff">${letter}</span>${text}${on ? '<span style="margin-left:auto">✓</span>' : ""}</div>`;
const groupChat = (lt) => { const M = [["Maya", "wait… you didn't know??", 1.78], ["Dev", "they've been a thing since october", 2.4], ["Sam", "everyone knew 💀", 3.2], ["Priya", "for WEEKS bro", 4.25]];
  return `<div style="position:absolute;left:100px;right:100px;top:150px;background:rgba(18,20,28,.93);border-radius:28px;padding:18px 18px 8px;box-shadow:0 10px 30px rgba(0,0,0,.5);opacity:${clamp(lt * 4)}"><div style="color:#fff;font:800 26px Arc;margin:0 0 10px 6px">11th grade 🔥 <span style="color:#9aa;font-size:20px">94 members</span></div>` +
    M.filter((m) => lt >= m[2]).map((m) => `<div style="background:#2a2d3a;border-radius:18px;padding:10px 16px;margin:0 0 10px;transform:scale(${0.8 + 0.2 * outBack((lt - m[2]) / 0.2)});transform-origin:left"><div style="color:#7fb8ff;font:800 19px Arc">${m[0]}</div><div style="color:#fff;font:700 26px Arc">${m[1]}</div></div>`).join("") + `</div>`; };
const tag = (txt, lt, bg = "#ffd23f", fg = "#111") => `<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><span style="background:${bg};color:${fg};font:800 34px Arc;padding:8px 18px;border-radius:10px;opacity:${clamp(lt * 4)}">${txt}</span></div>`;
const notif = (who, msg, col, k) => `<div style="position:absolute;left:100px;right:100px;top:${150 - (1 - outBack(k)) * 60}px;opacity:${clamp(k * 4)};background:rgba(250,250,252,.96);border-radius:26px;padding:16px 20px;box-shadow:0 12px 30px rgba(0,0,0,.45);display:flex;gap:16px;align-items:center"><span style="width:56px;height:56px;border-radius:14px;background:${col};flex:none"></span><span><span style="display:block;font:800 26px Arc;color:#111">${who}</span><span style="display:block;font:700 26px Arc;color:#333">${msg}</span></span></div>`;
const FLASH = { bond: 1, anniv: 1, begged: 1 };
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i], lt = t - t0;
  glc.style.filter = FLASH[name] ? "sepia(.75) saturate(1.2) brightness(1.3) contrast(.95)" : name === "window" ? "contrast(1.05) saturate(1.05) brightness(.95)" : "contrast(1.08) saturate(1.12)";
  [YOU, JAKE, MS, GF, kYOU, kJAKE, ex1, ex2].forEach((P) => { P.g.removeFromParent(); P.head.rotation.x = 0; P.g.rotation.z = 0; P.g.position.y = 0; });
  [phone, sign, notebook, libTable].forEach((o) => o.removeFromParent()); [GF, JAKE, YOU, ex1, ex2].forEach((P) => P.pose()); lamp.intensity = 9; glow.intensity = 0;
  renderer.render(SC[name](lt), camera);
  let h = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) ${FLASH[name] ? 40 : 55}%,rgba(0,0,0,${FLASH[name] ? 0.6 : 0.4}) 100%)"></div>`;
  if (name === "window") { // looking in through the library window: frame, mullions, glass glare
    h += `<div style="position:absolute;inset:0;border:46px solid #4a3324;box-shadow:inset 0 0 0 8px #2e1f15"></div><div style="position:absolute;left:356px;top:0;bottom:0;width:10px;background:#4a3324"></div><div style="position:absolute;left:0;right:0;top:470px;height:10px;background:#4a3324"></div>`;
    h += `<div style="position:absolute;inset:46px;background:linear-gradient(120deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.16) 38%,rgba(255,255,255,0) 46%,rgba(255,255,255,0) 60%,rgba(255,255,255,.1) 64%,rgba(255,255,255,0) 68%)"></div>`; }
  if (name === "poll") { glc.style.filter = `blur(${5 - 2 * clamp(lt / 2)}px) brightness(.7) contrast(1.05)`;
    h += `<div style="position:absolute;left:0;right:0;top:150px;text-align:center"><span style="background:#111;color:#fff;font:800 34px Arc;letter-spacing:4px;padding:10px 22px;border-radius:10px">PREVIOUSLY</span></div>`;
    h += `<div style="position:absolute;left:100px;right:100px;top:250px"><div style="text-align:center;color:#fff;font:800 38px Arc;-webkit-text-stroke:6px #000;paint-order:stroke fill;margin-bottom:6px">THE TEXT · PART 1</div>${pick("A", "SLAP HIM", "#e6402e", t > 1.37, clamp(t / 0.25))}${pick("B", "WALK AWAY", "#5a6270", false, clamp((t - 0.12) / 0.25))}</div>`; }
  if (name === "bond") h += tag("2ND GRADE", lt, "#f4e6c8", "#5a4020");
  if (name === "final") h += tag("CHEM FINAL · TOMORROW 8 AM", lt, "#e6402e", "#fff");
  if (name === "hoodie" && lt > 0.5) h += tag("YOUR HOODIE", lt - 0.5, "#2f6fd6", "#fff");
  if (name === "anniv") h += tag("6-MONTH ANNIVERSARY", lt, "#f4e6c8", "#5a4020");
  if (name === "begged") { h += tag("LAST MONTH", lt, "#f4e6c8", "#5a4020"); if (lt > 0.6) h += notif("jake", "pls bro send ur chem notes 🙏 i'll fail without them", "#3bb273", (lt - 0.6) / 0.25).replace("top:", "top:90px;margin-top:"); }
  if (name === "chat") h += groupChat(lt);
  
  if (name === "locker" && lt < 1.6) h += tag("7:52 AM", lt);
  if (name === "choice") {
    h += `<div style="position:absolute;left:110px;right:110px;top:190px">${card("A", "HEAR THEM OUT", "#2bb673", clamp((lt - 0.1) / 0.25))}${card("B", "WALK PAST THEM", "#e6402e", clamp((lt - 1.25) / 0.25))}</div>`;
    if (lt > 2.2) h += `<div style="position:absolute;left:0;right:0;top:425px;text-align:center;color:#fff;font:800 42px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;transform:scale(${0.7 + 0.3 * outBack((lt - 2.2) / 0.25)})">COMMENT <span style="color:#3df07a">A</span> OR <span style="color:#ff5a4a">B</span> 👇</div>`;
  }
  // the Unspool beat, unmissable: unspool.cc up top, the textbook drops into a full-size phone and becomes reels
  const U0 = 34.5, U1 = 41.26, inU = t >= U0 - 0.2 && t < U1;
  if (inU) { const a = clamp((t - (U0 - 0.2)) / 0.3) * clamp((U1 - t) / 0.25), pop = 0.8 + 0.2 * outBack(clamp((t - (U0 - 0.2)) / 0.35));
    h += `<div style="position:absolute;inset:0;background:rgba(6,10,8,${0.66 * a})"></div>`;
    const lg = t >= 38.5 && t < 39.25 ? 1 + 0.14 * Math.sin(clamp((t - 38.5) / 0.75) * Math.PI) : 1;
    h += `<div style="position:absolute;left:0;right:0;top:92px;text-align:center;opacity:${a}"><span style="display:inline-block;transform:scale(${lg});background:#b6f24a;color:#08110e;font:800 42px Arc;padding:8px 24px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45)">unspool<span style="opacity:.55">.cc</span></span><div style="margin-top:10px;color:#fff;font:800 24px Arc;letter-spacing:1px">PHOTO → REELS</div></div>`;
    h += `<div id="ph" style="position:absolute;left:218px;top:205px;width:284px;height:560px;border-radius:38px;background:#000;border:5px solid #2a2a2a;box-shadow:0 20px 50px rgba(0,0,0,.6);overflow:hidden;opacity:${a};transform:scale(${pop});transform-origin:50% 50%"></div>`;
    if (t >= 35.95 && t < 36.35) h += `<div style="position:absolute;inset:0;background:#fff;opacity:${1 - (t - 35.95) / 0.4}"></div>`; }
  const c = capAt(t);
  if (c && c[1]) { const k = clamp((t - c[0]) / 0.12); h += `<div style="position:absolute;left:90px;right:90px;top:800px;text-align:center;transform:scale(${0.75 + 0.25 * outBack(k)})"><span style="color:#fff;font:800 62px/1.1 Arc;-webkit-text-stroke:12px #000;paint-order:stroke fill;text-shadow:0 5px 0 #000">${c[1]}</span></div>`; }
  if (name === "end") h += `<div style="position:absolute;left:0;right:0;top:190px;text-align:center;color:#fff;font:800 44px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;opacity:${clamp((lt - 0.2) * 4)}">FOLLOW FOR PART 3</div>`;
  ov.innerHTML = h;
  if (inU) { const cv = phoneTex.userData.c; cv.style.cssText = "width:100%;height:100%;display:block"; document.getElementById("ph").appendChild(cv); }
};
window.renderAt(0); setTimeout(() => (window.ready = true), 80);
