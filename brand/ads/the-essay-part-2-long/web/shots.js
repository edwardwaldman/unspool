
// ================= "The Essay · Part 2" long cut (77.6 s): more beats, more feeling =================
// Betrayal -> second betrayal (the deleted file) -> injustice -> childhood flashback -> his smile -> the night with Unspool
// -> 2 AM text -> his confession (now you feel for him) -> the standoff -> both futures -> unresolved A/B choice -> sign.
const SH = [["poll", 0], ["tell", 2.75], ["callover", 7.61], ["quote", 10.29], ["laptop", 12.84], ["password", 17.92], ["teacher", 21.04],
  ["gossip", 29.04], ["bond", 36.41], ["smile", 41.95], ["night", 44.0], ["reread", 49.51], ["unspool", 57.49], ["quiz", 63.29], ["text", 68.87], ["locker", 72.91],
  ["period", 81.55], ["explain", 85.94], ["quiet", 90.04], ["choice", 94.42], ["end", 97.1]];

// kids for the flashbacks
const kYOU = blocky({ shirt: "#f0c419", pants: "#3a5a9a", hair: "#4a2c1a", style: "short", scale: 0.74 });
const kJAKE = blocky({ shirt: "#3bb273", pants: "#30323a", hair: "#151515", style: "spiky", skin: "#e2b08a", scale: 0.74 });
const ex3 = blocky({ shirt: "#e07a5f", hair: "#3a2416", style: "short", skin: "#c68c64" }); sit(ex3, true); put(ex3, cls, 0, 4.7, 0);
const ex4 = blocky({ shirt: "#81b29a", hair: "#151515", style: "bun", skin: "#8d5a3b" }); sit(ex4, true);
const away = (...Ps) => Ps.forEach((P) => { P.g.removeFromParent(); });

// laptop with a live screen
const lapTex = canvasTex(640, 420, () => {});
const drawLaptop = (mode, k = 0) => { const { g } = lapTex.userData; g.fillStyle = "#f3f5f8"; g.fillRect(0, 0, 640, 420);
  if (mode === "game") { const sky = g.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, "#7cc4ff"); sky.addColorStop(1, "#cdeeff"); g.fillStyle = sky; g.fillRect(0, 0, 640, 420);
    for (let x = 0; x < 640; x += 40) { const h = 4 + Math.floor(rnd(x) * 3); for (let y = 0; y < h; y++) { g.fillStyle = y === h - 1 ? "#5cb85c" : "#8b5a2b"; g.fillRect(x, 420 - (y + 1) * 40, 38, 38); } }
    g.fillStyle = "#fff"; g.font = "800 30px Arc"; g.fillText("PLAYER 2 JOINED", 190, 60); lapTex.needsUpdate = true; return; }
  g.fillStyle = "#dde3ea"; g.fillRect(0, 0, 640, 44); g.fillStyle = "#333"; g.font = "700 22px Arc"; g.fillText("Documents", 24, 30);
  const row = (y, name, dim) => { g.globalAlpha = dim; g.fillStyle = "#4a7bd0"; g.fillRect(150, y - 26, 28, 36); g.fillStyle = "#222"; g.font = "800 32px Arc"; g.fillText(name, 192, y); g.globalAlpha = 1; };
  row(100, "bio_notes.pdf", 1); row(160, "spanish_vocab.docx", 1);
  if (mode === "docs") row(220, "ESSAY_FINAL.docx", 1);
  else { g.fillStyle = "rgba(230,64,46,.12)"; g.fillRect(16, 186, 608, 52); row(220, "ESSAY_FINAL.docx", 0.35); g.strokeStyle = "#e6402e"; g.lineWidth = 4; g.beginPath(); g.moveTo(186, 210); g.lineTo(186 + 300 * clamp(k * 3), 210); g.stroke();
    g.fillStyle = "#e6402e"; g.font = "800 30px Arc"; g.fillText("DELETED", 250, 268); }
  if (mode === "edited") { g.fillStyle = "#fff"; g.strokeStyle = "#c9ced6"; g.lineWidth = 3; g.fillRect(150, 280, 340, 130); g.strokeRect(150, 280, 340, 130);
    g.fillStyle = "#555"; g.font = "700 22px Arc"; g.fillText("Last edited by", 176, 314); g.fillStyle = "#e6402e"; g.font = "800 40px Arc"; g.fillText("jake_m", 176, 362); g.fillStyle = "#777"; g.font = "700 20px Arc"; g.fillText("yesterday, 11:02 PM", 176, 394); }
  lapTex.needsUpdate = true; };
const laptop = new THREE.Group(); const lapLid = new THREE.Group();
{ box(1.7, 0.07, 1.15, M("#9aa3ad", { metalness: 0.4, roughness: 0.4 }), 0, 0.035, 0, laptop); laptop.add(lapLid); lapLid.position.set(0, 0.07, -0.55);
  box(1.7, 1.1, 0.05, M("#9aa3ad", { metalness: 0.4, roughness: 0.4 }), 0, 0.55, 0, lapLid); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 1.0), new THREE.MeshBasicMaterial({ map: lapTex })); s.position.set(0, 0.55, 0.03); lapLid.add(s); }

