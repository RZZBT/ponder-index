import numpy as np, os, re, sys, json
base=os.path.dirname(np.__file__)
files=[]
for root,_,fs in os.walk(base):
    if 'tests' in root or 'typing' in root: continue
    for f in fs:
        if f.endswith('.py'): files.append(os.path.join(root,f))
texts={p:open(p,encoding='utf8').read() for p in files}
def find(n):
    return [os.path.relpath(p,os.path.dirname(base)).replace(chr(92),'/') for p,t in texts.items() if re.search(r'^def %s\('%n,t,re.M)]
if __name__=='__main__':
    print(np.__version__)
    for n in sys.argv[1:]: print(n,find(n))
