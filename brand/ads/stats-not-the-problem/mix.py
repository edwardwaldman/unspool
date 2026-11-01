import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adR"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(37); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(48+50*np.exp(-kk*30))*kk)*np.exp(-kk*13)
# calm, reflective piano + soft pulse (like the reference), lifting at "chance" and again at the product
b=60/90; prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]
for i in range(int(DUR/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]; lift=t0>st["chance"]; prod=t0>st["reels"]
    add(t0,tone(note(ch[i%3]+12),b*0.9,3.5,(1,.2)),0.03)
    if i%8==0:
        for m in ch: add(t0,tone(note(m),b*4,0.6,(1,.3)),0.022)
        add(t0,tone(note(ch[0]-12),b*4,0.8,(1,.4)),0.06)
    if lift and i%4==0: add(t0,kick(),0.1+0.05*prod)
    if prod and i%4==2: add(t0,noise(.08,35),0.035)
add(st["test"]+0.5,tone(note(45),1.2,2,(1,.6)),0.2); add(st["test"]+0.55,noise(0.2,20),0.15)        # 61 stamp
add(st["test"]+0.95,noise(0.2,20),0.15); [add(st["test"]+1.0+j*0.06,tone(note(m),0.5,6,(1,.3)),0.08) for j,m in enumerate([72,76,79])]   # 94 stamp
for j in range(3): add(st["reread"]+j*1.2,noise(0.25,14),0.1)                                  # page flips
for x in range(4): add(st["closed"]+x*0.9,tone(note(76+x*2),0.25,10,(1,.3)),0.07)               # quiz dings
add(st["recall"]+0.4,np.sin(np.linspace(0,np.pi,int(SR*1.2)))*tone(note(64),1.2,0.5,(1,.3)),0.07)
for k,s in enumerate(["hl","mom","gpt"]): add(st[s],noise(0.12,25),0.12)
add(st["passive"],tone(note(48),1.0,2,(1,.5)),0.12)
for j in range(3): add(st["reels"]+0.95+j*0.12,noise(0.06,50),0.1)
add(st["quiz"]+2.4,tone(note(84),0.4,7,(1,.3)),0.08)
add(st["why"]+0.5,tone(note(52),0.4,6,(1,.5)),0.1); add(st["why"]+0.9,tone(note(83),0.5,6,(1,.3)),0.08)
for j,m in enumerate([72,76,79,84]): add(st["cta"]+j*0.08,tone(note(m),1.2,2,(1,.3)),0.09)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.15
m*=np.minimum(1,tt/0.05)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
