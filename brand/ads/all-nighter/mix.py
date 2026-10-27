import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adJ"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(13); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(45+70*np.exp(-kk*30))*kk)*np.exp(-kk*12)
F0=st["fail"]+0.25; P=st["pivot"]
# hook: heartbeat + clock ticks speeding up
for k in range(8): t0=k*0.42; add(t0,kick(),0.4); add(t0+0.16,kick(),0.25)
for k in range(12): add(0.1+k*0.27,tone(2200,0.03,90,(1,)),0.05)
add(st["how"]+0.6,noise(0.8,3)*np.sin(np.linspace(0,np.pi,int(SR*.8))),0.15)   # dive whoosh
# tense pulse 128 bpm under the science, minor, rising
b=60/128; prog=[[57,60,64],[53,57,60],[55,58,62],[52,56,59]]
for i in range(int((P-st["temp"])/(b/2))):
    t0=st["temp"]+i*b/2; ch=prog[(i//8)%4]
    if i%2==0: add(t0,kick(),0.2)
    if i%4==2: add(t0,noise(.1,30),0.06)
    add(t0,noise(.02,120),0.025)
    add(t0,tone(note(ch[i%3]+12),b/2*0.9,7,(1,.3)),0.04)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,1.0,(1,.5)),0.09)
for j in range(4): add(st["temp"]+0.2+j*0.45+0.8,tone(note(88-j*2),0.12,20,(1,)),0.05)   # words drop in
n=int(SR*(F0-st["save"])); f=np.linspace(300,700,n); add(st["save"],np.sin(2*np.pi*np.cumsum(f)/SR)*0.5,0.05)   # saving riser
# SAVE FAILED: glitch crash + alarm
add(F0,noise(0.5,6),0.4); add(F0,tone(40,1.0,4,(1,.6)),0.6)
for k in range(5): t0=F0+0.2+k*0.36; add(t0,tone(880,0.17,2,(1,.3)),0.07); add(t0+0.18,tone(660,0.17,2,(1,.3)),0.07)
for k in range(10): add(F0+0.05+k*0.06,noise(0.03,90)*(-1)**k,0.12)
for q in range(3): t0=st["quiz"]+q*1.0+0.5; [add(t0+j*0.06,tone(note(m),0.4,7,(1,.3)),0.08) for j,m in enumerate([76,79,84])]
add(P,noise(0.4,6),0.1)
b2=60/92; pr=[[69,72,76],[65,69,72],[67,71,74],[64,67,71]]
for i in range(int((DUR-P)/b2)):
    t0=P+0.2+i*b2; ch=pr[(i//4)%4]
    for m in ch: add(t0,tone(note(m+12),b2*0.8,4,(1,.2)),0.025)
    add(t0,tone(note(ch[0]-12),b2,2,(1,.3)),0.08)
add(P+0.75,tone(note(83),0.6,4,(1,.3)),0.08); add(P+2.5,tone(note(86),0.8,3,(1,.3)),0.08)
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.45*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
