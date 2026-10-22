import json, numpy as np, soundfile as sf
SR=24000; tl=json.load(open("web/tl.json")); DUR=tl["dur"]; N=int(SR*DUR); t=np.arange(N)/SR; out=np.zeros(N)
note=lambda m:440*2**((m-69)/12)
def add(t0,x,gn):
    a=int(t0*SR); b=min(N,a+len(x))
    if a<N: out[a:b]+=x[:b-a]*gn
def sq(f,d,dec=6): tt=np.arange(int(SR*d))/SR; return np.sign(np.sin(2*np.pi*f*tt))*np.exp(-tt*dec)*0.5
S={l["shot"]:l["s"] for l in tl["lines"]}
prog=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]]; beat=0.25
for i in range(int(DUR/beat)):
    t0=i*beat; ch=prog[(i//16)%4]; bright=t0>S["unspool"]-0.3
    if bright: ch=[[60,64,67],[65,69,72],[67,71,74],[60,64,67]][(i//16)%4]
    add(t0,sq(note(ch[i%3]+12),0.2,14),0.05)
    if i%4==0: add(t0,sq(note(ch[0]-12),0.4,5),0.06)
for k,sh in enumerate(["pages","hours","forget","sunrise","reels"]): add(S[sh]+0.3,sq(1320,0.08,30),0.12); add(S[sh]+0.38,sq(1760,0.08,30),0.12)
for k in range(10): add(S["reels"]+k*0.16,sq(880+k*80,0.05,40),0.08)
v,_=sf.read("voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.55*np.minimum(1,env/0.04))+vv
m*=np.minimum(1,t/0.3)*np.minimum(1,(DUR-t)/0.5); m/=np.abs(m).max()/0.92
sf.write("mix.wav",m.astype(np.float32),SR); print("ok")
