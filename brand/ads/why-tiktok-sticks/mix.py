# Sound for "why TikTok sticks": a soft, bouncy lo-fi bed, a chalk pop on each new point.
import json, os, sys, numpy as np, soundfile as sf
D = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(3); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.1 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): k=np.arange(int(SR*.18))/SR; return np.sin(2*np.pi*(55+60*np.exp(-k*30))*k)*np.exp(-k*16)
b=60/92; prog=[[60,64,67,71],[57,60,64,67],[62,65,69,72],[55,59,62,65]]
for i in range(int((DUR-1)/(b/2))):
    t0=0.2+i*b/2; ch=prog[(i//8)%4]
    add(t0,tone(note(ch[[0,2,1,3,2,1,3,2][i%8]]+12),0.4,6,(1,.25)),0.035)
    if i%4==0: add(t0,kick(),0.09)
    if i%4==2: add(t0,noise(0.06,40),0.03)
    if i%8==0: [add(t0,tone(note(m),b*4,0.8,(1,.3)),0.018) for m in ch[:3]]
add(st["final"]+0.3,tone(note(52),1.2,1.5,(1,.4)),0.05)
for s in ("hi","short","dual","again","retell","final","none","fix","unspool","cta"): add(st[s],tone(note(84),0.15,18,(1,.3)),0.07); add(st[s]+0.05,tone(note(91),0.2,14,(1,.3)),0.05)

for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.06,tone(note(m),1.2,2.5,(1,.3)),0.08)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.35*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
