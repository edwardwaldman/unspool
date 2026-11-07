import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adY"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(23); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.1 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def pad(f,d): t=np.arange(int(SR*d))/SR; env=np.minimum(1,t/0.8)*np.minimum(1,(d-t)/0.8); return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*f*2.003*t))*env
def kick(): k=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(50+70*np.exp(-k*30))*k)*np.exp(-k*14)
F=st["fix"]
# night: slow minor pads and a soft room hiss, the 1 AM feel
for j,ch in enumerate([[57,60,64],[53,57,60],[55,59,62],[52,55,59]]):
    t0=j*2.6
    if t0>F: break
    for m in ch: add(t0,pad(note(m-12),min(3.2,F-t0+0.6)),0.035)
add(0,np.convolve(rng.standard_normal(int(SR*F)),np.ones(300)/300,"same"),0.25)
for k in range(6): add(st["night"]+k*0.5,tone(2000,0.03,90,(1,)),0.05)          # clock tick
for k in range(int(len("And you still")/1)): pass
for k in range(5): add(st["three"]+0.3+k*0.42,noise(0.14,12)*np.linspace(1,0,int(SR*0.14)),0.12)   # page flips
add(st["three"]+0.6,kick(),0.35); add(st["gone"]+0.35,kick(),0.45); add(st["gone"]+0.35,noise(0.2,16),0.2)   # stamps
add(st["gone"]+0.5,tone(note(52),1.4,1.5,(1,.4)),0.06)
# Unspool: brighter, a light pulse in a major key
b=60/100; prog=[[60,64,67],[57,60,64],[65,69,72],[67,71,74]]
for i in range(int((st["count"]+1.6-F)/(b/2))):
    t0=F+i*b/2; ch=prog[(i//8)%4]
    add(t0,tone(note(ch[i%3]+12),0.35,7,(1,.3)),0.04)
    if i%4==0: add(t0,pad(note(ch[0]-12),b*2.2),0.04)
    if i%2==0: add(t0,kick(),0.06)
add(F,tone(note(79),0.3,9,(1,.3)),0.08); add(F+0.12,tone(note(84),0.5,7,(1,.3)),0.08)                      # app opens
for j in range(3): add(st["snap"]+0.7+j*0.27,tone(note(72+j*4),0.25,10,(1,.3)),0.08)                    # reels pop in
for j,m in enumerate([76,83]): add(st["quiz"]+1.4+j*0.08,tone(note(m),0.5,6,(1,.3)),0.09)                # right answer
add(st["sticks"]+0.5,kick(),0.4); for_=None
for j,m in enumerate([72,76,79,84]): add(st["sticks"]+0.55+j*0.06,tone(note(m),0.9,3,(1,.3)),0.06)
for j,m in enumerate([72,76,79,84,88]): add(st["count"]+0.4+j*0.07,tone(note(m),1.4,2,(1,.3)),0.08)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.35*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
