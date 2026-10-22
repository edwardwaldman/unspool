import numpy as np, soundfile as sf, subprocess
SR=44100
SH=[("intro",2.6),("read",2.8),("tired",1.8),("phone",2.8),("reels",14.8),("sleep",1.6),("test",3.0),("grade",1.6),("end",2.6)]
st={};acc=0
for n,d in SH: st[n]=acc; acc+=d
DUR=acc; N=int(SR*DUR); out=np.zeros(N); rng=np.random.default_rng(5)
def add(t0,x,g=1.0):
    a=int(t0*SR); b=min(N,a+len(x))
    if a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=8): t=np.arange(int(SR*d))/SR; return np.sin(2*np.pi*f*t)*np.exp(-t*dec)
def nz(d,dec=10,sm=20): x=rng.standard_normal(int(SR*d)); x=np.convolve(x,np.ones(sm)/sm,"same"); return x*np.exp(-np.arange(len(x))/SR*dec)
note=lambda m:440*2**((m-69)/12)
for i in range(int(DUR/0.3)):
    t0=i*0.3; g=0.02 if st["reels"]<t0<st["sleep"] else (0.0 if st["sleep"]<t0<st["test"] else 0.07)
    ch=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]][(i//8)%4] if t0<st["test"] else [[60,64,67],[65,69,72],[67,71,74],[60,64,67]][(i//8)%4]
    add(t0,tone(note(ch[i%3]+12),0.4,7),g)
    if i%4==0: add(t0,tone(note(ch[0]-12),0.8,4),g*1.3)
for k in range(int(2.8*1.3)): add(st["read"]+k/1.3,nz(0.25,14,30),0.35)        # page flips
for k in range(2): add(st["tired"]+k*0.9,nz(0.9,3,200),0.25)                      # yawn-ish
add(st["phone"]+0.5,tone(1800,0.05,80),0.4)                                         # tap
add(st["phone"]+0.75,tone(300,0.15,20),0.4)                                         # pdf drop
for k in range(7): add(st["phone"]+1.2+k*0.14,tone(900+k*110,0.05,40),0.15)
for k,m in enumerate([72,76,79,84]): add(st["phone"]+2.2+k*0.06,tone(note(m),0.6,5),0.2)
subprocess.run(["ffmpeg","-loglevel","error","-y","-i","feed.wav","-ar","44100","-ac","1","bio44.wav"],check=True)
bio,_=sf.read("bio44.wav"); add(st["reels"],bio,0.95)
for k,m in enumerate([72,76,79]): add(st["reels"]+12.0+1.3+k*0.07,tone(note(m),0.5,6),0.2)
for s0 in (3.0,5.8,8.55,11.7): add(st["reels"]+s0,nz(0.2,14,30),0.25)
add(st["sleep"]+0.1,tone(120,0.2,12),0.3)                                           # lamp click
for k in range(3): add(st["test"]+0.2+k*0.12,tone(2200,0.03,90),0.2)
add(st["test"]+1.6,nz(0.35,8,6),0.25); add(st["test"]+2.0,nz(0.4,8,6),0.25)          # pencil scribbles
add(st["grade"],tone(80,0.4,9),0.6); add(st["grade"],nz(0.1,40,3),0.4)              # stamp
for k,m in enumerate([72,76,79,84,88]): add(st["grade"]+0.15+k*0.07,tone(note(m),0.7,4),0.15)
for k,m in enumerate([76,79,84]): add(st["end"]+0.1+k*0.1,tone(note(m),0.8,4),0.18)
t=np.arange(N)/SR; out*=np.minimum(1,t/0.2)*np.minimum(1,(DUR-t)/0.4); out/=np.abs(out).max()/0.9
sf.write("mix.wav",out.astype(np.float32),SR); print(round(DUR,2))
