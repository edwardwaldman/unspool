// The ads' "document turns into reels" beat, for the /go ad landing page, so visitors see the same
// animation they just watched. Keep in sync with brand/ads/shared/doc-to-reels.js.
// A PDF pops in, a lime ring pulses, and pages peel off and flip into three real reel cards that fan out.
// Usage in an ad page (720x1280 overlay):
//   import { docToReels } from "./doc-to-reels.js";
//   if (shot === "reels") h += docToReels(lt);            // lt = seconds since the beat started
// Copy this file and three reel stills (default mito.jpg, dna.jpg, r1.jpg) next to the ad's index.html.
// Timing: doc pops 0-0.4s, splits 0.7-1.6s, cards settled by ~1.8s. Give the beat at least 2.2s.

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x)), mix = (a: number, b: number, x: number) => a + (b - a) * x;
const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const outBack = (x: number) => { x = clamp(x); const k = 1.7; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };

export function docToReels(lt: number, {
  reels = ["mito", "dna", "r1"],                       // left, right, centre card images (jpg, no extension)
  title = 'Any document<br>→ <span style="color:#d3f05a">reels</span>',
  titleTop = 140, accent = "#d3f05a", docTitle = "Chapter 4", badge = "PDF",   // badge: "PDF", "PHOTO", "SLIDES"…
}: { reels?: string[]; title?: string; titleTop?: number; accent?: string; docTitle?: string; badge?: string } = {}) {
  const pop = outBack(lt / 0.4), split = ease((lt - 0.7) / 0.9), docA = 1 - ease((lt - 1.2) / 0.5);
  let h = title ? `<div style="position:absolute;left:0;right:0;top:${titleTop}px;text-align:center;font:700 40px/1.15 Unb;color:#fff">${title}</div>` : "";
  const cards: [number, number, string][] = [[-232, -9, reels[0]], [232, 9, reels[1]], [0, 0, reels[2]]];
  cards.forEach(([x, r, img], j) => {
    const xr = x, rr = r;
    const k = ease((lt - 0.7 - j * 0.12) / 0.8); if (k <= 0) return;
    const cx = 360 + xr * k, w = mix(170, 205, k), hh = w * 16 / 9, flip = clamp((k - 0.35) / 0.4);
    const face = flip > 0.5 ? `<img src="${img}.jpg" style="width:100%;height:100%;object-fit:cover">`
      : `<div style="padding:16px">${[90, 70, 95, 60, 85, 92, 50, 80, 75].map((wd) => `<div style="height:8px;margin:10px 0;border-radius:4px;background:#d5d9e6;width:${wd}%"></div>`).join("")}</div>`;
    h += `<div style="position:absolute;left:${cx - w / 2}px;top:${mix(470, 400, k)}px;width:${w}px;height:${hh}px;transform:rotate(${rr * k}deg) scaleX(${Math.abs(Math.cos(flip * Math.PI))});border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 20px 50px rgba(0,0,0,.5);border:6px solid #000">${face}</div>`;
  });
  if (docA > 0) h += `<div style="position:absolute;left:50%;top:420px;width:270px;height:350px;margin-left:-135px;transform:scale(${pop * mix(1, 0.85, split)}) rotate(${-3 + split * 3}deg);opacity:${docA};background:#fbfaf6;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.55);padding:26px;box-sizing:border-box"><div style="display:inline-block;background:#e5483b;color:#fff;font:700 18px Unb;padding:6px 10px;border-radius:6px">${badge}</div><div style="font:700 22px Unb;color:#1a1f2c;margin:14px 0 6px">${docTitle}</div>${[95, 88, 92, 60, 94, 85, 90, 70, 93, 55].map((wd) => `<div style="height:8px;margin:11px 0;border-radius:4px;background:#cfd3cd;width:${wd}%"></div>`).join("")}</div>`;
  if (split > 0 && split < 1) h += `<div style="position:absolute;left:50%;top:600px;width:${600 * split}px;height:${600 * split}px;margin:${-300 * split}px 0 0 ${-300 * split}px;border-radius:50%;border:4px solid ${accent};opacity:${1 - split}"></div>`;
  return h;
}
