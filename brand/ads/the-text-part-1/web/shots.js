
// ================= "The Text · Part 1" (24.4 s): girlfriend + best friend, choose-your-path =================
// Same storyboard as The Essay · Part 2: hook card, a twist every ~2 s, Unspool as the turn in the plot, an unresolved
// A/B choice ("comment A or B"), then the sponsor sign. Teen audience: the betrayal is holding hands and a text, nothing more.
window.DUR = 24.4;
const SH = [["hook", 0], ["window", 3.3], ["text", 6.0], ["bond", 8.0], ["notes", 9.8], ["unspool", 12.55], ["locker", 16.65], ["choice", 19.4], ["end", 22.3]];
const GF = blocky({ shirt: "#e86a92", pants: "#3a3550", hair: "#5a3420", style: "long", skin: "#f0c7a2" });
const kYOU = blocky({ shirt: "#f0c419", pants: "#3a5a9a", hair: "#4a2c1a", style: "short", scale: 0.74 });
const kJAKE = blocky({ shirt: "#3bb273", pants: "#30323a", hair: "#151515", style: "spiky", skin: "#e2b08a", scale: 0.74 });
const away = (...Ps) => Ps.forEach((P) => P.g.removeFromParent());
// your notebook, in her hands
const nbTex = canvasTex(256, 320, (g) => { g.fillStyle = "#2f6fd6"; g.fillRect(0, 0, 256, 320); g.fillStyle = "#fff"; g.fillRect(30, 70, 196, 90); g.fillStyle = "#111"; g.font = "800 34px Arc"; g.textAlign = "center"; g.fillText("CHEM", 128, 110); g.font = "800 26px Arc"; g.fillText("my notes", 128, 145); });
const notebook = new THREE.Group(); { box(0.9, 1.1, 0.08, M("#2f6fd6"), 0, 0, 0, notebook); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.06), new THREE.MeshBasicMaterial({ map: nbTex })); s.position.z = 0.05; notebook.add(s); }
const library = () => { // the classroom set dressed as the library: GF and JAKE side by side at the middle desk
  away(MS, ex1, ex2); sit(GF, true); sit(JAKE, true); put(GF, cls, -0.55, 1.1, 0.15); put(JAKE, cls, 0.55, 1.1, -0.15);
  GF.pose({ la: [-0.9, 0.1], ra: [-1.0, -0.55] }); JAKE.pose({ la: [-1.0, 0.55], ra: [-0.9, -0.1] }); };

