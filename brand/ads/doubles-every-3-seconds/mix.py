import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adZ"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(31); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.1 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): k=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(50+70*np.exp(-k*30))*k)*np.exp(-k*14)
def sweep(d,f0,f1): t=np.arange(int(SR*d))/SR; f=f0*(f1/f0)**(t/d); ph=2*np.pi*np.cumsum(f)/SR; return np.sin(ph)*(t/d)**1.5
R=st["reality"]
# a soft city bed under the counting
add(0,np.convolve(rng.standard_normal(int(SR*R)),np.ones(400)/400,"same"),0.3)
for m in (57,64): add(0.05,tone(note(m-12),R,0.05,(1,.3)),0.025)
# a tick on each doubling: the early ones by hand, then faster and faster
for t0,f in [(st["one"]+0.1,1),(st["doubles"]+len_ if False else st["two"]-0.25,2)] if False else []: pass
add(st["one"]+0.15,tone(note(76),0.12,30,(1,.3)),0.1)
two=st["two"]; L2=st["teacher"]-two
for j,frac in enumerate([0.02,0.36,0.65]): add(two+frac*L2,tone(note(76+j*2),0.12,30,(1,.3)),0.1)
a,b=st["thousand"],st["reality"]
t0=a; gap=0.32
while t0<b-0.3:
    add(t0,tone(note(84),0.05,60,(1,)),0.06); add(t0,kick(),0.08); t0+=gap; gap=max(0.06,gap*0.93)
add(a,sweep(b-a-0.2,90,1400),0.07); add(a,noise(b-a-0.2,0.2)*np.linspace(0,1,int(SR*(b-a-0.2))),0.05)
for k in range(8): add(st["fire"]+k*0.2,tone(note(88 if k%2 else 83),0.18,8,(1,.3)),0.07)    # alarm
add(st["billion"]+0.8,noise(2.2,1)*np.sin(np.linspace(0,np.pi,int(SR*2.2))),0.15)       # whoosh to white
add(R-0.02,tone(note(40),0.35,9,(1,.5)),0.25)                                             # stop
b=60/96; prog=[[60,64,67],[57,60,64],[65,69,72],[67,71,74]]
for i in range(int((DUR-st["step"])/(b/2))):
    t0=st["step"]+i*b/2; ch=prog[(i//8)%4]
    if t0>st["cta"]+1.6: break
    add(t0,tone(note(ch[i%3]+12),0.35,7,(1,.3)),0.04)
    if i%2==0: add(t0,kick(),0.07)
for j in range(3): add(st["how"]+1.4+j*0.15,tone(note(72+j*4),0.25,10,(1,.3)),0.08)
for j,m in enumerate([76,83]): add(st["how"]+3.8+j*0.08,tone(note(m),0.5,6,(1,.3)),0.09)
for j,m in enumerate([72,76,79,84,88]): add(st["cta"]+j*0.06,tone(note(m),1.4,2,(1,.3)),0.08)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.35*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
