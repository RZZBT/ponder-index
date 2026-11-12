import numpy as np, inspect, json, os
import numpy.linalg, numpy.fft, numpy.random, numpy.polynomial, numpy.ma
def src(f):
    f=getattr(f,'_implementation',f)
    try: return inspect.getsourcefile(f)
    except Exception: return None
mods=[('numpy',np),('numpy.linalg',np.linalg),('numpy.fft',np.fft),('numpy.random',np.random),('numpy.ma',np.ma),('numpy.polynomial',np.polynomial)]
seen={}
for mn,m in mods:
    for n in dir(m):
        if n.startswith('_'): continue
        o=getattr(m,n)
        if inspect.ismodule(o) or inspect.isclass(o): continue
        if not (callable(o) or isinstance(o,np.ufunc)): continue
        key=id(o)
        kind='ufunc' if isinstance(o,np.ufunc) else ('python' if (src(o) and 'tests' not in src(o) and 'matlib' not in src(o)) else 'c/builtin')
        seen.setdefault(key,(mn+'.'+n,kind,mn))
core=[v for v in seen.values() if v[2]!='numpy.ma' ]
from collections import Counter
print('unique public callables (excluding numpy.ma):',len(core),Counter(v[1] for v in core))
print('numpy.ma callables:',len([v for v in seen.values() if v[2]=='numpy.ma']))