const SC = {
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
  notes(lt) { // they still have your notes; she flips through them
    library(); GF.setFace("neutral"); JAKE.setFace("neutral"); cls.add(notebook); notebook.position.set(-0.3, 2.2, 1.75); notebook.rotation.set(-0.5, 0.15, 0);
    GF.pose({ la: [-1.2, 0.25], ra: [-1.2, -0.25], headTilt: 0.25 });
    const k = lt / 2.75; cam(v3(0.4, 3.7, 6.0 - k * 0.6), v3(-0.2, 2.6, 1.3), 36); return cls; },
  unspool(lt) { // 11:58 PM: textbook into Unspool, reel after reel, alone
    away(JAKE, GF); sit(YOU, true); put(YOU, room, 0.4, -0.3, 0); room.add(phone);
    if (lt < 2.0) { phone.position.set(0.4, 2.85, 0.6); phone.rotation.set(-0.1, 0, 0); YOU.setFace("determined"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: 0.18 });
      drawPhone(clamp(lt / 2.0)); glow.intensity = 3; glow.position.set(0.4, 2.9, 1.4); cam(v3(0.7, 3.2, 4.3 - lt * 0.25), v3(0.4, 2.95, 0.6), 38); }
    else { phone.position.set(0.4, 2.2, 0.75); phone.rotation.set(-1.0, Math.PI, 0); YOU.setFace(lt > 3.3 ? "grin" : "determined"); YOU.pose({ la: [-1.35, 0.25], ra: [-1.35, -0.25], headTilt: -0.04 });
      glow.intensity = 7; glow.position.set(0.4, 2.7, 1.1); drawPhone(1); const k = (lt - 2.0) / 2.1; cam(v3(1.7 - k * 0.2, 3.8, 5.0 - k * 0.8), v3(0.4, 3.0, -0.3), 36); }
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
// phone lock screen with her text (drawn before the shots use it)
function drawText(k) { const { g } = phoneTex.userData; const gr = g.createLinearGradient(0, 0, 0, 740); gr.addColorStop(0, "#3a1f3a"); gr.addColorStop(1, "#1b1f3a"); g.fillStyle = gr; g.fillRect(0, 0, 360, 740);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "800 92px Arc"; g.fillText("4:10", 180, 180); g.font = "700 22px Arc"; g.fillText("Tuesday", 180, 216);
  g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect(18, 300, 324, 120, 22); g.fill(); g.textAlign = "left"; g.fillStyle = "#e86a92"; g.fillRect(36, 320, 40, 40);
  g.fillStyle = "#111"; g.font = "800 26px Arc"; g.fillText("Mia ❤️", 90, 346); g.fillStyle = "#333"; g.font = "700 22px Arc"; g.fillText("studying w jake again 📚", 36, 396); phoneTex.needsUpdate = true; }

// ---------------- overlay ----------------
const ov = document.getElementById("ov"), glc = document.getElementById("gl");
const capAt = (t) => { let c = null; for (const x of CAPS) if (t >= x[0] - 0.03) c = x; return c && t < 22.2 ? c : null; };
const card = (letter, text, col, k) => `<div style="display:flex;align-items:center;gap:18px;margin:14px 0;padding:18px 24px;border-radius:20px;background:rgba(255,255,255,.94);color:#111;font:800 40px/1.1 Arc;transform:scale(${0.6 + 0.4 * outBack(k)});opacity:${clamp(k * 3)};box-shadow:0 8px 20px rgba(0,0,0,.35)"><span style="display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:50%;background:${col};color:#fff">${letter}</span>${text}</div>`;
const tag = (txt, lt, bg = "#ffd23f", fg = "#111") => `<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><span style="background:${bg};color:${fg};font:800 34px Arc;padding:8px 18px;border-radius:10px;opacity:${clamp(lt * 4)}">${txt}</span></div>`;
const notif = (who, msg, col, k) => `<div style="position:absolute;left:100px;right:100px;top:${150 - (1 - outBack(k)) * 60}px;opacity:${clamp(k * 4)};background:rgba(250,250,252,.96);border-radius:26px;padding:16px 20px;box-shadow:0 12px 30px rgba(0,0,0,.45);display:flex;gap:16px;align-items:center"><span style="width:56px;height:56px;border-radius:14px;background:${col};flex:none"></span><span><span style="display:block;font:800 26px Arc;color:#111">${who}</span><span style="display:block;font:700 26px Arc;color:#333">${msg}</span></span></div>`;
const FLASH = { bond: 1 };
window.renderAt = (t) => {
  let i = 0; for (let j = 0; j < SH.length; j++) if (t >= SH[j][1]) i = j;
  const [name, t0] = SH[i], lt = t - t0;
  glc.style.filter = FLASH[name] ? "sepia(.75) saturate(1.2) brightness(1.3) contrast(.95)" : name === "window" ? "contrast(1.05) saturate(1.05) brightness(.95)" : "contrast(1.08) saturate(1.12)";
  [YOU, JAKE, MS, GF, kYOU, kJAKE, ex1, ex2].forEach((P) => { P.g.removeFromParent(); P.head.rotation.x = 0; P.g.rotation.z = 0; P.g.position.y = 0; });
  [phone, sign, notebook].forEach((o) => o.removeFromParent()); lamp.intensity = 9; glow.intensity = 0;
  renderer.render(SC[name](lt), camera);
  let h = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) ${FLASH[name] ? 40 : 55}%,rgba(0,0,0,${FLASH[name] ? 0.6 : 0.4}) 100%)"></div>`;
  if (name === "window") { // looking in through the library window: frame, mullions, glass glare
    h += `<div style="position:absolute;inset:0;border:46px solid #4a3324;box-shadow:inset 0 0 0 8px #2e1f15"></div><div style="position:absolute;left:356px;top:0;bottom:0;width:10px;background:#4a3324"></div><div style="position:absolute;left:0;right:0;top:470px;height:10px;background:#4a3324"></div>`;
    h += `<div style="position:absolute;inset:46px;background:linear-gradient(120deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.16) 38%,rgba(255,255,255,0) 46%,rgba(255,255,255,0) 60%,rgba(255,255,255,.1) 64%,rgba(255,255,255,0) 68%)"></div>`; }
  if (name === "hook") { h += tag("TUESDAY · 4:10 PM", lt); if (lt > 0.5) h += notif("Mia ❤️", "studying w jake again 📚", "#e86a92", (lt - 0.5) / 0.25).replace("top:", "top:58px;margin-top:"); }
  if (name === "text" && lt > 0.8) h += notif("Mia ❤️", "it's not what it looks like", "#e86a92", (lt - 0.8) / 0.25);
  if (name === "bond") h += tag("2ND GRADE", lt, "#f4e6c8", "#5a4020");
  if (name === "notes" && lt > 1.45) h += tag("CHEM FINAL · TOMORROW 8 AM", lt - 1.45, "#e6402e", "#fff");
  if (name === "unspool" && lt < 1.8) h += tag("11:58 PM", lt);
  if (name === "locker" && lt < 1.6) h += tag("7:52 AM", lt);
  if (name === "choice") {
    h += `<div style="position:absolute;left:110px;right:110px;top:190px">${card("A", "HEAR THEM OUT", "#2bb673", clamp((lt - 0.1) / 0.25))}${card("B", "WALK PAST THEM", "#e6402e", clamp((lt - 1.25) / 0.25))}</div>`;
    if (lt > 2.2) h += `<div style="position:absolute;left:0;right:0;top:425px;text-align:center;color:#fff;font:800 42px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;transform:scale(${0.7 + 0.3 * outBack((lt - 2.2) / 0.25)})">COMMENT <span style="color:#3df07a">A</span> OR <span style="color:#ff5a4a">B</span> 👇</div>`;
  }
  const c = capAt(t);
  if (c && c[1]) { const k = clamp((t - c[0]) / 0.12); h += `<div style="position:absolute;left:90px;right:90px;top:800px;text-align:center;transform:scale(${0.75 + 0.25 * outBack(k)})"><span style="color:#fff;font:800 62px/1.1 Arc;-webkit-text-stroke:12px #000;paint-order:stroke fill;text-shadow:0 5px 0 #000">${c[1]}</span></div>`; }
  if (name === "end") h += `<div style="position:absolute;left:0;right:0;top:190px;text-align:center;color:#fff;font:800 44px Arc;-webkit-text-stroke:7px #000;paint-order:stroke fill;opacity:${clamp((lt - 0.2) * 4)}">FOLLOW FOR PART 2</div>`;
  ov.innerHTML = h;
};
window.renderAt(0); setTimeout(() => (window.ready = true), 80);
