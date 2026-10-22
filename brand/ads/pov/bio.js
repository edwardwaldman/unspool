// A biology reel drawn in HTML: mitochondria -> ATP -> cellular respiration, then a quick-check quiz.
// Rendered at 360x640 (scale the container to fit). r = seconds into the reel.
const BIO_LINES=[[0,1.46,"This is the mitochondria."],[1.71,4.6,"It makes ATP, the energy every cell runs on."],[4.85,6.81,"It does it through cellular respiration."]];
const _c=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), _b=x=>{x=_c(x);const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
function bioReel(r, n=12){
 const line=BIO_LINES.find(([a,b])=>r<b+0.25)||BIO_LINES[BIO_LINES.length-1]; const words=line[2].split(" "); const k=_c((r-line[0])/(line[1]-line[0]))*words.length;
 const cap=words.map((w,i)=>`<span style="color:${i<k?(/mitochondria|ATP|energy|respiration/.test(w)?"#c9e64a":"#fff"):"rgba(255,255,255,.35)"}">${w}</span>`).join(" ");
 const pulse=1+Math.sin(r*5)*.03;
 const atp=r>1.9?Array.from({length:8},(_,i)=>{const q=((r-1.9)*0.6+i/8)%1;const a=i*0.8+r*.3;return `<div style="position:absolute;left:${158+Math.cos(a)*q*150}px;top:${290+Math.sin(a)*q*160}px;background:#c9e64a;color:#10200f;font:800 15px 'DejaVu Sans';padding:3px 7px;border-radius:8px;opacity:${1-q};transform:scale(${.6+q*.6})">ATP</div>`}).join(""):"";
 const eq=r>4.85?`<div style="position:absolute;left:14px;right:14px;top:430px;text-align:center;color:#fff;font:700 16px 'DejaVu Sans';background:rgba(0,0,0,.45);border-radius:10px;padding:8px 6px;opacity:${_c((r-4.85)/.3)}">glucose + O<sub>2</sub> → <b style="color:#c9e64a">ATP</b> + CO<sub>2</sub> + H<sub>2</sub>O</div>`:"";
 const title=r<1.71?"MITOCHONDRIA":r<4.85?"MAKES ATP":"CELLULAR RESPIRATION";
 return `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#2f5a3a,#0e1a12);overflow:hidden">
  <div style="position:absolute;left:16px;top:20px;background:#111;color:#fff;font:800 13px 'DejaVu Sans';padding:5px 9px;border-left:3px solid #c9e64a">BIO · UNIT 4</div>
  <div style="position:absolute;right:16px;top:22px;color:#cfe;font:700 13px 'DejaVu Sans';opacity:.8">unspool</div>
  <div style="position:absolute;left:0;right:0;top:120px;text-align:center;color:#c9e64a;font:900 ${title.length>14?22:28}px 'DejaVu Sans';transform:scale(${_b((r-[0,1.71,4.85].filter(x=>x<=r).pop())/.25)})">${title}</div>
  <svg style="position:absolute;left:40px;top:200px;transform:scale(${pulse*_b(r/.35)})" width="280" height="170" viewBox="0 0 280 170"><ellipse cx="140" cy="85" rx="130" ry="72" fill="#e08a4a" stroke="#ffd1a6" stroke-width="6"/><ellipse cx="140" cy="85" rx="110" ry="54" fill="#f2a564"/><path d="M40 85 q15 -40 30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#b5552a" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
  ${atp}${eq}
  <div style="position:absolute;left:18px;right:56px;bottom:110px;text-align:center;font:800 23px/1.25 'DejaVu Sans';text-shadow:0 2px 4px #000">${cap}</div>
  <div style="position:absolute;right:12px;bottom:200px;display:flex;flex-direction:column;gap:22px;color:#fff;font-size:30px;text-shadow:0 1px 3px #000">&#9829;<br>&#9993;<br>&#10148;</div>
  <div style="position:absolute;left:16px;bottom:24px;color:#fff;font:700 17px 'DejaVu Sans';text-shadow:0 1px 3px #000">unspool · Reel ${n} of 38 · Cell energy</div>
  <div style="position:absolute;left:0;bottom:0;height:4px;width:${_c(r/7)*100}%;background:#fff"></div></div>`;
}
function bioQuiz(r){
 const pick=r>1.6; const opts=["ATP","DNA","Glucose"];
 return `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#2a3f5c,#0d1320)">
  <div style="position:absolute;left:16px;top:20px;background:#111;color:#fff;font:800 13px 'DejaVu Sans';padding:5px 9px;border-left:3px solid #c9e64a">QUICK CHECK</div>
  <div style="position:absolute;left:24px;right:24px;top:120px;color:#fff;font:800 26px/1.25 'DejaVu Sans';transform:scale(${_b(r/.3)})">What does the mitochondria make?</div>
  ${opts.map((o,i)=>`<div style="position:absolute;left:24px;right:24px;top:${260+i*78}px;border:3px solid ${pick&&i===0?"#3aa65a":"rgba(255,255,255,.3)"};background:${pick&&i===0?"rgba(58,166,90,.3)":"rgba(255,255,255,.06)"};border-radius:14px;padding:14px 16px;color:#fff;font:700 22px 'DejaVu Sans';transform:scale(${_b((r-.3-i*.15)/.25)})">${String.fromCharCode(65+i)}. ${o}${pick&&i===0?" ✓":""}</div>`).join("")}
  ${pick?`<div style="position:absolute;left:0;right:0;top:510px;text-align:center;color:#3aa65a;font:900 30px 'DejaVu Sans';transform:scale(${_b((r-1.6)/.25)})">Correct! 🔥</div>`:""}
  <div style="position:absolute;left:16px;bottom:24px;color:#fff;font:700 17px 'DejaVu Sans'">unspool · Reel 13 of 38</div></div>`;
}
