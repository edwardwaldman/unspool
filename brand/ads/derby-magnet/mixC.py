import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adC"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(8); tt=np.arange(N)/SR
st={}; [st.setdefault(l["shot"],l["s"]) for l in tl["lines"]]; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
P=st["learned"]-0.12
# story: driving, slightly mysterious 110 bpm pulse in minor
b=60/110; seq=[57,57,60,57,62,57,60,55]
for i in range(int(P/(b/2))):
    t0=i*b/2; add(t0,tone(note(seq[i%8]-12),b/2*0.9,6,(1,.6,.3)),0.09)
    if i%2==0: kk=np.arange(int(SR*.2))/SR; add(t0,np.sin(2*np.pi*(55+70*np.exp(-kk*35))*kk)*np.exp(-kk*16),0.22)
    if i%4==2: add(t0,noise(.14,25),0.06)
    add(t0,noise(.03,90),0.02)
# crowd murmur during the race + roll noise
n=int(SR*st["xray"]); x=np.convolve(rng.standard_normal(n),np.ones(60)/60,"same"); add(0,x*np.minimum(1,np.arange(n)/SR/0.5),0.6)
add(st["xray"]+0.4,tone(2400,1.2,1.5,(1,)),0.04)                          # x-ray hum
add(st["switch"]+0.9,noise(0.05,80),0.25); add(st["switch"]+1.0,tone(1800,0.3,8,(1,)),0.08)   # click + zap
add(st["gate"],tone(60,1.8,0.8,(1,.5)),0.25)                               # magnet hum
add(st["yank"]+0.6,tone(80,0.3,10,(1,.6)),0.4); add(st["yank"]+0.6,noise(0.3,10),0.2)   # gate clang
add(st["title"]+1.3,noise(0.6,4)*np.sin(np.linspace(0,np.pi,int(SR*.6))),0.12)
# record-scratch stop, then the brand section: bright and calm
add(P-0.05,noise(0.35,8)*np.sin(np.linspace(0,30,int(SR*.35))),0.25)
b2=60/92; prog=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-P)/b2)):
    t0=P+0.3+i*b2; ch=prog[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.1,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.1)*np.minimum(1,(DUR-tt)/0.8); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
