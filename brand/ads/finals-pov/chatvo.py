import numpy as np, soundfile as sf, json
from kokoro_onnx import Kokoro
S="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad"
k=Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
CHAT=[(3.0,"u","Summarize my four hundred page textbook."),(5.0,"a","Ooh, a textbook! What's it for?"),(6.6,"u","The final. It's tomorrow."),(8.0,"a","Okay! I'll keep it short."),(11.8,"u","Shorter."),(12.9,"a","You're absolutely right!"),(15.6,"u","Make it make sense."),(16.8,"a","Before I continue, I have a few quick questions—")]
V={"u":("af_bella",1.0),"a":("am_puck",1.15)}
SR=24000; prev=0; out=[]
for t,who,text in CHAT:
    v,sp=V[who]; a,_=k.create(text,voice=v,speed=sp,lang="en-us"); a=a.astype(np.float32); nz=np.where(np.abs(a)>0.01)[0]; a=a[nz[0]:nz[-1]]
    start=max(t+(0.35 if who=="a" else 0.05), prev+0.08); d=len(a)/SR; prev=start+d
    sf.write(f"{S}/adB/vo_{len(out)}.wav",a,SR); out.append((start,round(d,2),round(start-t,2),text))
for o in out: print(o)
json.dump([o[0] for o in out],open(f"{S}/adB/vo_times.json","w"))
