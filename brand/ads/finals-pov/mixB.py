import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad"; D=f"{S}/adB"
k=Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
SR=24000; DUR=33.0; N=int(SR*DUR); out=np.zeros(N); voice=np.zeros(N); rng=np.random.default_rng(4); tt=np.arange(N)/SR
note=lambda m:440*2**((m-69)/12)
def add(buf,t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: buf[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def say(t0,text,v="af_bella",sp=1.0,g=1.0):
    a,_=k.create(text,voice=v,speed=sp,lang="en-us"); a=a.astype(np.float32); nz=np.where(np.abs(a)>0.01)[0]; add(voice,t0,a[nz[0]:nz[-1]],g)
say(0.9,"Okay. Lock in.",sp=0.9)
say(26.65,"Wow.",sp=0.85); say(27.5,"I actually get this.",sp=1.0)
import json
for i,t0 in enumerate(json.load(open(f"{D}/vo_times.json"))):
    clip,_=sf.read(f"{D}/vo_{i}.wav"); add(voice,t0,clip,1.0)
# lo-fi bed 84 bpm
b=60/84; prog=[[64,67,71,74],[60,64,67,71],[62,65,69,72],[59,62,66,69]]
for bar in range(int(DUR/(b*4))+1):
    t0=bar*b*4; ch=prog[bar%4]
    for m in ch: add(out,t0,tone(note(m),b*3.8,1.0,(1,.3,.08)),0.03)
    add(out,t0,tone(note(ch[0]-24),b*1.8,2,(1,.2)),0.1); add(out,t0+b*2.5,tone(note(ch[0]-24),b,3,(1,.2)),0.08)
    for q in range(4):
        tq=t0+q*b
        if q in (0,2): kk=np.arange(int(SR*.25))/SR; add(out,tq,np.sin(2*np.pi*(50+80*np.exp(-kk*30))*kk)*np.exp(-kk*14),0.28)
        if q in (1,3): add(out,tq,noise(.16,22),0.06)
        add(out,tq+b/2,noise(.04,70),0.025)
# sfx: typing, bubble pops, printer, laptop close, whoosh, chimes
for i in range(32): add(out,2.5+i*0.068+rng.uniform(0,.02),noise(0.02,200),0.09)
for t in [3.0,5.0,6.6,8.0,11.8,12.9,15.6,16.8]: add(out,t,tone(1250 if t not in (5.0,8.0,12.9,16.8) else 900,0.08,40,(1,)),0.12)
for t0,d in [(8.6,3.4),(13.4,2.6)]:
    n=int(SR*d); x=rng.standard_normal(n)*0.4+np.sign(np.sin(2*np.pi*55*np.arange(n)/SR))*0.6; add(out,t0,x*np.minimum(1,np.arange(n)/2000)*np.minimum(1,(n-np.arange(n))/2000),0.05)
add(out,18.6,tone(196,0.35,3,(1,.6,.3)),0.12); add(out,18.95,tone(185,0.35,3,(1,.6,.3)),0.12); add(out,19.3,tone(175,0.7,2,(1,.6,.3)),0.12)  # sad wah
add(out,19.45,tone(90,0.2,20,(1,.5)),0.4); add(out,19.45,noise(0.08,40),0.2)                   # lid shut
add(out,20.1,noise(0.5,5)*np.sin(np.linspace(0,np.pi,int(SR*.5))),0.15)
for j,m in enumerate([76,79,83,88]): add(out,22.25+j*0.08,tone(note(m),0.5,5,(1,.3)),0.1)
for j,m in enumerate([72,76,79,84]): add(out,29.7+j*0.1,tone(note(m),1.4,1.6,(1,.3)),0.1)
env=np.convolve(np.abs(voice),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+voice*1.1
m*=np.minimum(1,tt/0.15)*np.minimum(1,(DUR-tt)/0.8); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
