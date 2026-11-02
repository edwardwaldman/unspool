import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adS"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(41); tt=np.arange(N)/SR
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
P=st["cta"]
# driving 126 bpm: four-on-the-floor, claps, 16th hats, pulsing bass; drops out for one beat before each step
b=60/126; prog=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]]
steps=[st["s1"],st["s2"],st["s3"],st["method"]]
for i in range(int(DUR/(b/4))):
    t0=i*b/4; ch=prog[(i//32)%4]
    if any(s-b<=t0<s for s in steps): continue
    if t0>P+1.2: continue
    if i%4==0: add(t0,kick(),0.42)
    if i%8==4: add(t0,noise(.14,24),0.16)
    add(t0,noise(.02,140),0.03 if i%2 else 0.05)
    if i%2==0: add(t0,tone(note(ch[0]-24),b/2*0.9,6,(1,.6,.2)),0.12)
    if i%4==2: add(t0,tone(note(ch[(i//4)%3]+12),b/2,9,(1,.3)),0.04)
for s in steps: add(s-1.2,riser(1.2),0.12); add(s,boom(),0.35); add(s,noise(0.4,9),0.15)
for k,s in enumerate(["hook","credit","you","most","hard","reps","cta"]): add(st[s],noise(0.25,14)*np.linspace(1,0,int(SR*.25)),0.12)   # whoosh on every new shot
hits=[st["credit"]+0.9,st["most"]+0.1,st["hard"]+0.3,st["reps"],st["reps"]+0.8,st["reps"]+1.5,st["method"]+1.0,P+0.1]
for h in hits: add(h,kick(),0.35); add(h,noise(0.2,16),0.18)
for j in range(5): add(st["credit"]+0.2+j*0.12,tone(note(79+j*2),0.18,14,(1,.3)),0.06)
add(st["s2"]+3.0,tone(note(84),0.4,7,(1,.3)),0.09)
for d in range(9): add(st["s3"]+d*0.36,noise(0.03,90),0.07)
for j,m in enumerate([72,76,79,84,88]): add(P+0.1+j*0.06,tone(note(m),1.4,2,(1,.3)),0.1)
add(P+0.1,noise(1.0,3),0.12)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.35*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
