import numpy as np, inspect, json, os, re, sys
import numpy.linalg, numpy.fft, numpy.random, numpy.polynomial, numpy.ma
base=os.path.dirname(np.__file__)
done=set(json.load(open('done.json'))) if os.path.exists('done.json') else set()
def src(f):
    f=getattr(f,'_implementation',f)
    try: return inspect.getsourcefile(f)
    except Exception: return None
res={}
for modname,mod in [('numpy',np),('numpy.linalg',np.linalg),('numpy.fft',np.fft),('numpy.random',np.random),('numpy.polynomial',np.polynomial),('numpy.lib.stride_tricks',np.lib.stride_tricks)]:
    for n in sorted(dir(mod)):
        if n.startswith('_'): continue
        o=getattr(mod,n)
        if not (callable(o) and not inspect.isclass(o)): continue
        s=src(o)
        if s and 'numpy' in s and 'tests' not in s and (os.sep + 'ma' + os.sep) not in s and 'matlib' not in s:
            rel=os.path.relpath(s,os.path.dirname(base)).replace(chr(92),'/')
            res.setdefault(rel,[]).append(modname+'.'+n)
tot=0
for k,v in sorted(res.items()):
    print(k,len(v)); tot+=len(v)
print('total',tot)
json.dump(res,open('pub.json','w'))
