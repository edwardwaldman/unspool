import numpy as np, wave
SR=44100; DUR=22.0; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(7)
note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if 0<=a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=5,h=(1,.5,.25)):
    tt=np.arange(int(SR*d))/SR; return sum(a*np.sin(2*np.pi*f*(i+1)*tt) for i,a in enumerate(h))*np.exp(-tt*dec)
def noise(d,dec=6): tt=np.arange(int(SR*d))/SR; return rng.standard_normal(len(tt))*np.exp(-tt*dec)
def lp(x,a): 
    y=np.zeros_like(x); s=0
    for i in range(len(x)): s+= (x[i]-s)*a; y[i]=s
    return y
def whoosh(d): n=int(SR*d); x=lp(rng.standard_normal(n),0.08); return x*np.sin(np.linspace(0,np.pi,n))**2*4
# spacey pad (A minor-ish), soft arps, gentle pulse
prog=[[57,60,64,67],[53,57,60,64],[55,59,62,65],[52,55,59,64]]; bar=2.0
for k in range(int(DUR/bar)+1):
    t0=k*bar; ch=prog[k%4]
    for m in ch:
        tt=np.arange(int(SR*bar*1.1))/SR; env=np.minimum(1,tt/0.4)*np.exp(-tt*0.6)
        add(t0, (np.sin(2*np.pi*note(m)*tt)+0.3*np.sin(2*np.pi*note(m)*2.003*tt))*env, 0.03)
    add(t0, tone(note(ch[0]-24), bar, 1.2, (1,.3)), 0.10)
    for j in range(8): add(t0+j*bar/8, tone(note(ch[j%4]+12), 0.25, 9, (1,.2)), 0.02)
# countdown ticks + low heartbeat (3.9..8.9)
for i in range(5):
    t=3.9+i; add(t, tone(1320 if i<4 else 1760, 0.12, 30, (1,.3)), 0.25); add(t, tone(55,0.3,9,(1,.4)), 0.4)
add(8.9, whoosh(0.35), 0.12)
# reveals
for i,t in enumerate([9.0,11.2,13.4,15.6]):
    add(t-0.15, whoosh(0.6), 0.25); add(t, noise(0.25,18), 0.06)
    if i<3: add(t+0.75, tone(160,0.35,6,(1,.8,.6,.4)), 0.22); add(t+0.8, tone(150,0.3,6,(1,.8,.6,.4)), 0.18)  # buzzer
    else:
        for j,m in enumerate([72,76,79,84]): add(t+1.2+j*0.09, tone(note(m),0.6,4,(1,.3)), 0.14)
        add(t+2.4, tone(note(88),0.8,3,(1,.3)), 0.12)
add(19.4, whoosh(0.8), 0.18)
for j,m in enumerate([69,72,76]): add(19.6+j*0.12, tone(note(m),1.5,1.8,(1,.3)), 0.1)
import soundfile as _sf
vv,_=_sf.read("/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/ad4/voice.wav"); vv=np.pad(vv,(0,max(0,N-len(vv))))[:N]
env=np.convolve(np.abs(vv),np.ones(6000)/6000,"same"); out=out/np.abs(out).max()*0.55*(1-0.45*np.minimum(1,env/0.04))+vv*1.0
t=np.arange(N)/SR; out*=np.minimum(1,t/0.2)*np.minimum(1,(DUR-t)/0.8); out/=np.abs(out).max()/0.9
w=wave.open("/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad/ad4/mix.wav","wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close(); print("ok")
