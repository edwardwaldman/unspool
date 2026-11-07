import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adY2"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(5); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.1 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): k=np.arange(int(SR*.24))/SR; return np.tanh(3*np.sin(2*np.pi*(45+110*np.exp(-k*28))*k)*np.exp(-k*9))
def boom(): k=np.arange(int(SR*1.0))/SR; return np.sin(2*np.pi*(30+70*np.exp(-k*9))*k)*np.exp(-k*3.5)
def riser(d): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*(t/d)**2*0.5+np.sin(2*np.pi*(200+1200*(t/d)**2)*t)*(t/d)**2*0.3
F=st["fix"]; E=st["count"]+1.2
b=60/140; dark=[[45,48,52],[41,45,48],[43,47,50],[40,43,47]]; bright=[[48,52,55],[45,48,52],[53,57,60],[55,59,62]]
for i in range(int(E/(b/4))):
    t0=i*b/4; prog=dark if t0<F else bright; ch=prog[(i//16)%4]
    if F-b<=t0<F: continue                                        # one beat of silence before Unspool comes in
    if i%4==0: add(t0,kick(),0.5)
    if i%8==4: add(t0,noise(.16,20),0.22)                          # clap
    add(t0,noise(.02,150),0.04 if i%2 else 0.07)                    # 16th hats
    if i%2==0: add(t0,np.tanh(2*tone(note(ch[0]-12),b/2*0.9,5,(1,.6,.3))),0.14)   # driving bass
    if t0>=F and i%4==2: add(t0,tone(note(ch[(i//4)%3]+24),b/2,8,(1,.3)),0.05)
for s in st:                                                        # an impact on every cut
    if s in ("end",): continue
    add(st[s],boom(),0.22); add(st[s],noise(0.18,16)*np.linspace(1,0,int(SR*0.18)),0.14)
add(F-0.9,riser(0.9),0.16); add(F,boom(),0.4)
for h in (st["three"]+0.3, st["gone"]+0.05, st["sticks"]+0.45, st["count"]+0.4): add(h,kick(),0.5); add(h,boom(),0.35); add(h,noise(0.25,12),0.2)
for k in range(4): add(st["night"]+k*0.25,tone(2200,0.03,90,(1,)),0.07)
for j in range(3): add(st["snap"]+0.15+j*0.15,tone(note(76+j*4),0.2,12,(1,.3)),0.1)
for j,m in enumerate([76,83]): add(st["quiz"]+0.55+j*0.07,tone(note(m),0.4,7,(1,.3)),0.12)
for j,m in enumerate([72,76,79,84,88]): add(st["count"]+0.4+j*0.05,tone(note(m),1.2,2.5,(1,.3)),0.1)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]; vv/=np.abs(vv).max()
env=np.convolve(np.abs(vv),np.ones(2400)/2400,"same"); m=out*(1-0.45*np.minimum(1,env/0.08))*0.55+vv*1.0
m=np.tanh(m*1.4)/np.tanh(1.4)                                       # glue it loud
m*=np.minimum(1,tt/0.02)*np.minimum(1,(DUR-tt)/0.4); m/=np.abs(m).max()/0.95
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
