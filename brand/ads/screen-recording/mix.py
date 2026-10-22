import numpy as np, soundfile as sf
SR=44100; DUR=21.6; N=int(SR*DUR); out=np.zeros((N,2))
def add(t0,x,g=1.0):
    if x.ndim==1: x=np.stack([x,x],1)
    a=int(t0*SR); b=min(N,a+len(x)); out[a:b]+=x[:b-a]*g
def tone(f,d,dec=8): t=np.arange(int(SR*d))/SR; return np.sin(2*np.pi*f*t)*np.exp(-t*dec)
import subprocess
subprocess.run(["ffmpeg","-loglevel","error","-y","-i","feed.wav","-ar","44100","-ac","2","bio44.wav"],check=True)
bio,_=sf.read("bio44.wav"); add(4.6,bio,1.0)
for k,m in enumerate([72,76,79]): add(4.6+12.0+1.3+k*0.07, tone(440*2**((m-69)/12),0.5,6), 0.2)
# lo-fi bed under the hook, upload and end card
note=lambda m:440*2**((m-69)/12); beat=0.4
for i in range(int(DUR/beat)):
    t0=i*beat; g=0.09 if (t0<4.6 or t0>19.0) else 0.025
    ch=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]][(i//4)%4]
    add(t0,tone(note(ch[0]-12),0.38,6),g*1.4); add(t0,tone(note(ch[i%3]+12),0.3,10),g)
for t0 in (1.7, 2.85): add(t0, tone(1800,0.05,80)+0, 0.35)   # taps
for k in range(6): add(3.2+k*0.2, tone(900+k*120,0.06,40), 0.12)   # progress blips
for k,m in enumerate([72,76,79]): add(4.35+k*0.07, tone(note(m),0.5,6), 0.18)   # ready chime
n=np.random.default_rng(1).standard_normal(int(0.25*SR)); n=np.convolve(n,np.ones(40)/40,"same")*np.exp(-np.arange(len(n))/SR*10); [add(4.6+x,n,0.4) for x in (3.0,5.8,8.55,11.7)]   # swipe
for k,m in enumerate([76,79,84]): add(19.3+k*0.1, tone(note(m),0.8,4), 0.2)
t=np.arange(N)/SR; out*=np.minimum(1,t/0.1)[:,None]*np.minimum(1,(DUR-t)/0.4)[:,None]
out/=max(1e-6,np.abs(out).max()/0.92); sf.write("mix.wav",out.astype(np.float32),SR); print("ok")
