import json, numpy as np, soundfile as sf
SR=24000; tl=json.load(open("web/tl.json")); DUR=tl["dur"]; N=int(SR*DUR); t=np.arange(N)/SR; out=np.zeros(N)
rng=np.random.default_rng(3); note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    tt=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*tt) for i,a in enumerate(h))*np.exp(-tt*dec)
def noise(d,dec=6): tt=np.arange(int(SR*d))/SR; return rng.standard_normal(len(tt))*np.exp(-tt*dec)
def whoosh(d,f0=300,f1=2500):
    n=int(SR*d); x=rng.standard_normal(n); y=np.zeros(n); fc=np.geomspace(f0,f1,n); a=0
    for i in range(n): k=fc[i]/SR*2*np.pi; a=a+(x[i]-a)*min(1,k); y[i]=a
    return y*np.sin(np.linspace(0,np.pi,n))*3
S={}; [S.setdefault(l["shot"],l["s"]) for l in tl["lines"]]
# chill, bouncy lo-fi loop: Rhodes-ish chords, sub bass, kick/snare/hats at 92 bpm
bpm=92; beat=60/bpm; prog=[[62,65,69,72],[60,64,67,71],[58,62,65,69],[57,60,64,67]]
for bar in range(int(DUR/(beat*4))+1):
    t0=bar*beat*4; ch=prog[bar%4]
    for m in ch: add(t0,tone(note(m),beat*3.8,1.1,(1,.3,.08)),0.035); add(t0+beat*2.5,tone(note(m),beat*1.4,2.5,(1,.3,.08)),0.02)
    add(t0,tone(note(ch[0]-24),beat*1.8,2.2,(1,.2)),0.12); add(t0+beat*2.5,tone(note(ch[0]-24),beat*1.2,3,(1,.2)),0.09)
    for k in range(4):
        tk=t0+k*beat
        if k in (0,2): kk=np.arange(int(SR*.25))/SR; add(tk,np.sin(2*np.pi*(50+90*np.exp(-kk*30))*kk)*np.exp(-kk*14),0.32)
        if k in (1,3): add(tk,noise(.18,22),0.08)
        add(tk+beat/2,noise(.05,60),0.035); add(tk,noise(.04,70),0.025)
# sfx
add(S["fall"],whoosh(1.0,200,3000),0.18); add(S["fall"]-0.05,tone(180,0.3,10,(1,.6,.3))*np.exp(-np.arange(int(SR*.3))/SR*2),0.25)       # boing off the lemon
m=S["mech"]
for i in range(7): add(m+0.15+i*0.15,noise(0.08,40),0.12); add(m+0.15+i*0.15,tone(1400+i*120,0.1,30),0.12)                       # armor clanks
add(m+1.0,whoosh(2.4,150,1200),0.2); add(m+1.0,noise(2.4,0.6),0.06)                                             # jets
add(m+2.3,tone(1800,0.35,4,(1,.5))*np.sin(np.linspace(0,60,int(SR*.35))),0.15)                           # zap
add(m+2.5,noise(1.4,3.2),0.45); add(m+2.5,tone(55,1.2,3,(1,.5)),0.45)                                                     # boom
add(S["fly"],whoosh(1.2,250,2200),0.15); add(S["toss"]+0.6,whoosh(0.5,600,3000),0.12); add(S["phone"],tone(1568,0.12,20),0.1); add(S["phone"]+0.1,tone(2093,0.2,15),0.1)
v,_=sf.read("voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); music=out*(1-0.5*np.minimum(1,env/0.04))
m_=music+vv*1.1; m_*=np.minimum(1,t/0.25)*np.minimum(1,(DUR-t)/0.6); m_/=np.abs(m_).max()/0.93
sf.write("mix.wav",m_.astype(np.float32),SR); print("ok")
