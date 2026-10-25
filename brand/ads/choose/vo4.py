import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
S="/tmp/claude-0/-home-user/a6768946-caac-5edd-b0c9-ac1afa389d34/scratchpad"; D=f"{S}/ad4"
k=Kokoro(f"{S}/tts/kokoro-v1.0.onnx", f"{S}/tts/voices-v1.0.bin")
SR=44100; DUR=22.0; N=int(SR*DUR); voice=np.zeros(N)
# (start, latest end, text)
L=[(0.2,1.95,"Choose a study method."),(2.05,3.85,"You have to pass the final tomorrow."),
   (3.92,4.8,"Five."),(4.92,5.8,"Four."),(5.92,6.8,"Three."),(6.92,7.8,"Two."),(7.92,8.9,"One."),
   (9.1,11.15,"Read every page? Asleep by page twelve."),(11.3,13.35,"Highlight everything? Now the whole book is yellow."),
   (13.5,15.55,"An all-nighter? Forgot it all by nine A M."),(15.7,19.3,"Or, unspool it. Four hundred pages, twelve reels, and a quiz. Passed."),
   (19.5,21.9,"Choose option four. First reel free, at unspool dot c c.")]
for t0,t1,text in L:
    for sp in (1.05,1.12,1.2,1.28,1.36,1.45):
        a,sr=k.create(text,voice="am_puck",speed=sp,lang="en-us"); a=a.astype(np.float32); nz=np.where(np.abs(a)>0.01)[0]; a=a[nz[0]:nz[-1]]
        if len(a)/sr <= t1-t0: break
    a=np.interp(np.arange(int(len(a)*SR/sr))*sr/SR, np.arange(len(a)), a)   # 24k -> 44.1k
    i=int(t0*SR); voice[i:i+len(a)]+=a[:N-i]; print(text, round(len(a)/SR,2), "of", round(t1-t0,2), "speed", sp)
sf.write(f"{D}/voice.wav",voice.astype(np.float32),SR)
