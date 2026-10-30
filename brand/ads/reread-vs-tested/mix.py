import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adN"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(29); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; L={l["shot"]:l for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(48+60*np.exp(-kk*30))*kk)*np.exp(-kk*13)
P=st["pivot"]
# tense, ticking bed for the experiment (104 bpm), building into the result
b=60/104; prog=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]]
for i in range(int(st["why"]/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]
    add(t0,noise(.015,150),0.025)                                   # clock tick
    if i%2==0 and t0>st["setup"]: add(t0,kick(),0.12)
    add(t0,tone(note(ch[i%3]+12),b/2*0.9,6,(1,.25)),0.028)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,1.0,(1,.4)),0.07)
for j in [0,1]: add(st["hook"]+1.3+j*0.2,tone(note(72+j*3),0.3,9,(1,.3)),0.08)        # ? boxes
add(st["hook"]+2.5,tone(note(64),0.5,5,(1,.4)),0.1)
add(st["setup"]+0.1,tone(note(79),0.3,10,(1,.3)),0.08); add(st["setup"]+2.2,noise(0.4,8),0.08)   # page splits
pa=(L["groupA"]["e"]-L["groupA"]["s"]+0.3)/4.4
for j in range(4): add(st["groupA"]+j*pa,noise(0.12,25),0.15)                     # page flips
pb=(L["groupB"]["e"]-L["groupB"]["s"]+0.3-0.5)/4
add(st["groupB"],noise(0.12,25),0.15)
for j in range(1,4): add(st["groupB"]+j*pb,tone(note(76+j*2),0.35,8,(1,.3)),0.1)     # quiz dings
R=st["result"]
add(R,noise(1.2,2)*np.linspace(0,1,int(SR*1.2)),0.06)
for j in range(10): add(R+0.3+j*0.1,tone(note(60+j),0.08,30,(1,)),0.04)            # bar A climbs
for j in range(14): add(R+2.3+j*0.07,tone(note(64+j),0.08,30,(1,)),0.05)           # bar B climbs
add(R+3.4,kick(),0.4); [add(R+3.4+j*0.06,tone(note(m),1.0,3,(1,.3)),0.1) for j,m in enumerate([72,76,79,84])]
add(st["why"]+0.6,tone(note(67),1.0,2,(1,.3)),0.06); add(st["why"]+0.6,np.sin(np.linspace(0,np.pi,int(SR*1.0)))*noise(1.0,1),0.06)
add(P,noise(0.4,6),0.1); add(P+0.75,tone(note(83),0.6,4,(1,.3)),0.08)
for j in range(3): add(P+0.95+j*0.12,noise(0.06,50),0.1)
add(P+2.5,tone(note(79),0.3,10,(1,.3)),0.08)
b2=60/96; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-st["why"])/b2)):
    t0=st["why"]+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
    if t0>P and i%1==0: add(t0,kick(),0.08)
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
