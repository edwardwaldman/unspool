import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adK"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(17); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; L={l["shot"]:l for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(45+70*np.exp(-kk*30))*kk)*np.exp(-kk*12)
P=st["pivot"]
# hook: frantic stopwatch ticks + heartbeat, a buzzer when it hits 6:00:00
for k in range(26): add(0.05+k*0.1,tone(2400,0.025,100,(1,)),0.05)
for k in range(8): t0=k*0.45; add(t0,kick(),0.38); add(t0+0.16,kick(),0.22)
add(2.6,tone(220,0.5,3,(1,.8,.5)),0.12)
add(st["how"]+0.6,noise(0.8,3)*np.sin(np.linspace(0,np.pi,int(SR*.8))),0.15)
# tense pulse
b=60/128; prog=[[57,60,64],[53,57,60],[55,58,62],[52,56,59]]
for i in range(int((P-st["cram"])/(b/2))):
    t0=st["cram"]+i*b/2; ch=prog[(i//8)%4]
    if i%2==0: add(t0,kick(),0.18)
    if i%4==2: add(t0,noise(.1,30),0.05)
    add(t0,noise(.02,120),0.025)
    add(t0,tone(note(ch[i%3]+12),b/2*0.9,7,(1,.3)),0.035)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,1.0,(1,.5)),0.08)
for k in range(16): add(st["cram"]+0.1+k*0.08,tone(1000+k*60,0.04,60,(1,)),0.04)   # memories flooding in
# each day: a low hit + descending blip
dayLen=(L["forget"]["e"]-L["forget"]["s"]+0.4)/5
for d in range(5): t0=st["forget"]+d*dayLen; add(t0,tone(42,0.7,5,(1,.6)),0.5); add(t0,noise(0.2,18),0.18); add(t0+0.05,tone(note(64-d*3),0.3,8,(1,.3)),0.08)
# reviews: bright rising chimes
per=(L["space"]["e"]-L["space"]["s"]+0.3-0.2)/3
for r in range(3): t0=st["space"]+r*per; [add(t0+j*0.06,tone(note(m+r*2),0.5,5,(1,.3)),0.09) for j,m in enumerate([76,81,84])]
add(P,noise(0.4,6),0.1)
b2=60/92; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-P)/b2)):
    t0=P+0.2+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
add(P+0.75,tone(note(83),0.6,4,(1,.3)),0.08)
for d in range(5): add(P+2.4+0.3+d*0.25,tone(note(76+d*2),0.2,12,(1,)),0.07)   # streak ticks
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.45*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
