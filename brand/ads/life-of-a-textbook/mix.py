import json, numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adW"
tl=json.load(open(f"{D}/web/tl.json")); DUR=tl["dur"]; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(11); tt=np.arange(N)/SR
st={l["shot"]:l["s"]-0.1 for l in tl["lines"]}; note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def pluck(f,d=0.5): t=np.arange(int(SR*d))/SR; return (np.sin(2*np.pi*f*t)+0.4*np.sin(4*np.pi*f*t)+0.15*np.sin(6*np.pi*f*t))*np.exp(-t*7)
def kick(): k=np.arange(int(SR*.2))/SR; return np.sin(2*np.pi*(50+70*np.exp(-k*30))*k)*np.exp(-k*14)
def swoosh(d=0.3): n=noise(d,1); env=np.sin(np.linspace(0,np.pi,len(n)))**2; return np.convolve(n,np.ones(8)/8,"same")*env
# a light, bouncy ukulele-ish bed (major), sadder for the low point, back up after Priya
b=60/104; happy=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]]; sad=[[57,60,64],[53,57,60],[52,55,59],[52,56,59]]
low0, low1 = st["night"], st["priya"]
for i in range(int(DUR/(b/2))):
    t0=i*b/2
    if t0>st["cta"]+1.6: break
    sadness = low0<=t0<low1
    ch=(sad if sadness else happy)[(i//8)%4]
    pat=[0,2,1,2,0,2,1,2][i%8]
    add(t0,pluck(note(ch[pat]+12),0.4),0.06 if not sadness else 0.045)
    if i%4==0: add(t0,pluck(note(ch[0]),0.9),0.07)
    if not sadness and i%4==2: add(t0,noise(0.05,60),0.03)
    if not sadness and i%2==0: add(t0,kick(),0.05)
for s in st:
    if s not in ("title","end"): add(st[s],swoosh(0.22),0.05)
for j in range(3): add(st["new"]+0.2+j*0.18,tone(note(88+j*3),0.4,8,(1,.3)),0.05)                 # sparkle
t=np.arange(int(SR*1.6))/SR; sq=np.sin(2*np.pi*(1800+300*np.sin(t*9))*t)*0.3*(rng.standard_normal(len(t))*0.3+1)*np.exp(-((t%0.2)-0.1)**2*80); add(st["highlight"]+0.3,sq,0.03)  # highlighter squeaks
add(st["never"]+0.2,kick(),0.3); add(st["never"]+0.2,noise(0.3,10),0.08)                          # book thud
for k in range(4): add(st["backpack"]+0.2+k*0.06,noise(0.04,80),0.06)                              # zipper
add(st["banana"]+0.3,np.convolve(noise(0.3,12),np.ones(30)/30,"same"),0.6)                          # squish
for k in range(int(len(t)/SR*3)): pass
fl=np.arange(int(SR*1.5))/SR; add(st["banana"]+0.6,np.sin(2*np.pi*(220+20*np.sin(fl*40))*fl)*0.5*np.exp(-fl*0.5),0.015)  # fly buzz
for k in range(6): add(st["night"]+0.1+k*0.5,tone(2000,0.03,90,(1,)),0.06)                           # clock ticks
for k in range(5): add(st["reread"]+0.2+k*0.45,swoosh(0.12),0.12)                                   # page flips
add(st["exam"]+0.8,tone(note(84),1.2,1.5,(1,.2)),0.025)                                            # blank tone
for j,m in enumerate([62,61,60,59]): add(st["grade"]+0.05+j*0.32,tone(note(m-12),0.45 if j<3 else 1.0,2.5,(1,.7,.5,.3)),0.09)   # sad trombone
for k in range(3): add(st["cried"]+0.2+k*0.45,tone(note(76-k),0.25,9,(1,.3)),0.03)
for k in range(4): add(st["priya"]+0.05+k*0.22,kick(),0.08)                                        # footsteps
add(st["priya"]+1.2,tone(note(79),0.3,9,(1,.3)),0.08); add(st["priya"]+1.32,tone(note(84),0.5,7,(1,.3)),0.08)   # phone ding
add(st["upload"]+0.3,tone(note(72),0.08,40,(1,)),0.08); add(st["upload"]+1.2,tone(note(84),0.4,8,(1,.3)),0.07)
for j in range(3): add(st["reels"]+0.15+j*0.15,tone(note(72+j*4),0.25,10,(1,.3)),0.09); add(st["reels"]+0.15+j*0.15,kick(),0.12)
r=np.arange(int(SR*1.8))/SR; add(st["bus"],np.convolve(rng.standard_normal(len(r)),np.ones(200)/200,"same")*np.sin(np.pi*r/1.8),0.6)  # bus rumble
for j,m in enumerate([67,72,76,79,84]): add(st["aminus"]+j*0.07,tone(note(m),1.0,2.5,(1,.4,.2)),0.08)          # fanfare
add(st["aminus"],noise(0.8,4),0.06)
add(st["door"]+0.2,kick(),0.25)
for j,m in enumerate([72,76,79,84,88]): add(st["cta"]+j*0.06,tone(note(m),1.4,2,(1,.3)),0.08)
v,_=sf.read(f"{D}/voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); m=out*(1-0.4*np.minimum(1,env/0.04))+vv*1.2
m*=np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.5); m/=np.abs(m).max()/0.93
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
