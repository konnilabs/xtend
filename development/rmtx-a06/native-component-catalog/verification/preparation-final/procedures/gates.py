import argparse,ast,json,os,pathlib,re,subprocess,time
p=argparse.ArgumentParser();p.add_argument('mode',choices=['refresh','check']);p.add_argument('--lane',default='24');p.add_argument('--start',type=int,default=0);p.add_argument('--stop',type=int,default=999);p.add_argument('--skip',type=int,nargs='*',default=[]);p.add_argument('--suffix',default='');a=p.parse_args()
root=pathlib.Path('/home/konni/Downloads/xtend-dev/xtend');out=pathlib.Path('/tmp/xtend-native-catalog-v2/root')/('gates-'+a.mode+'-node'+a.lane+a.suffix);out.mkdir(exist_ok=True)
node={'24':'/home/konni/.local/share/xtend-local-llm/runtime/node_modules/node/bin/node','26':'/tmp/xtend-rmtx-a0642/toolchain/node_modules/node-linux-x64/bin/node'}[a.lane]
commands=[]
for line in (root/'scripts/check_release_preparation.cjs').read_text().splitlines():
 m=re.match(r'^\s*(\[[^\n]+\]),?$',line)
 if m: commands.append(ast.literal_eval(m[1]))
assert len(commands)>45
receipts=[]
env=dict(os.environ,NODE_PATH='/tmp/xtend-rmtx-a0642/locked-tools/node_modules',TZ='Europe/Berlin',NODE_OPTIONS='--max-old-space-size=1024')
env['PATH']=str(pathlib.Path(node).parent)+':'+env['PATH'];env['XTENSIONS_TEST_PEERS']='/tmp/xtend-rmtx-a0642/consumer-peers'+a.lane
for i,command in enumerate(commands):
 if not a.start<=i<a.stop or i in a.skip: continue
 if a.mode=='refresh':
  if not command[0].startswith('development/') or not command[0].endswith('inspect.cjs') or '--check' not in command or command[0].startswith('development/rmtx-a01/'):continue
  command=['--write' if x=='--check' else x for x in command]
 if command[0]=='--test' and not any(x.startswith('--test-concurrency=') for x in command):command=['--test-concurrency=1',*command]
 label=f'{i:02d}-'+re.sub(r'[^A-Za-z0-9.-]','_',command[1] if command[0].startswith('--') else command[0]);log=out/(label+'.log');timing=out/(label+'.time');started=time.time()
 try:
  with log.open('w') as stream: result=subprocess.run(['/usr/bin/time','-v','-o',str(timing),'timeout','240s',node,'--max-old-space-size=1024',*command],cwd=root,env=env,stdout=stream,stderr=subprocess.STDOUT,timeout=250)
  row=dict(index=i,command=command,returncode=result.returncode,duration=round(time.time()-started,3),log=str(log),time=str(timing))
 except subprocess.TimeoutExpired: row=dict(index=i,command=command,returncode=124,duration=round(time.time()-started,3),log=str(log),time=str(timing))
 receipts.append(row);(out/'receipt.json').write_text(json.dumps(receipts,indent=2)+'\n');print(json.dumps(row),flush=True)
 if row['returncode']!=0: print(log.read_text()[-9000:],flush=True);raise SystemExit(row['returncode'])
