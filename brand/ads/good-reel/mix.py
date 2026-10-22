import json, numpy as np, soundfile as sf
SR=24000; tl=json.load(open("web/tl.json")); DUR=tl["dur"]; N=int(SR*DUR); t=np.arange(N)/SR; out=np.zeros(N)
note=lambda m:440*2**((m-69)/12)
def add(t0,x,g):
    a=int(t0*SR); b=min(N,a+len(x))
    if a<N: out[a:b]+=x[:b-a]*g
def pad(f,d): tt=np.arange(int(SR*d))/SR; env=np.minimum(1,tt/0.8)*np.minimum(1,(d-tt)/0.8); return (np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*f*2.003*tt))*env
prog=[[57,60,64,67],[53,57,60,64],[55,59,62,65],[52,55,59,62]]
bar=3.2
for i in range(int(DUR/bar)+1):
    for m in prog[i%4]: add(i*bar,pad(note(m),bar+0.6),0.03)
    for k,m in enumerate(prog[i%4]): tt=np.arange(int(SR*1.2))/SR; add(i*bar+k*0.8,np.sin(2*np.pi*note(m+12)*tt)*np.exp(-tt*4),0.035)
v,_=sf.read("voice.wav"); vv=np.zeros(N); vv[:min(N,len(v))]=v[:N]
env=np.convolve(np.abs(vv),np.ones(3600)/3600,"same"); mixd=out*(1-0.6*np.minimum(1,env/0.04))+vv
end=[l for l in tl["lines"] if l["shot"]=="end"][0]["s"]
for k,m in enumerate([72,76,79,84]): tt=np.arange(int(SR*1.2))/SR; add(end+0.1+k*0.1,np.sin(2*np.pi*note(m)*tt)*np.exp(-tt*3),0.15)
mixd+=out*0  # chimes already in out
mixd=mixd+0
mixd*=np.minimum(1,t/0.4)*np.minimum(1,(DUR-t)/0.6); mixd/=np.abs(mixd).max()/0.92
sf.write("mix.wav",mixd.astype(np.float32),SR); print("ok")
