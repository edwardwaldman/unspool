import json, numpy as np, soundfile as sf
S="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/ad5"
tl=json.load(open(f"{S}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(5)
st={}; [st.setdefault(l["shot"],l["s"]-0.2) for l in tl["lines"]]
note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    tt=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*tt) for i,a in enumerate(h))*np.exp(-tt*dec)
def noise(d,dec=6): tt=np.arange(int(SR*d))/SR; return rng.standard_normal(len(tt))*np.exp(-tt*dec)
def lp(x,a):
    y=np.empty_like(x); s=0.0
    for i in range(len(x)): s+=(x[i]-s)*a; y[i]=s
    return y
def whoosh(d,a=0.08): n=int(SR*d); return lp(rng.standard_normal(n),a)*np.sin(np.linspace(0,np.pi,n))**2*4
# quirky mad-lab bed: plucky minor bass line + pizzicato stabs, 100 bpm
bpm=100; b=60/bpm; bass=[45,45,48,47, 45,45,52,51]; mel=[69,72,76,72, 71,74,77,74]
for i in range(int(DUR/b)):
    t0=i*b
    add(t0, tone(note(bass[i%8]-12), b*0.9, 4, (1,.5,.2)), 0.16)
    if i%2==0: add(t0+b/2, tone(note(mel[(i//2)%8]), 0.25, 10, (1,.3,.1)), 0.05)
    add(t0, noise(0.04,80), 0.02)
    if i%4==2: add(t0, noise(0.15,25), 0.05)
# bubbling drone from the vat
tt=np.arange(N)/SR; out+=0.012*np.sin(2*np.pi*55*tt)*(1+0.5*np.sin(2*np.pi*0.3*tt))
for k in range(90): add(rng.uniform(0,DUR), tone(rng.uniform(300,700),0.08,40,(1,)), 0.03)
# sfx
add(st["drop"]+0.35, tone(70,0.5,8,(1,.6,.3)), 0.6); add(st["drop"]+0.35, noise(0.3,14), 0.25)   # thud
s=st["suit"]
for i in range(9): add(s+0.45+i*0.17, noise(0.07,45), 0.18); add(s+0.45+i*0.17, tone(1200+i*90,0.12,25), 0.12)  # clanks
add(s+0.3, whoosh(1.8,0.03), 0.25)                       # steam hiss
add(s+1.9, tone(90,0.6,5,(1,.5)), 0.4)                   # helmet seal
d=st["dunk"]+0.5+0.48
add(st["dunk"]+0.5, whoosh(0.5,0.12), 0.18); add(d, noise(0.6,6), 0.35); add(d, tone(110,0.4,8,(1,.6)), 0.4)  # splash
r=st["reveal"]
add(r, whoosh(1.4,0.05), 0.2)
for j,m in enumerate([72,76,79,84,88]): add(r+0.2+j*0.12, tone(note(m),0.8,3,(1,.3)), 0.12)
add(st["offer"]+0.3, tone(note(84),0.3,8,(1,.3)), 0.12); add(st["offer"]+0.38, tone(note(91),0.4,6,(1,.3)), 0.12)
e=st["end"]
for j,m in enumerate([69,72,76,81]): add(e+0.1+j*0.1, tone(note(m),1.6,1.5,(1,.3)), 0.1)
v,_=sf.read(f"{S}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); music=out*(1-0.45*np.minimum(1,env/0.04))
m=music+vv*1.15; m*=np.minimum(1,tt/0.2)*np.minimum(1,(DUR-tt)/0.7); m/=np.abs(m).max()/0.93
sf.write(f"{S}/mix.wav",m.astype(np.float32),SR); print("ok")
