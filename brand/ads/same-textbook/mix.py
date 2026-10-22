import numpy as np, soundfile as sf
SR=44100; DUR=15.5; N=int(SR*DUR); out=np.zeros(N)
def add(t0,x,g=1.0):
    a=int(t0*SR); b=min(N,a+len(x)); out[a:b]+=x[:b-a]*g
def tone(f,d,dec=8): t=np.arange(int(SR*d))/SR; return np.sin(2*np.pi*f*t)*np.exp(-t*dec)
note=lambda m:440*2**((m-69)/12)
# night: soft music-box arpeggio; dawn: warm major
for i in range(int(DUR/0.3)):
    t0=i*0.3; ch=[[57,60,64],[53,57,60],[55,59,62],[52,55,59]][(i//8)%4] if t0<9 else [[60,64,67],[65,69,72],[67,71,74],[60,64,67]][(i//8)%4]
    add(t0,tone(note(ch[i%3]+12),0.5,6),0.08); 
    if i%4==0: add(t0,tone(note(ch[0]-12),1.0,3),0.1)
for k in range(10): add(1.6+k*0.6, tone(1200+k*60,0.08,30), 0.12)   # bubble pops
add(0.15,tone(1568,0.25,10)+0,0.2); add(1.5,tone(1760,0.25,10),0.2); add(9.3,tone(1568,0.25,10),0.2)
rng=np.random.default_rng(2); burst=rng.standard_normal(int(0.4*SR))*np.exp(-np.arange(int(0.4*SR))/SR*8); add(9.0,np.convolve(burst,np.ones(20)/20,"same"),0.4)
add(10.6,tone(90,0.3,10),0.5); add(10.9,tone(90,0.3,10),0.5)
for k,m in enumerate([72,76,79,84]): add(11.4+k*0.08, tone(note(m),0.7,4), 0.15)
for k,m in enumerate([76,79,84]): add(14.1+k*0.1, tone(note(m),0.8,4), 0.18)
t=np.arange(N)/SR; out*=np.minimum(1,t/0.1)*np.minimum(1,(DUR-t)/0.4); out/=np.abs(out).max()/0.9
sf.write("mix.wav",out.astype(np.float32),SR); print("ok")
