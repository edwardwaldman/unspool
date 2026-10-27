import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adD"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(3); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.12 for l in tl["lines"]}; L={l["shot"]:l for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.22))/SR; return np.sin(2*np.pi*(50+90*np.exp(-kk*30))*kk)*np.exp(-kk*12)
IMPACT=0.15+0.75*0.364
# hard-driving 140 bpm beat from the impact to the CTA
b=60/124; prog=[[62,66,69],[59,62,66],[55,59,62],[57,61,64]]
for i in range(int((st["cta"]-IMPACT)/(b/2))):
    t0=IMPACT+i*b/2; ch=prog[(i//8)%4]
    if i%2==0: add(t0,kick(),0.32)
    if i%4==2: add(t0,noise(.14,22),0.09)
    add(t0,noise(.025,110),0.035)
    add(t0,tone(note(ch[i%3]+12),b/2*0.9,8,(1,.3)),0.04)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,1.0,(1,.5)),0.1)
# falling whistle + impact
n=int(SR*IMPACT); f=np.linspace(1400,300,n); add(0,np.sin(2*np.pi*np.cumsum(f)/SR)*np.linspace(0.2,1,n),0.05)
add(IMPACT,tone(48,0.8,5,(1,.6,.3)),0.7); add(IMPACT,noise(0.35,12),0.35)
# upload zip: rising ticks
for k in range(12): add(st["upload"]+k*0.065,tone(900+k*90,0.04,60,(1,)),0.06)
add(st["upload"]+0.8,tone(note(88),0.25,10,(1,)),0.08)
# unspool whoosh + riffle
n=int(SR*1.3); add(st["unspool"],noise(1.3,1.2)*np.sin(np.linspace(0,np.pi,n)),0.2)
for k in range(24): add(st["unspool"]+k*0.035,noise(0.04,70),0.06)
# doc->reels: pop, ring, card flips
add(st["reels"]+0.1,tone(note(76),0.2,14,(1,.4)),0.12); add(st["reels"]+0.75,tone(note(83),0.6,4,(1,.3)),0.1)
for j in range(3): add(st["reels"]+0.95+j*0.12,noise(0.06,50),0.12)
# feature chip slams
seg=(L["features"]["e"]-L["features"]["s"]+0.1)/3
for j in range(3): t0=st["features"]+j*seg; add(t0,kick(),0.25); add(t0,tone(note(79+j*3),0.3,9,(1,.3)),0.1)
# swipe ticks every 0.3s
k=0
while st["swipe"]+k*0.5<st["cta"]: add(st["swipe"]+k*0.5+0.3,noise(0.12,25)*np.sin(np.linspace(0,np.pi,int(SR*.12))),0.14); k+=1
# CTA: slam + bright chord
add(st["cta"],kick(),0.35); add(st["cta"],noise(0.3,10),0.15)
for j,m in enumerate([74,78,81,86]): add(st["cta"]+0.05+j*0.07,tone(note(m),1.4,2,(1,.3)),0.1)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.45*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