// phone lock screen with the 2 AM text
const drawText = (k) => { const { g } = phoneTex.userData; const gr = g.createLinearGradient(0, 0, 0, 740); gr.addColorStop(0, "#1b1f3a"); gr.addColorStop(1, "#3a2a5a"); g.fillStyle = gr; g.fillRect(0, 0, 360, 740);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "800 92px Arc"; g.fillText("2:00", 180, 180); g.font = "700 22px Arc"; g.fillText("Thursday", 180, 216);
  const a = clamp(k * 4); g.globalAlpha = a; g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.roundRect(18, 300 - (1 - a) * 30, 324, 120, 22); g.fill();
  g.textAlign = "left"; g.fillStyle = "#3bb273"; g.fillRect(36, 320 - (1 - a) * 30, 40, 40); g.fillStyle = "#111"; g.font = "800 26px Arc"; g.fillText("Jake", 90, 346 - (1 - a) * 30);
  g.fillStyle = "#333"; g.font = "700 24px Arc"; g.fillText("you up? we need to talk", 36, 396 - (1 - a) * 30); g.globalAlpha = 1; phoneTex.needsUpdate = true; };

const drawQuiz = (lt) => { const { g } = phoneTex.userData; g.fillStyle = "#08110e"; g.fillRect(0, 0, 360, 740); g.textAlign = "left";
  if (lt > 5) { g.fillStyle = "#b6f24a"; g.textAlign = "center"; g.font = "800 112px Arc"; g.fillText("12/12", 180, 330); g.font = "800 34px Arc"; g.fillStyle = "#f4f4ea"; g.fillText("Every question ✓", 180, 400); phoneTex.needsUpdate = true; return; }
  const retry = lt > 1.9; g.fillStyle = "#b6f24a"; g.font = "800 26px Arc"; g.fillText(retry ? "QUIZ · TRY AGAIN" : "QUIZ · 7 OF 12", 26, 80);
  g.fillStyle = "#f4f4ea"; g.font = "800 32px Arc"; ["Why did Britain", "industrialise first?"].forEach((l, j) => g.fillText(l, 26, 140 + j * 42));
  const opts = ["Better weather", "Coal, capital, colonies", "More people"]; const pick = retry ? 1 : 0, show = retry ? lt > 2.6 : lt > 0.9;
  opts.forEach((o, j) => { const y = 260 + j * 96; const on = show && j === pick; g.fillStyle = on ? (retry ? "#2bb673" : "#e6402e") : "rgba(255,255,255,.1)"; g.beginPath(); g.roundRect(22, y, 316, 76, 16); g.fill();
    g.fillStyle = "#f4f4ea"; g.font = "700 26px Arc"; g.fillText(o + (on ? (retry ? "  ✓" : "  ✕") : ""), 42, y + 47); });
  if (!retry && lt > 1.2) { g.fillStyle = "rgba(255,255,255,.8)"; g.font = "700 22px Arc"; g.fillText("↺ Watch the reel again", 26, 600); }
  phoneTex.needsUpdate = true; };
const seatRow = () => { // the class, seated; YOU at the left desk, JAKE across the room
  sit(ex1, true); sit(ex2, true); sit(ex3, true); sit(ex4, true); put(ex1, cls, 4, 4.7); put(ex2, cls, -4, 4.7); put(ex3, cls, 0, 4.7); put(ex4, cls, 0, 1.1);
  [ex1, ex2, ex3, ex4].forEach((P) => P.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1] })); };
const wave = (lt) => Math.sin(lt * 6);

