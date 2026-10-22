// Shared ad overlay: a phone where a PDF turns into reels, then the biology reel feed plays (needs bio2.js).
(() => {
  const c = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), e = (x) => { x = c(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const bk = (x) => { x = c(x); const k = 1.7; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
  const UP = 2.6; // seconds of the upload before the feed starts
  function uploadScreen(lt, name) {
    const pdfIn = e((lt - 0.35) / 0.4), prog = c((lt - 0.8) / 1.2), ready = lt > 2.05, mix = (a, b, x) => a + (b - a) * x;
    return `<div style="position:absolute;inset:0;background:#0f1612;color:#e9f0e4;font-family:'DejaVu Sans',sans-serif">
      <div style="position:absolute;left:24px;top:30px;display:flex;align-items:center;gap:9px;font-weight:800;font-size:26px"><span style="width:14px;height:14px;border-radius:50%;background:#c9e64a"></span>unspool</div>
      ${prog <= 0 ? `<div style="position:absolute;left:50%;top:190px;width:130px;height:130px;margin-left:-65px;border-radius:50%;background:#c9e64a;color:#0f1612;font:300 96px/122px 'DejaVu Sans';text-align:center">+</div><div style="position:absolute;left:0;right:0;top:350px;text-align:center;font-weight:700;font-size:24px">Upload a document</div>` : ""}
      <div style="position:absolute;left:${prog > 0 ? 32 : 145}px;top:${mix(-160, prog > 0 ? 150 : 225, pdfIn)}px;display:flex;gap:12px;align-items:center;opacity:${c((lt - 0.35) / 0.1)}"><div style="width:60px;height:76px;background:#e5484d;border-radius:7px;color:#fff;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center">PDF</div>${prog > 0 ? `<div><div style="font-weight:700;font-size:22px">${name}</div><div style="color:#9db5a6;font-size:18px">412 pages</div></div>` : ""}</div>
      ${prog > 0 ? `<div style="position:absolute;left:32px;right:32px;top:265px;color:#9db5a6;font-size:20px">${ready ? "" : Math.round(412 * (1 - prog)) + " pages → " + Math.round(38 * prog) + " reels"}</div><div style="position:absolute;left:32px;right:32px;top:300px;height:12px;background:#22302a;border-radius:6px"><div style="height:100%;width:${prog * 100}%;background:#c9e64a;border-radius:6px"></div></div>` : ""}
      ${ready ? `<div style="position:absolute;left:0;right:0;top:345px;text-align:center;font-weight:800;font-size:32px;color:#c9e64a;white-space:nowrap;transform:scale(${bk((lt - 2.05) / 0.25)})">38 reels ready ✓</div>` : ""}
    </div>`;
  }
  /** Screen contents (360x640) at T seconds: upload, then the reel feed. skipUpload starts straight on the feed. */
  window.demoScreen = (T, o = {}) => (o.skipUpload || T >= UP ? window.bioFeed(o.skipUpload ? T : T - UP) : uploadScreen(T, o.name || "bio-textbook.pdf"));
  /** A full-frame overlay for a 720x1280 ad: dimmed background and a phone rising into place. */
  window.demoOverlay = (T, o = {}) => {
    const rise = bk(T / 0.4), out = o.dur ? 1 - c((T - (o.dur - 0.3)) / 0.3) : 1, k = rise * out;
    const top = o.top ?? 250, s = o.scale ?? 1.0;
    return `<div style="position:absolute;inset:0;background:rgba(5,8,14,${0.55 * k})"></div>
      <div style="position:absolute;left:${360 - 192 * s}px;top:${top + (1 - k) * 900}px;width:${384 * s}px;height:${684 * s}px;border-radius:${44 * s}px;background:#0a0a0a;padding:${12 * s}px;box-sizing:border-box;box-shadow:0 30px 90px rgba(0,0,0,.7)">
        <div style="position:relative;width:100%;height:100%;border-radius:${34 * s}px;overflow:hidden"><div style="position:absolute;left:0;top:0;width:360px;height:640px;transform:scale(${(384 * s - 24 * s) / 360},${(684 * s - 24 * s) / 640});transform-origin:0 0">${window.demoScreen(T, o)}</div></div></div>`;
  };
})();
