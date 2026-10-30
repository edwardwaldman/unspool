import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adO"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(19); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; L={l["shot"]:l for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(48+60*np.exp(-kk*30))*kk)*np.exp(-kk*13)
P=st["pivot"]; DR=L["hook"]["e"]-1.25
add(0,np.convolve(rng.standard_normal(int(SR*4)),np.ones(200)/200,"same"),0.22)          # room tone
add(DR,tone(note(64),0.5,4,(1,.3)),0.1); add(DR+0.35,tone(note(57),0.9,3,(1,.3)),0.1)     # battery drains
add(st["how"]+0.3,noise(1.0,1.5)*np.sin(np.linspace(0,np.pi,int(SR*1.0))),0.12)
b=60/108; prog=[[60,64,67,71],[57,60,64,67],[65,69,72,76],[62,65,69,72]]
for i in range(int((P-st["feels"])/(b/2))):
    t0=st["feels"]+i*b/2; ch=prog[(i//8)%4]
    add(t0,tone(note(ch[i%4]+12),b*0.9,3,(1,.2)),0.03)
    if i%8==0:
        for m in ch[:3]: add(t0,tone(note(m),b*4,0.6,(1,.3)),0.025)
    if i%2==0: add(t0,kick(),0.12)
    if i%4==2: add(t0,noise(.08,35),0.04)
for j in range(4): add(st["feels"]+0.1+j*0.5+0.9,tone(note(84+j*2),0.12,20,(1,)),0.05)
add(st["test"]+0.3,tone(note(72),0.2,12,(1,.3)),0.08)                                      # bubble pop
add(st["test"]+1.0,noise(0.5,6),0.35); add(st["test"]+1.0,tone(45,1.0,4,(1,.6)),0.5)       # shatter
for k in range(8): add(st["test"]+1.05+k*0.05,noise(0.03,90),0.1)
per=(L["fix"]["e"]-L["fix"]["s"]+0.3-0.2)/5
for q in range(5): t0=st["fix"]+q*per; [add(t0+j*0.05,tone(note(m+q),0.4,7,(1,.3)),0.08) for j,m in enumerate([76,79,84])]
add(P,noise(0.4,6),0.1)
b2=60/92; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-P)/b2)):
    t0=P+0.2+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
add(P+0.75,tone(note(83),0.6,4,(1,.3)),0.08)
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