// ---------- shots ----------
const SC = {
  poll(lt) {
    away(MS, kYOU, kJAKE); laptop.removeFromParent(); seatRow(); sit(YOU, true); sit(JAKE, true); put(YOU, cls, -4, 1.1); put(JAKE, cls, 4, 1.1); YOU.setFace("neutral"); JAKE.setFace("smug");
    YOU.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1], headTilt: 0.15 }); JAKE.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1], headTurn: -0.5 });
    drawClock(40 + lt * 6); drift(lt / 2.75, v3(5, 6.2, 12.5), v3(3.6, 5.6, 10.4), v3(-0.5, 3.0, 1.0), v3(-0.5, 3.0, 1.0), 44); return cls; },
  tell(lt) { // after class: you at the teacher's desk
    away(ex1, ex2, ex3, ex4); sit(YOU, false); sit(JAKE, true); sit(MS, true); put(YOU, cls, 1.4, -1.2, Math.PI - 0.35); put(MS, cls, 2.8, -4.6, 0.15); put(JAKE, cls, 0, 1.1, 0.4);
    YOU.setFace("worried"); MS.setFace(lt > 2.6 ? "shock" : "neutral"); JAKE.setFace("neutral");
    YOU.pose({ ra: [-1.1 - Math.sin(lt * 6) * 0.12, -0.5] }); MS.pose({ la: [-0.9, 0], ra: [-0.9, 0] }); JAKE.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1] });
    drawClock(48 + lt * 4); drift(lt / 4.86, v3(3.9, 4.6, -5.4), v3(3.5, 4.3, -4.7), v3(1.2, 3.1, -1.0), v3(1.0, 3.1, -0.6), 42); return cls; },
  callover(lt) { // she waves Jake over; he walks up, calm
    sit(MS, true); put(MS, cls, 2.8, -4.6, 0.15); MS.setFace("angry"); MS.pose({ la: [-0.9, 0], ra: [-1.6 + wave(lt) * 0.25, -0.6] });
    put(YOU, cls, 1.4, -1.2, Math.PI - 0.35); YOU.setFace("worried"); YOU.pose();
    if (lt < 1.4) { sit(JAKE, false); const k = ease(lt / 1.4); put(JAKE, cls, mix(0, 0.1, k), mix(1.1, -0.6, k), Math.PI * 0.85); JAKE.setFace("neutral"); const s = Math.sin(lt * 9); JAKE.pose({ ll: s * 0.4, rl: -s * 0.4, la: [-s * 0.3, 0.06], ra: [s * 0.3, -0.06] });
      drift(lt / 1.4, v3(-2.6, 4.6, 6.0), v3(-2.2, 4.4, 5.2), v3(1.0, 2.8, -1.4), v3(1.0, 2.8, -1.4), 44); }
    else { put(JAKE, cls, 0.1, -0.6, -0.5); sit(JAKE, false); JAKE.setFace("smug"); JAKE.pose({ headTilt: -0.1 }); const k = (lt - 1.4) / 1.28; cam(v3(-1.9, 3.7, 4.3 - k * 0.4), v3(0.1, 3.1, -0.6), 34); }
    drawClock(52 + lt * 4); return cls; },
  quote(lt) { // "I wrote it. He copied me. Check his laptop."
    sit(JAKE, false); put(JAKE, cls, 0.1, -0.6, -0.5); JAKE.setFace("smug"); JAKE.pose({ ra: [-1.5 * ease(lt / 0.4), -0.25], headTilt: -0.12 + Math.sin(lt * 3) * 0.03 });
    put(YOU, cls, 1.4, -1.2, Math.PI - 0.35); YOU.setFace("shock");
    if (lt < 1.64) drift(lt / 1.64, v3(-2.4, 3.8, 5.0), v3(-2.0, 3.7, 4.3), v3(0.1, 3.0, -0.6), v3(0.1, 3.1, -0.6), 36);
    else { sit(YOU, false); put(YOU, cls, 1.4, -1.2, -0.3); YOU.setFace("shock"); YOU.pose({ la: [-0.3, 0.3], ra: [-0.3, -0.3] }); const k = (lt - 1.64) / 0.91; cam(v3(0.6, 3.6, 2.9 - k * 0.5), v3(1.4, 3.2, -1.2), 36 - k * 4); }
    drawClock(56 + lt * 4); return cls; },
  laptop(lt) { // file gone, deleted, last edited by Jake
    cls.add(laptop); laptop.position.set(2.2, 1.5, -3.0); laptop.rotation.set(0, 0, 0); lapLid.rotation.x = -0.25 - 1.0 * (1 - ease(lt / 0.5));
    put(YOU, cls, 2.2, 3.0, Math.PI); YOU.pose({ la: [-1.0, 0.2], ra: [-1.0, -0.2] }); away(JAKE); put(JAKE, cls, 0.4, -0.9, Math.PI - 0.6); JAKE.setFace("smug");
    const T = 12.84, a = (t) => t - T;
    if (lt < a(15.3)) { drawLaptop(lt < a(14.1) ? "docs" : "deleted", (lt - a(14.1)) / 1.2); cam(v3(2.2, 2.6, 0.3 - lt * 0.1), v3(2.2, 2.05, -3.4), 40); }
    else if (lt < a(16.13)) { sit(YOU, false); put(YOU, cls, 2.2, -1.2, -0.15); YOU.setFace("shock"); YOU.pose({ la: [-0.4, 0.5], ra: [-0.4, -0.5] }); cam(v3(1.8, 3.6, 1.6), v3(2.2, 3.2, -1.2), 34); }
    else { drawLaptop("edited", 1); const k = (lt - a(16.13)) / 1.79; cam(v3(2.2, 2.55, 0.0 - k * 0.6), v3(2.2, 1.95, -3.4), 40 - k * 4); }
    return cls; },
  password(lt) { // flashback: seventh grade, gaming together, laughing
    away(YOU, JAKE, MS); room.add(laptop); laptop.position.set(0.6, 1.56, 1.0); laptop.rotation.set(0, Math.PI, 0); lapLid.rotation.x = -0.3; drawLaptop("game");
    lamp.intensity = 22; sit(kYOU, true); sit(kJAKE, true); put(kYOU, room, 0.0, -0.2); put(kJAKE, room, 1.3, -0.2); kYOU.g.position.y = 0.45; kJAKE.g.position.y = 0.45;
    kYOU.setFace("grin"); kJAKE.setFace(lt > 1.2 ? "grin" : "happy"); kYOU.pose({ la: [-1.1, 0.1], ra: [-1.1, -0.1], headTilt: Math.sin(lt * 5) * 0.08 }); kJAKE.pose({ la: [-1.1, 0.1], ra: [-1.6 + Math.sin(lt * 8) * 0.2, -0.3], headTilt: -0.1 });
    drift(lt / 3.12, v3(1.4, 4.4, 6.4), v3(1.0, 4.1, 5.2), v3(0.6, 2.7, -0.2), v3(0.6, 2.8, -0.2), 38); return room; },
  teacher(lt) { // she looks at you like a stranger; the rule goes on the board
    away(kYOU, kJAKE); laptop.removeFromParent(); lamp.intensity = 9;
    const T = 21.04, a = (t) => t - T, full = "TOMORROW: EXPLAIN IT\nOUT LOUD.\nOR GET A ZERO.";
    if (lt < a(23.11)) { drawBoard("ESSAY DUE TODAY"); sit(MS, false); put(MS, cls, 2.0, -2.2, 0.3); MS.setFace("neutral"); MS.pose({ la: [-0.5, 0.5], ra: [-0.5, -0.5] });
      const k = lt / 2.07; cam(v3(1.0, 3.6, 3.4 - k * 0.5), v3(2.0, 3.15, -2.2), 34); }
    else if (lt < a(28.0)) { sit(MS, false); put(MS, cls, -1.6, -4.4, 0.1); MS.setFace("angry"); MS.pose({ ra: [-2.2, -0.5] }); away(JAKE, YOU);
      const k = (lt - a(23.11)) / 4.89, n = Math.floor(clamp(k * 1.25) * full.length); drawBoard(full.slice(0, n)); drift(k, v3(1.6, 3.9, 3.6), v3(0.8, 3.8, 1.8), v3(-1.3, 3.3, -4.4), v3(-1.3, 3.6, -4.4), 46); }
    else { drawBoard(full); sit(YOU, false); put(YOU, cls, 1.4, -1.2, -0.3); YOU.setFace("worried"); YOU.pose({ headTilt: -0.06 }); const k = (lt - a(28.0)) / 1.0; cam(v3(0.6, 3.6, 2.6 - k * 0.4), v3(1.4, 3.2, -1.2), 34); }
    drawClock(5 + lt * 3); return cls; },
  bond(lt) { // flashback: second grade, side by side; then the year your parents split, he stayed
    away(YOU, JAKE, MS); const T = 29.0, a = (t) => t - T;
    if (lt < a(31.85)) { drawBoard("2 + 3 = 5   ☺"); away(ex1, ex2, ex3, ex4); sit(kYOU, true); sit(kJAKE, true); put(kYOU, cls, -0.45, 4.6); put(kJAKE, cls, 0.45, 4.6); kYOU.g.position.y = 0.25; kJAKE.g.position.y = 0.25;
      kYOU.setFace("grin"); kJAKE.setFace("grin"); const hi = clamp((lt - 1.2) / 0.4); kYOU.pose({ ra: [-2.4 * hi, -0.6 * hi], la: [-0.9, 0.1], headTurn: 0.3 }); kJAKE.pose({ la: [-2.4 * hi, 0.6 * hi], ra: [-0.9, -0.1], headTurn: -0.3 });
      drift(lt / 2.85, v3(0.3, 3.3, 10.6), v3(0.2, 3.1, 9.2), v3(0, 2.4, 4.6), v3(0, 2.5, 4.6), 40); return cls; }
    away(ex1, ex2, ex3, ex4); lamp.intensity = 16; sit(kYOU, true); sit(kJAKE, true); put(kYOU, room, -5.3, 1.6, 0.25); put(kJAKE, room, -4.3, 1.6, -0.25); kYOU.g.position.y = 0.05; kJAKE.g.position.y = 0.05;
    kYOU.setFace("cry"); kJAKE.setFace("worried"); kYOU.pose({ la: [-0.6, 0.1], ra: [-0.6, -0.1], headTilt: 0.12 }); kJAKE.pose({ la: [-1.6, 1.2], ra: [-0.4, -0.1], headTilt: 0.15 });
    drift((lt - a(31.85)) / 2.69, v3(-3.6, 2.7, 7.4), v3(-4.0, 2.5, 6.2), v3(-4.8, 1.7, 1.6), v3(-4.8, 1.8, 1.6), 38); return room; },
  smile(lt) { // back to now: he's smiling at you across the room
    away(kYOU, kJAKE); drawBoard("ESSAY DUE TODAY"); seatRow(); sit(JAKE, true); put(JAKE, cls, 4, 1.1, -0.85); JAKE.setFace("smug"); JAKE.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1], headTilt: -0.1 });
    sit(YOU, true); put(YOU, cls, -4, 1.1, 0.6);
    const k = lt / 2.04; cam(v3(-1.2 + k * 0.8, 3.5, 4.4 - k * 0.6), v3(4, 2.9, 1.1), 38 - k * 6); return cls; },
  night(lt) { // 11:47 PM, twelve pages
    sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); YOU.setFace("worried"); YOU.pose({ la: [-1.1, 0.1], ra: [-1.1, -0.1], headTilt: Math.sin(lt * 2) * 0.05 });
    drift(lt / 5.51, v3(3.6, 5.2, 8.6), v3(2.2, 4.4, 6.0), v3(0.6, 2.6, 0.2), v3(0.6, 2.8, 0.4), 40); return room; },
  reread(lt) { // rereading: page one, page two, nothing sticks
    sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); const flip = lt % 2.4 < 0.5;
    pages.children[11].rotation.x = flip ? -Math.PI * ease((lt % 2.4) / 0.5) : 0; pages.children[11].position.y = 0.44 + (flip ? 0.3 * Math.sin(Math.PI * (lt % 2.4) / 0.5) : 0);
    YOU.setFace(lt > 3.9 ? "cry" : "worried"); YOU.pose({ la: [-1.1, 0.1], ra: [-1.5 + (flip ? 0.3 : 0), -0.2], headTilt: lt > 3.9 ? 0.12 : 0.03 });
    if (lt < 3.9) drift(lt / 3.9, v3(0.9, 4.6, 3.6), v3(0.8, 4.4, 3.2), v3(1.4, 1.7, 1.0), v3(1.4, 1.7, 1.0), 44);
    else { const k = (lt - 3.9) / 4.08; cam(v3(1.5, 3.7, 4.8 - k * 0.8), v3(0.4, 3.1, -0.3), 34); }
    return room; },
  unspool(lt) { // into Unspool, reel after reel; you learn every line
    sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); if (lt >= 2.81) room.add(phone); // the screen itself is shown full-size in the overlay
    if (lt < 2.81) { phone.position.set(0.4, 2.85, 0.6); phone.rotation.set(-0.1, 0, 0); YOU.setFace("neutral"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: 0.18 });
      drawPhone(clamp(lt / 2.81)); glow.intensity = 3; glow.position.set(0.4, 2.9, 1.4); const k = lt / 2.81; cam(v3(0.7, 3.2, 4.3 - k * 0.6), v3(0.4, 2.95, 0.6), 38); }
    else { phone.position.set(0.4, 2.2, 0.75); phone.rotation.set(-1.0, Math.PI, 0); YOU.setFace(lt > 4.3 ? "grin" : "determined"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: -0.04 });
      glow.intensity = 7; glow.position.set(0.4, 2.7, 1.1); drawPhone(1); const k = (lt - 2.81) / 2.99; cam(v3(1.7 - k * 0.2, 3.8, 5.0 - k * 0.8), v3(0.4, 3.0, -0.3), 36); }
    return room; },
  quiz(lt) { // the quiz: miss one, watch again, nail it, 12 for 12
    sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); room.add(phone);
    if (lt < 4.2) { phone.position.set(0.4, 2.85, 0.6); phone.rotation.set(-0.1, 0, 0); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: 0.18 });
      drawQuiz(lt > 3.3 ? 9 : lt); glow.intensity = 3; glow.position.set(0.4, 2.9, 1.4); cam(v3(0.7, 3.15, 3.9 - lt * 0.08), v3(0.4, 2.95, 0.6), 38); }
    else { phone.position.set(0.4, 2.2, 0.75); phone.rotation.set(-1.0, Math.PI, 0); YOU.setFace("grin"); const up = ease((lt - 4.2) / 0.3);
      YOU.pose({ la: [-1.35 - 1.3 * up, 0.25 + 0.3 * up], ra: [-1.35 - 1.3 * up, -0.25 - 0.3 * up], headTilt: Math.sin(lt * 8) * 0.06 }); glow.intensity = 7; glow.position.set(0.4, 2.7, 1.1); drawQuiz(9);
      const k = (lt - 4.2) / 1.38; cam(v3(1.6, 3.8, 5.2 - k * 0.5), v3(0.4, 3.2, -0.3), 38); }
    return room; },
  gossip(lt) { // by lunch it's in the group chat
    seatRow(); away(ex1, ex2, ex3, ex4); sit(YOU, false);
    const G = [ex1, ex2, ex3, ex4, JAKE]; G.forEach((P, i) => { sit(P, false); put(P, hall, [-3.4, -1.8, 2.4, 3.8, 6.0][i], [-2.3, -2.0, -2.1, -2.4, -2.6][i], [0.5, 0.3, -0.3, -0.5, -0.4][i]); P.setFace(i === 4 ? "smug" : lt > 1.0 ? "shock" : "smug"); P.pose({ la: [-1.3, 0.3], ra: [-0.2, -0.1], headTilt: Math.sin(lt * 3 + i) * 0.05 }); });
    const k = ease(clamp(lt / 3.0)); put(YOU, hall, mix(-5.5, 0.4, k), -0.6, 0.3); const s2 = Math.sin(lt * 7) * (1 - k * 0.6); YOU.pose({ ll: s2 * 0.4, rl: -s2 * 0.4 }); YOU.setFace(lt > 2.5 ? "cry" : "worried");
    if (lt < 2.55) drift(lt / 2.55, v3(0.6, 4.4, 9.4), v3(0.4, 4.2, 8.0), v3(0.2, 2.9, -1.6), v3(0.2, 3.0, -1.6), 44);
    else { const q = (lt - 2.55) / 4.82; cam(v3(0.4, 3.6, 3.4 - q * 0.6), v3(0.4, 3.3, -0.6), 36); }
    return hall; },
  text(lt) { // 2 AM: the phone lights up on the desk
    away(MS, JAKE); lamp.intensity = 0.6; sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); room.add(phone);
    if (lt < 2.26) { phone.position.set(0.9, 1.62, 1.1); phone.rotation.set(-Math.PI / 2, 0, Math.sin(lt * 60) * (lt % 0.8 < 0.3 ? 0.03 : 0)); drawText(lt / 1.0); glow.intensity = 4; glow.position.set(0.9, 2.3, 1.1);
      YOU.setFace("neutral"); YOU.pose({ headTilt: 0.3 }); cam(v3(0.9, 3.7, 1.9), v3(0.9, 1.6, 1.05), 40); }
    else { phone.position.set(0.4, 2.55, 0.8); phone.rotation.set(-0.3, Math.PI, 0); drawText(1); glow.intensity = 5; glow.position.set(0.4, 2.8, 1.2); YOU.setFace("worried"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25] });
      const k = (lt - 2.26) / 1.78; cam(v3(1.6, 3.7, 4.6 - k * 0.5), v3(0.4, 3.1, -0.3), 36); }
    return room; },
  locker(lt) { // 7:58: waiting at your locker, eyes red; the confession; drop it, or we're done
    phone.removeFromParent(); sit(YOU, false); sit(JAKE, false); const T = 51.78, a = (t) => t - T;
    if (lt < a(54.22)) { put(JAKE, hall, -0.8, -2.1, 0.3); JAKE.g.rotation.z = 0; JAKE.setFace("worried"); JAKE.pose({ la: [0, 0.3], ra: [0, -0.3], headTilt: 0.15 });
      const k = ease(lt / 2.44); put(YOU, hall, mix(4.5, 1.2, k), -1.4, -0.5); const s = Math.sin(lt * 9) * (1 - k); YOU.pose({ ll: s * 0.5, rl: -s * 0.5 }); YOU.setFace("neutral");
      drift(lt / 2.44, v3(1.6, 4.2, 8.0), v3(1.0, 4.0, 6.6), v3(0.2, 2.8, -1.6), v3(0.0, 3.0, -1.6), 42); }
    else if (lt < a(55.48)) { put(JAKE, hall, -0.8, -2.1, 0.3); JAKE.setFace("cry"); JAKE.pose({ headTilt: 0.1 }); const k = (lt - a(54.22)) / 1.26; cam(v3(-0.5, 3.75, 0.9 - k * 0.3), v3(-0.8, 3.3, -2.1), 34); }
    else { put(YOU, hall, -0.55, -1.6, 0.25); put(JAKE, hall, 0.75, -1.9, -0.75); JAKE.g.rotation.z = 0.12; YOU.setFace(lt > a(58.97) ? "shock" : "worried"); YOU.pose({ ra: [-0.25, -0.1] });
      JAKE.setFace(lt > a(58.32) ? "cry" : "whisper"); JAKE.pose({ ra: [-2.3, -0.5], headTilt: 0.18 });
      if (lt < a(58.97)) drift((lt - a(55.48)) / 3.49, v3(1.4, 4.0, 5.6), v3(1.0, 3.9, 4.2), v3(0.0, 3.3, -1.6), v3(0.0, 3.4, -1.7), 40);
      else { const k = (lt - a(58.97)) / 1.45; cam(v3(0.6 - k * 0.1, 3.75, 2.5 - k * 0.3), v3(0.1, 3.4, -1.8), 34); } }
    return hall; },
  period(lt) { // first period: "Who's first?" Jake stands, looks at you
    JAKE.g.rotation.z = 0; seatRow(); drawBoard("PRESENTATIONS"); sit(YOU, true); put(YOU, cls, -4, 1.1, 0.3); YOU.setFace("worried");
    sit(MS, false); put(MS, cls, 2.0, -3.8, -0.1); MS.setFace("neutral"); MS.pose({ la: [-1.3, 0.2], ra: [-0.2, -0.1] });
    if (lt < 2.41) { sit(JAKE, true); put(JAKE, cls, 4, 1.1); JAKE.setFace("worried"); JAKE.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1] }); drift(lt / 2.41, v3(-1.0, 4.6, 10.5), v3(-0.6, 4.4, 9.0), v3(0.4, 3.0, -2.5), v3(0.4, 3.0, -2.5), 42); }
    else { const k = clamp((lt - 2.41) / 0.5); sit(JAKE, k > 0.5 ? false : true); put(JAKE, cls, 4, 2.0, -0.9 * ease((lt - 2.41) / 1.0)); JAKE.setFace("worried"); JAKE.pose({ headTilt: 0.1 });
      const q = (lt - 2.41) / 1.98; cam(v3(-2.6 + q * 0.4, 3.9, 3.2 - q * 0.3), v3(4, 3.3, 2.0), 34 - q * 6); }
    drawClock(10 + lt * 3); return cls; },
  explain(lt) { // what if: you explain every page. He gets the zero... and maybe he's gone.
    seatRow(); away(ex4); drawBoard("MY ESSAY:\nEVERY PAGE"); sit(YOU, false); put(YOU, cls, -1.8, -4.0, 0.15); YOU.setFace("determined"); YOU.pose({ ra: [-1.8 - Math.sin(lt * 5) * 0.2, -0.4] });
    sit(JAKE, true); put(JAKE, cls, 4, 1.1, -0.3); JAKE.setFace("cry"); JAKE.pose({ la: [-1.2, 0.1], ra: [-1.2, -0.1] }); JAKE.head.rotation.x = 0.18; away(MS);
    if (lt < 2.0) drift(lt / 2.0, v3(-3.0, 4.4, 7.4), v3(-2.8, 4.2, 6.2), v3(-1.8, 3.0, -4.0), v3(-1.8, 3.1, -4.0), 40);
    else { const k = (lt - 2.0) / 2.11; cam(v3(2.1, 3.3, 5.4 - k * 0.5), v3(4, 2.75, 1.1), 36 - k * 3); }
    return cls; },
  quiet(lt) { // what if: you stay quiet. You take the zero, and he walks away with your words.
    JAKE.head.rotation.x = 0; seatRow(); away(ex4); drawBoard("JAKE'S ESSAY"); sit(JAKE, false); put(JAKE, cls, -1.8, -4.0, 0.15); JAKE.setFace("smug"); JAKE.pose({ ra: [-1.8 - Math.sin(lt * 5) * 0.2, -0.4] });
    sit(YOU, true); put(YOU, cls, -4, 1.1, 0.2); YOU.setFace("cry"); YOU.pose({ la: [-1.2, 0.1], ra: [-1.2, -0.1] }); YOU.head.rotation.x = 0.18;
    if (lt < 2.2) drift(lt / 2.2, v3(2.0, 4.4, 7.4), v3(1.8, 4.2, 6.2), v3(-1.8, 3.0, -4.0), v3(-1.8, 3.1, -4.0), 40);
    else { const k = (lt - 2.2) / 2.18; cam(v3(-2.5, 3.3, 5.6 - k * 0.5), v3(-4, 2.75, 1.1), 36 - k * 3); }
    return cls; },
  choice(lt) { // your seat. Jake waiting at the front. Stand up, or stay in your seat?
    YOU.head.rotation.x = 0; seatRow(); drawBoard("PRESENTATIONS"); sit(JAKE, false); put(JAKE, cls, 0.4, -3.6, 0); JAKE.setFace("worried"); JAKE.pose();
    sit(MS, false); put(MS, cls, 3.4, -4.4, -0.3); MS.setFace("neutral"); MS.pose();
    sit(YOU, true); put(YOU, cls, -4, 1.1, 0.25); YOU.setFace(lt > 1.4 ? "determined" : "worried"); YOU.pose({ la: [-0.9, 0.1], ra: [-0.9, -0.1], headTilt: Math.sin(lt * 1.5) * 0.04 });
    away(ex2); const k = lt / 2.7; cam(v3(-3.3, 3.75, 6.0 - k * 0.9), v3(-4.0, 2.75, 1.1), 40); return cls; },
  end(lt) { // you hold up the sign
    away(ex1, ex2, ex3, ex4, JAKE, MS); sit(YOU, false); put(YOU, hall, 0, -0.6, 0); YOU.setFace("happy"); YOU.pose({ la: [-1.45, -0.15], ra: [-1.45, 0.15] });
    hall.add(sign); sign.position.set(0, 2.05 + Math.sin(lt * 4) * 0.02 - 0.3 * (1 - outBack(lt / 0.3)), 0.75); sign.rotation.set(0, 0, Math.sin(lt * 3) * 0.02);
    cam(v3(0, 3.0, 8.4 - lt * 0.3), v3(0, 3.2, -0.2), 40); return hall; },
};

