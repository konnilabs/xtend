import pathlib,subprocess,sys,time
base=pathlib.Path('/tmp/xtend-native-catalog-v2/root')
steps=[('refresh-final24',['gates.py','refresh','--lane','24','--suffix=-final']),('bind-before',['bind-preparation-final.py','before']),('check-final24',['gates.py','check','--lane','24','--skip','22','--suffix=-final']),('check-final26',['gates.py','check','--lane','26','--skip','22','--suffix=-final']),('bind-after',['bind-preparation-final.py','after'])]
for label,args in steps:
 started=time.time()
 with (base/(label+'.log')).open('w') as stream:r=subprocess.run([sys.executable,str(base/args[0]),*args[1:]],stdout=stream,stderr=subprocess.STDOUT,timeout=2400)
 print(label,r.returncode,round(time.time()-started,2),flush=True)
 if r.returncode:
  print((base/(label+'.log')).read_text()[-10000:],flush=True);raise SystemExit(r.returncode)
