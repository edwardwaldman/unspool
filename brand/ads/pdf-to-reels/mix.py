import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adD"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(3); tt=np.arange(N)/SR
st={l["shot"]:l["s"] for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
# bright, light 112 bpm groove
b=60/112; prog=[[62,66,69],[59,62,66],[55,59,62],[57,61,64]]
for i in range(int((st["cta"]-0.2)/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]
    if i%2==0: kk=np.arange(int(SR*.2))/SR; add(t0,np.sin(2*np.pi*(55+70*np.exp(-kk*35))*kk)*np.exp(-kk*16),0.2 if t0>st["upload"] else 0.0)
    if i%4==2: add(t0,noise(.12,28),0.05)
    add(t0,noise(.02,120),0.02)
    add(t0,tone(note(ch[i%3]+12),b/2*0.9,7,(1,.3)),0.035)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,1.2,(1,.4)),0.07)
# thud as the PDF lands, swoosh + riffle as it unspools, chimes for features, swipes
add(0.25+0.9*0.36,tone(70,0.4,9,(1,.5)),0.5); add(0.25+0.9*0.36,noise(0.2,20),0.15)
for k in range(24): add(st["unspool"]-0.2+k*0.08,noise(0.06,60),0.05)
add(st["unspool"],noise(1.6,2)*np.sin(np.linspace(0,np.pi,int(SR*1.6))),0.06)
for j,d in enumerate([0.15,0.85,1.5]): add(st["features"]-0.12+d,tone(note(76+j*3),0.5,6,(1,.3)),0.1)
per=(st["cta"]-st["swipe"]+0.25)/5
for k in range(1,5): add(st["swipe"]-0.12+k*per-0.2,noise(0.25,10)*np.sin(np.linspace(0,np.pi,int(SR*.25))),0.12)
for j,m in enumerate([74,78,81,86]): add(st["cta"]+j*0.1,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.1)*np.minimum(1,(DUR-tt)/0.8); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
