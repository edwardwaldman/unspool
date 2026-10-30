import numpy as np, soundfile as sf
D="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/adP"
DUR=17.5; SR=24000; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(31); tt=np.arange(N)/SR
note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    t=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*t) for i,a in enumerate(h))*np.exp(-t*dec)
def noise(d,dec=6): t=np.arange(int(SR*d))/SR; return rng.standard_normal(len(t))*np.exp(-t*dec)
def kick(): kk=np.arange(int(SR*.22))/SR; return np.sin(2*np.pi*(46+70*np.exp(-kk*28))*kk)*np.exp(-kk*11)
T=dict(cam=6.6,snap=8.05,load=8.9,reel=10.1,swipe=13.55,quiz=13.9,tap=15.0,end=16.1)
# bouncy, trend-style beat at 128 bpm: kick, clap, hats, plucky chords
b=60/128; prog=[[64,68,71],[61,64,68],[57,61,64],[59,63,66]]
for i in range(int(DUR/(b/2))):
    t0=i*b/2; ch=prog[(i//8)%4]
    if i%2==0: add(t0,kick(),0.32)
    if i%4==2: add(t0,noise(.12,26),0.13)
    add(t0+b/4,noise(.03,90),0.035)
    add(t0,tone(note(ch[(i*2)%3]+12),b/2*0.9,8,(1,.35,.1)),0.05)
    if i%8==0: add(t0,tone(note(ch[0]-12),b*4,0.9,(1,.4)),0.11)
# score cuts: paper flick
for k in range(3): add(k*2.2,noise(0.18,18),0.18)
for k in (1,2):
    for j in range(10): add(k*2.2+0.05+j*0.08,noise(0.04,60)*np.sin(np.linspace(0,np.pi,int(SR*.04))),0.05)   # pen scratch
add(T['cam'],noise(0.35,9),0.12)
add(T['snap'],noise(0.05,90),0.6); add(T['snap']+0.06,noise(0.06,70),0.4)      # shutter
for j in range(4): add(T['load']+j*0.32,tone(note(76+j*2),0.15,16,(1,.3)),0.08)
add(T['reel'],noise(0.25,12),0.1)
add(T['swipe'],noise(0.3,10)*np.linspace(1,0,int(SR*.3)),0.16)
add(T['tap'],noise(0.03,120),0.4)
for j,m in enumerate([76,80,83,88]): add(T['tap']+0.08+j*0.06,tone(note(m),0.6,6,(1,.3)),0.12)
add(T['end'],tone(note(88),0.5,6,(1,.3)),0.08)
m=out*np.minimum(1,tt/0.03)*np.minimum(1,(DUR-tt)/0.4); m/=np.abs(m).max()/0.9
sf.write(f"{D}/mix.wav",m.astype(np.float32),SR); print("ok")
