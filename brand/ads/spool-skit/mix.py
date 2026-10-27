import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adI"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(21); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(48+50*np.exp(-kk*30))*kk)*np.exp(-kk*13)
P=st["cta"]
# lo-fi night beat, 84 bpm, jazzy 7th chords; tense first bar (panic), warm after the upload
b=60/84; prog=[[57,60,64,67],[50,53,57,60],[55,59,62,65],[52,55,59,62]]
add(0,np.convolve(rng.standard_normal(N),np.ones(80)/80,"same"),0.05)   # vinyl hiss bed
for i in range(int(P/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]
    if i%8==0:
        for m in ch: add(t0,tone(note(m),b*4,0.7,(1,.2)),0.022)
        add(t0,tone(note(ch[0]-12),b*4,0.9,(1,.4)),0.07)
    if i%4==0: add(t0,kick(),0.16)
    if i%4==2: add(t0+0.03,noise(.1,30),0.05)
    if i%2==1: add(t0,noise(.02,140),0.025)
add(st["count"],tone(note(45),1.5,1.5,(1,.6)),0.25)                             # dread hit on the countdown
for k in range(int((st["p1"]-st["count"])*2)): add(st["count"]+k*0.5,tone(2000,0.03,80,(1,)),0.05)   # clock ticks
for k in range(10): add(st["upload"]+0.1+k*0.05,tone(900+k*100,0.04,60,(1,)),0.05)
add(st["upload"]+0.65,tone(note(88),0.3,8,(1,)),0.08)
for j in range(3): add(st["p2"]+1.1+0.95+j*0.12,noise(0.06,50),0.1)
add(st["s2"]+0.2,tone(note(76),0.8,3,(1,.3)),0.06); add(st["s2"]+0.35,tone(note(81),0.8,3,(1,.3)),0.06)   # "aha" chime
add(st["p3"]+1.0,tone(note(93),0.15,20,(1,)),0.07)                            # wink ding
for j,m in enumerate([72,76,79,84]): add(P+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
