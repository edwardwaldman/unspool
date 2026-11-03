import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adT"
AD="adT"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(7); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.24))/SR; return np.sin(2*np.pi*(44+90*np.exp(-kk*30))*kk)*np.exp(-kk*10)
def boom(): kk=np.arange(int(SR*1.2))/SR; return np.sin(2*np.pi*(32+60*np.exp(-kk*8))*kk)*np.exp(-kk*3)
def riser(d): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*(t/d)**2*0.6+np.sin(2*np.pi*(200+900*(t/d)**2)*t)*(t/d)**2*0.3
def click(): return noise(0.025,160)+tone(2400,0.025,200,(1,))
P=st["cta"]
# the cold open: five slams
for j in range(5): add(0.02+j*0.44,boom(),0.28); add(0.02+j*0.44,noise(0.15,22),0.22); add(0.02+j*0.44,tone(note(40-j),0.4,5,(1,.6)),0.12)
add(st["hook"]-0.9,riser(0.9),0.14); add(st["hook"],boom(),0.35)
# 124 bpm under everything after the hook, out after the CTA lands
b=60/124; prog=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]]
for i in range(int(DUR/(b/4))):
    t0=i*b/4; ch=prog[(i//32)%4]
    if t0<st["hook"] or t0>P+1.2: continue
    if i%4==0: add(t0,kick(),0.38)
    if i%8==4: add(t0,noise(.14,24),0.14)
    add(t0,noise(.02,140),0.03 if i%2 else 0.05)
    if i%2==0: add(t0,tone(note(ch[0]-24),b/2*0.9,6,(1,.6,.2)),0.11)
    if i%4==2: add(t0,tone(note(ch[(i//4)%3]+12),b/2,9,(1,.3)),0.035)
for s in st:
    if s not in ("end",): add(st[s],noise(0.25,14)*np.linspace(1,0,int(SR*.25)),0.12)   # whoosh on every shot
add(st["reels"]+0.7,boom(),0.3); add(st["reels"]+0.7,noise(0.4,9),0.12)              # the doc splits into reels
for j in range(4): add(st["search"]+0.3+j*0.28,tone(note(76+j*3),0.15,14,(1,.3)),0.06)  # sources landing
for j,m in enumerate([76,83]): add(st["quiz"]+1.55+j*0.08,tone(note(m),0.5,6,(1,.3)),0.1)  # right answer
if AD=="adT":
    PROMPT="AP Bio: cells and DNA"
    for c in range(len(PROMPT)): add(st["type"]+0.4+c*1.5/len(PROMPT),click(),0.12)    # typing
    add(st["type"]+2.05,click(),0.3); add(st["type"]+2.05,kick(),0.3)                   # tap go
else:
    add(st["highlight"]+0.1,noise(1.0,2)*np.linspace(0,1,int(SR*1.0)),0.05)            # the highlight sweep
    add(st["highlight"]+1.5,click(),0.3); add(st["highlight"]+1.8,tone(note(88),0.3,10,(1,.3)),0.08)  # copy, copied
    for d in (0.25,0.9,1.5): add(st["paste"]+d,click(),0.3)                             # press, paste, go
    add(st["paste"]+1.0,noise(0.15,30),0.1)
    for j in range(3): add(st["write"]+0.45+j*0.3,tone(note(79+j*4),0.25,10,(1,.3)),0.08)  # the ticks
    add(st["write"]+1.35,kick(),0.4); add(st["write"]+1.35,noise(0.2,16),0.18)          # GOT IT stamp
for j,m in enumerate([72,76,79,84,88]): add(P+0.1+j*0.06,tone(note(m),1.4,2,(1,.3)),0.1)
add(P+0.1,noise(1.0,3),0.12)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.35*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
