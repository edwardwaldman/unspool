import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adM"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(23); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(50+60*np.exp(-kk*30))*kk)*np.exp(-kk*13)
SNAP=st["snap"]+1.75
# light, upbeat 112 bpm
b=60/112; prog=[[62,66,69],[59,62,66],[55,59,62],[57,61,64]]
for i in range(int(st["cta"]/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]
    if i%2==0: add(t0,kick(),0.15)
    if i%4==2: add(t0,noise(.1,30),0.05)
    add(t0,noise(.02,120),0.02)
    add(t0,tone(note(ch[i%3]+12),b/2*0.9,7,(1,.3)),0.035)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,1.2,(1,.4)),0.07)
add(0.35,noise(0.5,6)*np.sin(np.linspace(0,np.pi,int(SR*.5))),0.08)              # phone slides up
add(SNAP,noise(0.05,80),0.5); add(SNAP+0.07,noise(0.06,70),0.35)                 # shutter click
add(SNAP+0.2,tone(note(84),0.3,10,(1,.3)),0.08); add(SNAP+0.3,tone(note(88),0.4,8,(1,.3)),0.08)
add(st["reels"]+0.1,tone(note(76),0.2,14,(1,.4)),0.1); add(st["reels"]+0.75,tone(note(83),0.6,4,(1,.3)),0.09)
for j in range(3): add(st["reels"]+0.95+j*0.12,noise(0.06,50),0.1)
for d in [0.0,0.7,1.5]: add(st["watch"]+d,tone(note(79),0.25,10,(1,.3)),0.08)
for j,m in enumerate([74,78,81,86]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
b2=60/92; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-st["cta"])/b2)):
    t0=st["cta"]+0.2+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
