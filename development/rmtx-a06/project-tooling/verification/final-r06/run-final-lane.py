"""One serial, explicit A06.5 verification step. Run only after lane handoff."""
import argparse,datetime,hashlib,json,os,pathlib,re,signal,stat,subprocess,time
ROOT=pathlib.Path('/home/konni/Downloads/xtend-dev/xtend')
SETUP=pathlib.Path('/tmp/xtend-a065/setup')
SERIES=os.environ.get('XTEND_A065_VERIFICATION_SERIES','final-r05')
assert re.fullmatch(r'final-r[0-9]{2,3}',SERIES), 'Explicit bounded verification series required'
OUT=ROOT/'development/rmtx-a06/project-tooling/verification'/SERIES
NODES={'node24':pathlib.Path('/home/konni/.local/share/xtend-local-llm/runtime/node_modules/node/bin/node'),'node26':pathlib.Path('/tmp/xtend-a065/node_modules/node-linux-x64/bin/node')}
SDK=['type-exports','epic13-package-export-lock','typescript-components','type-exports-rmt','xtensions-consumer-package','rmt-artifact-parity']
FOCUSED=['rmt-project','rmtx-language-service','rmtx-language-server','rmtx-editor','rmt-project-integrations']
RETAINED=['rmtx-frontend','rmtx-operator-profiles','rmtx-extended-operators','rmtx-profile3-backend','rmtx-host-scopes','rmtx-selectors','rmtx-selector-dependencies','rmtx-lifecycle','rmtx-inline-components','rmtx-native-view','rmtx-native-orchestration','rmtx-orchestration','rmtx-maraca-integration','rmtx-maraca-host-scopes']
p=argparse.ArgumentParser();p.add_argument('step',choices=[*(name+'-'+lane for name in ['focused','retained','project-runtime','source8','source7','literal','sdk','knowledge','mcp'] for lane in ['node24','node26']),'source8-chromium','source7-chromium','releaseprep-node24']);a=p.parse_args()
browser=a.step.endswith('chromium');lane='node26' if a.step.endswith('node26') else 'node24';node=NODES[lane]
directory=OUT/a.step;directory.mkdir(parents=True,exist_ok=False)
hashbytes=lambda b:hashlib.sha256(b).hexdigest()
def filehash(file):
 h=hashlib.sha256()
 with file.open('rb') as stream:
  for block in iter(lambda:stream.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
def source_state():
 names=sorted(set(subprocess.check_output(['git','-C',str(ROOT),'ls-files','--cached','--others','--exclude-standard','-z'],env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}).decode().split('\0'))-{''})
 # Evidence produced by this verification family is output, not its executable input.
 # Other source and historical evidence remain pinned exactly as present.
 names=[name for name in names if not name.startswith('development/rmtx-a06/project-tooling/verification/')]
 files={}
 for name in names:
  file=ROOT/name
  if not file.exists():files[name]={'kind':'deleted'};continue
  if file.is_symlink():files[name]={'kind':'symlink','target':os.readlink(file)};continue
  assert file.is_file(),('unsupported source path',name)
  files[name]={'sha256':filehash(file),'bytes':file.stat().st_size,'mode':'100755' if file.stat().st_mode&stat.S_IXUSR else '100644'}
 return files
def save(name,value):(directory/name).write_text(json.dumps(value,indent=2)+'\n')
heap=1024 if a.step.startswith('releaseprep-') else 512
env={**os.environ,'XTENSIONS_TEST_PEERS':str(SETUP/('runtime-peers-'+lane)),'NODE_PATH':str(SETUP/('runtime-peers-'+lane)/'node_modules')+':/tmp/xtend-a065/node_modules','NODE_OPTIONS':'--max-old-space-size='+str(heap),'npm_config_offline':'true','npm_config_audit':'false','npm_config_fund':'false','GIT_OPTIONAL_LOCKS':'0','CHROME_BIN':'/home/konni/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'}
env['PATH']=str(SETUP/('bin-'+lane))+':'+str(node.parent)+':/tmp/xtend-a065/node_modules/.bin:'+env['PATH']
env['XTEND_A065_TEST_PEERS']=env['XTENSIONS_TEST_PEERS']
command=[str(node),'--max-old-space-size='+str(heap)]
if a.step.startswith('source8-'):command+=['development/rmtx-a06/native-component-catalog/runtime-test.cjs','--output',str(directory/'report.json')]
elif a.step.startswith('source7-'):command+=['development/rmtx-a06/project-tooling/source7-retention.cjs','--report',str(directory/'report.json')]
elif a.step.startswith('literal-'):command+=['--test','--test-reporter=tap','tests/maraca/native-data-literal.test.cjs']
elif a.step.startswith('focused-') or a.step.startswith('retained-'):
 family=FOCUSED if a.step.startswith('focused-') else RETAINED
 command+=['--test','--test-concurrency=1','--test-reporter=tap',*('tests/rmt-language/'+name+'.test.cjs' for name in family)]
