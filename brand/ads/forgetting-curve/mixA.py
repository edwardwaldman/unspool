import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adA"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(11)
st={}; [st.setdefault(l["shot"],l["s"]) for l in tl["lines"]]
note=lambda m:440*2**((m-69)/12); tt=np.arange(N)/SR
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
# part 1 (story): soft music-box arpeggio; part 2 (product): pulsing synth + kick, starting at "logo"
P=st["logo"]-0.15; b=60/96
arp=[[69,72,76,79],[65,69,72,76],[67,71,74,77],[64,67,71,76]]
for i in range(int(P/(b/2))):
    ch=arp[(i//8)%4]; add(i*b/2, tone(note(ch[i%4]+12),0.6,5,(1,.2)), 0.05)
    if i%8==0: add(i*b/2, tone(note(ch[0]-12),b*4,0.8,(1,.3)), 0.06)
for i in range(int((DUR-P)/b)):
    t0=P+i*b; ch=arp[(i//4)%4]
    kk=np.arange(int(SR*.25))/SR; add(t0, np.sin(2*np.pi*(48+80*np.exp(-kk*30))*kk)*np.exp(-kk*12), 0.3)
    add(t0+b/2, noise(0.05,60), 0.04)
    for m in ch[:3]: add(t0, tone(note(m),b*0.9,3,(1,.6,.3,.15)), 0.025)
    add(t0, tone(note(ch[0]-24),b*0.9,3,(1,.3)), 0.1)
add(P, noise(0.8,3), 0.12)                                      # whoosh into product
add(st["named"]-0.1, tone(130,0.4,8,(1,.7,.4)), 0.3)            # stamp
for k in range(3): add(st["check"]+0.4+k*0.45, tone(note(84+k*3),0.25,10,(1,.3)), 0.12)  # ticks
add(st["free"], tone(note(88),0.6,4,(1,.3)), 0.12)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); music=out*(1-0.4*np.minimum(1,env/0.04))
m=music+vv*1.15; m*=np.minimum(1,tt/0.15)*np.minimum(1,(DUR-tt)/0.8); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
