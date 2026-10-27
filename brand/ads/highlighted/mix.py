import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adG"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(9); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
# hook: soft room tone + a sad two-note drop when the battery drains
add(0,np.convolve(rng.standard_normal(int(SR*4.5)),np.ones(200)/200,"same"),0.25)
DR=tl["lines"][0]["e"]-1.25; add(DR,tone(note(64),0.5,4,(1,.3)),0.1); add(DR+0.35,tone(note(57),0.9,3,(1,.3)),0.1)
# "But how?" whoosh into the head
n=int(SR*1.0); add(st["how"]+0.3,noise(1.0,1.5)*np.sin(np.linspace(0,np.pi,n)),0.12)
# science bed: airy pads + soft pulse, 100 bpm
b=60/100; prog=[[60,64,67,71],[57,60,64,67],[65,69,72,76],[62,65,69,72]]
for i in range(int((st["pivot"]-st["reread"])/(b/2))):
    t0=st["reread"]+i*b/2; ch=prog[(i//8)%4]
    add(t0,tone(note(ch[i%4]+12),b*0.9,3,(1,.2)),0.03)
    if i%8==0:
        for m in ch[:3]: add(t0,tone(note(m),b*4,0.6,(1,.3)),0.025)
    if i%2==0: kk=np.arange(int(SR*.16))/SR; add(t0,np.sin(2*np.pi*(52+50*np.exp(-kk*30))*kk)*np.exp(-kk*15),0.1)
for j in range(4): add(st["reread"]+0.3+j*0.75+1.1,tone(note(84+j*2),0.3,10,(1,)),0.05)   # words land
[add(st["recall"]+2.8+j*0.07,tone(note(m),0.4,6,(1,.3)),0.08) for j,m in enumerate([76,81,88])]   # recall lands
for q in range(3): t0=st["quiz"]+q*1.1+0.55; [add(t0+j*0.07,tone(note(m),0.4,7,(1,.3)),0.08) for j,m in enumerate([76,79,84])]
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.1,tone(note(m),1.2,2,(1,.3)),0.09)
b2=60/92; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-st["pivot"])/b2)):
    t0=st["pivot"]+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.6); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