elif a.step.startswith('project-runtime-'):command+=['development/rmtx-a06/project-tooling/runtime/runtime-test.cjs','--output',str(directory/'report.json')]
elif a.step.startswith('knowledge-'):command+=['products/xtend-mcp/scripts/build-knowledge.mjs','--check']
elif a.step.startswith('mcp-'):command+=['--test','--test-concurrency=1','--test-reporter=tap',*(str(file.relative_to(ROOT)) for file in sorted((ROOT/'products/xtend-mcp/tests').glob('*.test.mjs')))]
elif a.step.startswith('releaseprep-'):command+=['scripts/check_release_preparation.cjs']
else:command+=['scripts/run_xtend_tests.js',*SDK,'--jobs','1','--json','--report',str(directory/'report.json'),'--execution',str(directory/'execution.json')]
if browser:command+=['--browser']
timeout=1200 if a.step.startswith('releaseprep-') else 600 if a.step.startswith('sdk-') else 300
before=source_state();save('source-before.json',before)
metadata={'format':1,'step':a.step,'command':command,'workingDirectory':str(ROOT),'node':subprocess.check_output([str(node),'--version'],env=env,text=True).strip(),'environment':{key:env[key] for key in ['XTENSIONS_TEST_PEERS','XTEND_A065_TEST_PEERS','NODE_PATH','NODE_OPTIONS','PATH','npm_config_offline','CHROME_BIN']},'beforeSourceSha256':hashbytes((directory/'source-before.json').read_bytes()),'wholeCurrentSourceMembershipPinnedExceptOwnVerificationOutputs':True,'heapMiB':heap,'timeoutSeconds':timeout,'releaseAcceptancePerformed':False}
save('command.json',metadata)
started=datetime.datetime.now(datetime.timezone.utc).isoformat();wall=time.monotonic();exitcode=None;expired=False
try:
 with (directory/'stdout.log').open('xb') as stdout,(directory/'stderr.log').open('xb') as stderr:
  child=subprocess.Popen(['/usr/bin/time','-v','-o',str(directory/'resources.txt'),*command],cwd=ROOT,env=env,stdout=stdout,stderr=stderr,start_new_session=True)
  try:exitcode=child.wait(timeout=timeout)
  except subprocess.TimeoutExpired:
   expired=True;os.killpg(child.pid,signal.SIGTERM)
   try:exitcode=child.wait(timeout=10)
   except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL);exitcode=child.wait(timeout=10)
finally:
 after=source_state();save('source-after.json',after)
 drift=[name for name in sorted(set(before)|set(after)) if before.get(name)!=after.get(name)]
 receipt={**metadata,'startedAt':started,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'wallSeconds':round(time.monotonic()-wall,3),'exitCode':exitcode,'timedOut':expired,'actualSourceFilesUnchanged':not drift,'sourceDrift':drift,'afterSourceSha256':hashbytes((directory/'source-after.json').read_bytes()),'passed':exitcode==0 and not expired and not drift}
 governed=['tests/schemas/core-release-inventory.json','development/core-release-authority-decision.json','scripts/release/core-projection-policy.json','development/rmtx-a01/inventory.json']
 receipt['sourceScopes']={'generatedFileCount':sum(name.startswith('tools/rmt-language/generated/') for name in before),'generatedFileDrift':[name for name in drift if name.startswith('tools/rmt-language/generated/')],'governedBefore':{name:before.get(name) for name in governed},'governedAfter':{name:after.get(name) for name in governed},'governedFileDrift':[name for name in drift if name in governed]}
 if a.step.startswith(('focused-','retained-','literal-','mcp-')):
  text=(directory/'stdout.log').read_text();summary={key:int(value) for key,value in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M)}
  receipt['tapSummary']=summary
  receipt['passed']=receipt['passed'] and summary.get('tests',0)>0 and summary.get('pass',0)==summary.get('tests') and all(summary.get(key,-1)==0 for key in ['fail','cancelled','skipped','todo'])
 if a.step.startswith('releaseprep-'):
  text=re.sub(r'\x1b\[[0-9;]*m','',(directory/'stdout.log').read_text());groups=[]
  for key,value in re.findall(r'^(?:# |ℹ ?)(tests|pass|fail|cancelled|skipped|todo) (\d+)$',text,re.M):
   if key=='tests':groups.append({})
   if groups:groups[-1][key]=int(value)
  receipt['tapSummaryGroups']=groups
  receipt['executedNodeTestCases']=sum(group.get('tests',0) for group in groups)
  receipt['skippedNodeTests']=sum(group.get('skipped',0) for group in groups)
  receipt['todoNodeTests']=sum(group.get('todo',0) for group in groups)
  receipt['nodeTestSummaryParsed']=bool(groups)
  # Match the official development gate's acceptance; retain actual skip/todo
  # counts without silently inventing a stricter replacement release gate.
  # Exit status is the official gate's own decision. Parsed groups add an
  # auditable actual count; unknown future reporter formatting is not a new gate.
 save('execution-receipt.json',receipt)
 print(json.dumps({key:receipt[key] for key in ['step','node','exitCode','wallSeconds','actualSourceFilesUnchanged','sourceDrift','passed']}),flush=True)
if not receipt['passed']:raise SystemExit(1)
