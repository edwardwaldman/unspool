import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adE"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(5); tt=np.arange(N)/SR
st={l["shot"]:l["s"] for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
P=st["learned"]-0.1
# documentary pulse: soft plucked arpeggio in D minor, 96 bpm, darker after the "no"
b=60/96; up=[[62,65,69],[58,62,65],[60,64,67],[57,61,64]]; down=[[62,65,69],[58,62,65],[55,58,62],[57,60,64]]
for i in range(int(P/(b/2))):
    t0=i*b/2; prog=up if t0<st["no"] else down; ch=prog[(i//8)%4]
    add(t0,tone(note(ch[i%3]+12),b*0.9,4,(1,.25)),0.04)
    if i%8==0: add(t0,tone(note(ch[0]-24),b*4,0.8,(1,.5,.2)),0.09)
    if t0>st["grow"] and i%2==0: kk=np.arange(int(SR*.18))/SR; add(t0,np.sin(2*np.pi*(50+60*np.exp(-kk*30))*kk)*np.exp(-kk*14),0.14)
    if t0>st["grow"] and i%4==2: add(t0,noise(.08,40),0.03)
# pops as the grid fills, a low boom for "one", a stamp thud, a falling sweep for bankruptcy
for k in range(14): add(st["grid"]+k*0.12,tone(900+k*40,0.08,40,(1,)),0.03)
add(st["one"]+0.9,tone(45,1.6,1.5,(1,.5)),0.35)
add(st["no"]+0.3,tone(80,0.3,12,(1,.6)),0.5); add(st["no"]+0.3,noise(0.15,25),0.2)
n=int(SR*1.5); f=np.linspace(600,90,n); add(st["bankrupt"]+0.2,np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-np.arange(n)/SR*1.5),0.07)
add(st["bend"]+0.5,tone(note(74),2.0,1.2,(1,.3)),0.07)
add(P,noise(0.4,6),0.1)
# brand section: bright and calm
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