// ---------------- overlay ----------------
const ov = document.getElementById("ov"), glc = document.getElementById("gl");
const capAt = (t) => { let c = null; for (const x of CAPS) if (t >= x[0] - 0.03) c = x; return c && t < 96.6 ? c : null; };
const card = (letter, text, col, on, k) => `<div style="display:flex;align-items:center;gap:18px;margin:14px 0;padding:18px 24px;border-radius:20px;background:${on ? col : "rgba(255,255,255,.94)"};color:${on ? "#fff" : "#111"};font:800 40px/1.1 Arc;transform:scale(${0.6 + 0.4 * outBack(k)});opacity:${clamp(k * 3)};box-shadow:0 8px 20px rgba(0,0,0,.35)"><span style="display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:${on ? "rgba(255,255,255,.25)" : col};color:#fff">${letter}</span>${text}${on ? '<span style="margin-left:auto">✓</span>' : ""}</div>`;
const tag = (txt, lt, bg = "#ffd23f", fg = "#111") => `<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><span style="background:${bg};color:${fg};font:800 34px Arc;padding:8px 18px;border-radius:10px;opacity:${clamp(lt * 4)}">${txt}</span></div>`;
const chat = (lt) => { const M = [["Maya", "wait he copied JAKE??", 0], ["Dev", "CHEATER 💀", 0.5], ["Sam", "copycat fr", 1.5], ["Priya", "who even is that", 2.4], ["Leo", "imagine copying ur best friend", 3.1]];
  return `<div style="position:absolute;left:110px;right:110px;top:150px;background:rgba(18,20,28,.92);border-radius:28px;padding:18px 18px 8px;box-shadow:0 10px 30px rgba(0,0,0,.5)"><div style="color:#fff;font:800 26px Arc;margin:0 0 10px 6px">10th grade 🔥 <span style="color:#9aa;font-size:20px">87 members</span></div>` +
    M.filter((m) => lt >= m[2]).map((m) => `<div style="background:#2a2d3a;border-radius:18px;padding:10px 16px;margin:0 0 10px;transform:scale(${0.8 + 0.2 * outBack((lt - m[2]) / 0.2)});transform-origin:left"><div style="color:#7fb8ff;font:800 19px Arc">${m[0]}</div><div style="color:#fff;font:700 28px Arc">${m[1]}</div></div>`).join("") + `</div>`; };
