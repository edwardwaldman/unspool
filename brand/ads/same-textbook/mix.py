import numpy as np, soundfile as sf
SR=44100; P0,P1=1.3,11.4; DUR=P1+(15.5-3.3)/1.05; N=int(SR*DUR); out=np.zeros(N)
def m(o): return o if o<1.3 else (P0+(o-1.3)/2.0*(P1-P0) if o<3.3 else P1+(o-3.3)/1.05)
def add(t0,x,g=1.0):
    a=int(t0*SR); b=min(N,a+len(x)); 
    if a<N: out[a:b]+=x[:b-a]*g
def tone(f,d,dec=8): t=np.arange(int(SR*d))/SR; return np.sin(2*np.pi*f*t)*np.exp(-t*dec)
note=lambda m_:440*2**((m_-69)/12)
for i in range(int(DUR/0.22)):
    t0=i*0.22; day=t0>m(9.0); ch=([[60,64,67],[65,69,72],[67,71,74],[60,64,67]] if day else [[57,60,64],[53,57,60],[55,59,62],[52,55,59]])[(i//8)%4]
    g=0.025 if P0+2.7<t0<P1 else 0.08
    add(t0,tone(note(ch[i%3]+12),0.4,7),g)
    if i%4==0: add(t0,tone(note(ch[0]-12),0.8,4),g*1.3)
add(m(0.15),tone(1568,0.25,10),0.2)
add(P0+0.05,tone(500,0.3,6)+0,0.2)                       # phone whoosh-ish
add(P0+0.6,tone(300,0.15,20),0.4)                       # pdf drop
for k in range(7): add(P0+1.2+k*0.14, tone(900+k*110,0.05,40), 0.15)
for k,mm in enumerate([72,76,79,84]): add(P0+2.2+k*0.06, tone(note(mm),0.6,5), 0.2)
import subprocess
subprocess.run(["ffmpeg","-loglevel","error","-y","-i","bio.wav","-ar","44100","-ac","1","bio44.wav"],check=True)
bio,_=sf.read("bio44.wav"); add(P0+2.7,bio,0.95)
for k in range(10): add(m(1.6+k*0.6), tone(1200+k*60,0.06,30), 0.12)
rng=np.random.default_rng(2); b=rng.standard_normal(int(0.4*SR))*np.exp(-np.arange(int(0.4*SR))/SR*8); add(m(9.0),np.convolve(b,np.ones(20)/20,"same"),0.4)
add(m(9.3),tone(1568,0.25,10),0.2); add(m(10.6),tone(90,0.3,10),0.5); add(m(10.9),tone(90,0.3,10),0.5)
for k,mm in enumerate([72,76,79,84]): add(m(11.4)+k*0.07, tone(note(mm),0.7,4), 0.15)
for k,mm in enumerate([76,79,84]): add(m(14.1)+k*0.1, tone(note(mm),0.8,4), 0.18)
t=np.arange(N)/SR; out*=np.minimum(1,t/0.05)*np.minimum(1,(DUR-t)/0.3); out/=np.abs(out).max()/0.9
sf.write("mix.wav",out.astype(np.float32),SR); print(round(DUR,2))
