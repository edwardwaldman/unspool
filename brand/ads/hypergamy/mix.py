import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adH"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(11); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; L={l["shot"]:l for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(50+60*np.exp(-kk*30))*kk)*np.exp(-kk*14)
P=st["learned"]
# explainer pulse, 100 bpm, minor
b=60/100; prog=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]]
for i in range(int(P/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]
    add(t0,tone(note(ch[i%3]+12),b*0.9,4,(1,.25)),0.04)
    if i%8==0: add(t0,tone(note(ch[0]-24),b*4,0.8,(1,.5,.2)),0.09)
    if i%2==0: add(t0,kick(),0.13)
    if i%4==2: add(t0,noise(.08,40),0.03)
# card pops and panel whooshes
for k in ["hook","define","data","debate"]: add(st[k]+0.05,tone(note(81),0.15,18,(1,.3)),0.08); add(st[k],noise(0.3,12),0.06)
half=(L["claim"]["e"]-L["claim"]["s"]+0.3)*0.45
for d in [0,half]: add(st["claim"]+d,noise(0.5,5)*np.sin(np.linspace(0,np.pi,int(SR*.5))),0.1)
for k in range(12): add(st["data"]+0.3+k*0.08,tone(1200+k*60,0.04,60,(1,)),0.04)   # 80% counter ticks
add(P,noise(0.4,6),0.1)
b2=60/92; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-P)/b2)):
    t0=P+0.2+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
add(st["reels"]+0.75,tone(note(83),0.6,4,(1,.3)),0.08)
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