const FLASH = { password: 1, bond: 1 }, WHATIF = { explain: 1, quiet: 1 };
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i], lt = t - t0;
  glc.style.filter = name === "poll" ? `blur(${5 - 2 * clamp(lt / 2)}px) brightness(.7) contrast(1.05)` : FLASH[name] ? "sepia(.75) saturate(1.2) brightness(1.3) contrast(.95)" : WHATIF[name] ? "saturate(.35) brightness(.9) contrast(1.1) hue-rotate(-10deg)" : "contrast(1.08) saturate(1.12)";
  [YOU, JAKE, MS, kYOU, kJAKE, ex1, ex2, ex3, ex4].forEach((P) => { P.g.removeFromParent(); P.head.rotation.x = 0; P.g.rotation.z = 0; P.g.position.y = 0; });
  [laptop, phone, sign].forEach((o) => o.removeFromParent()); lamp.intensity = 9; glow.intensity = 0; pages.children[11].rotation.x = 0; pages.children[11].position.y = 0.44;
  renderer.render(SC[name](lt), camera);
  let h = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) ${FLASH[name] || WHATIF[name] ? 40 : 55}%,rgba(0,0,0,${FLASH[name] || WHATIF[name] ? 0.6 : 0.4}) 100%)"></div>`;
  if (FLASH[name]) h += `<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,240,200,.04) 0 2px,transparent 2px 4px)"></div>`;
  if (name === "poll") {
    h += `<div style="position:absolute;left:0;right:0;top:150px;text-align:center"><span style="background:#111;color:#fff;font:800 34px Arc;letter-spacing:4px;padding:10px 22px;border-radius:10px">PREVIOUSLY</span></div>`;
    h += `<div style="position:absolute;left:110px;right:110px;top:250px"><div style="text-align:center;color:#fff;font:800 38px Arc;-webkit-text-stroke:6px #000;paint-order:stroke fill;margin-bottom:6px">THE ESSAY · PART 1</div>${card("A", "TELL THE TEACHER", "#2bb673", t > 1.32, clamp(t / 0.25))}${card("B", "STAY QUIET", "#e6402e", false, clamp((t - 0.12) / 0.25))}</div>`;
  }
  if (name === "password") h += tag("7TH GRADE", lt, "#f4e6c8", "#5a4020");
  if (name === "bond") h += tag(lt < 2.85 ? "2ND GRADE" : "THE YEAR YOUR PARENTS SPLIT", lt < 2.85 ? lt : lt - 2.85, "#f4e6c8", "#5a4020");
  if (name === "night" && lt < 3) h += tag("11:47 PM", lt);
  if (name === "reread") h += tag(lt < 2.6 ? "PAGE 1 OF 12" : "PAGE 2 OF 12", lt < 2.6 ? lt : lt - 2.6, "#f4f4ea");
  if (name === "gossip" && lt > 2.55) h += chat(lt - 2.55);
  if (name === "text" && lt > 2.26) h += tag("2:00 AM", lt - 2.26);
  if (name === "locker" && lt < 2) h += tag("7:58 AM", lt);
  if (name === "explain") h += tag("IF YOU EXPLAIN…", lt, "#2bb673", "#fff");
  if (name === "quiet") h += tag("IF YOU STAY QUIET…", lt, "#e6402e", "#fff");
  if (name === "choice" || (name === "end" && false)) {
    h += `<div style="position:absolute;left:110px;right:110px;top:190px">${card("A", "STAND UP", "#2bb673", false, clamp((t - 94.69) / 0.25))}${card("B", "STAY SEATED", "#e6402e", false, clamp((t - 95.70) / 0.25))}</div>`;
    if (t > 96.3) h += `<div style="position:absolute;left:0;right:0;top:425px;text-align:center;color:#fff;font:800 42px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;transform:scale(${0.7 + 0.3 * outBack((t - 96.3) / 0.25)})">COMMENT <span style="color:#3df07a">A</span> OR <span style="color:#ff5a4a">B</span> 👇</div>`;
  }
  // the Unspool beat, made unmissable: unspool.cc up top, the essay drops into a full-size phone
  const U0 = 57.49, U1 = 63.29, inU = t >= U0 - 0.2 && t < U1;
  if (inU) { const a = clamp((t - (U0 - 0.2)) / 0.3) * clamp((U1 - t) / 0.25), pop = 0.8 + 0.2 * outBack(clamp((t - (U0 - 0.2)) / 0.35));
    h += `<div style="position:absolute;inset:0;background:rgba(6,10,8,${0.62 * a})"></div>`;
    const lg = t >= 57.95 && t < 58.7 ? 1 + 0.12 * Math.sin(clamp((t - 57.95) / 0.75) * Math.PI) : 1;
    h += `<div style="position:absolute;left:0;right:0;top:96px;text-align:center;opacity:${a}"><span style="display:inline-block;transform:scale(${lg});background:#b6f24a;color:#08110e;font:800 40px Arc;padding:8px 22px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45)">unspool<span style="opacity:.55">.cc</span></span></div>`;
    h += `<div id="ph" style="position:absolute;left:218px;top:178px;width:284px;height:584px;border-radius:38px;background:#000;border:5px solid #2a2a2a;box-shadow:0 20px 50px rgba(0,0,0,.6);overflow:hidden;opacity:${a};transform:scale(${pop});transform-origin:50% 50%"></div>`;
    if (t >= U0 && t < 58.7) { const k = ease(clamp((t - U0) / 1.0)); const y = mix(-30, 300, k), sc = mix(1.1, 0.5, k), op = clamp((58.7 - t) / 0.2);
      h += `<div style="position:absolute;left:0;right:0;top:${y}px;text-align:center;opacity:${op * a}"><span style="display:inline-flex;align-items:center;gap:16px;transform:scale(${sc});background:#fff;color:#111;font:800 28px Arc;padding:12px 20px;border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.5)"><span style="background:#2f6fd6;color:#fff;font:800 18px Arc;padding:12px 8px;border-radius:6px">DOC</span>My essay · 12 pages</span></div>`; } }
  const c = capAt(t);
  if (c && c[1]) { const k = clamp((t - c[0]) / 0.12); h += `<div style="position:absolute;left:90px;right:90px;top:800px;text-align:center;transform:scale(${0.75 + 0.25 * outBack(k)})"><span style="color:#fff;font:800 66px/1.1 Arc;-webkit-text-stroke:12px #000;paint-order:stroke fill;text-shadow:0 5px 0 #000">${c[1]}</span></div>`; }
  if (name === "end") h += `<div style="position:absolute;left:0;right:0;top:190px;text-align:center;color:#fff;font:800 44px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;opacity:${clamp((lt - 0.2) * 4)}">FOLLOW FOR PART 3</div>`;
  ov.innerHTML = h;
  if (inU) { const cv = phoneTex.userData.c; cv.style.cssText = "width:100%;height:100%;display:block"; document.getElementById("ph").appendChild(cv); }
};
window.renderAt(0); setTimeout(() => (window.ready = true), 80);
