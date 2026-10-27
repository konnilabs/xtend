'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const runner=require('../../../scripts/demo-functional-ci.cjs');
const source={controllerSha:'a'.repeat(40),coreSha:'b'.repeat(40),demoSha:'c'.repeat(40),manifestSha256:'d'.repeat(64)};
const ci={GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',GITHUB_REPOSITORY:'konnilabs/xtend',GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/qualification/firefox-initial-20261021',GITHUB_SHA:source.controllerSha,GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',XTEND_CI_FUNCTIONAL_PROFILE:'chromium-linux-ci-functions-no-sandbox-v1',GITHUB_TOKEN:'must-not-inherit',ACTIONS_RUNTIME_TOKEN:'must-not-inherit',NODE_OPTIONS:'--require=foreign',HOME:'/credential-home',LD_PRELOAD:'/foreign'};
function model(){return {format:1,purpose:'migration-demo-functions',source,node:'24.18.0',runId:'123',attempt:1,sandboxEnabled:false,sandboxEvidence:'not-provided',acceptedForMerge:false,acceptedForRelease:false,groups:runner.groups.map(id=>({id,status:'passed',completion:'complete',startedAt:'2026-10-23T00:00:00Z',finishedAt:'2026-10-23T00:00:01Z',result:{ok:true,passes:['explicit model assertion'],failures:[],skips:[]},cleanup:{complete:true,childReaped:true,groupGone:true}}))};}
const expected={source,node:'24.18.0',runId:'123',attempt:1};
test('explicit environment never copies credentials, injection flags or user profiles',()=>{
 const env=runner.environment({scratch:'/tmp/isolated',node:'/tool/node',browser:'/tool/chrome',driver:'/tool/driver',group:'erp',source,ci});
 for(const key of ['GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN','NODE_OPTIONS','LD_PRELOAD'])assert(!Object.hasOwn(env,key));
 assert.equal(env.HOME,'/tmp/isolated');assert.equal(env.XTEND_CHROMIUM_PATH,'/tool/chrome');assert(!env.XTEND_BROWSER_HYPERVISOR_URL);assert(!env.XTEND_SHOP_FPM_BINARY);
 assert.equal(env.XTEND_CORE_SHA,source.coreSha);assert.equal(env.XTEND_DEMO_SHA,source.demoSha);
});
test('FPM is explicit and limited to the FPM group',()=>{
 const options={scratch:'/tmp/x',browser:'/tool/chrome',driver:'/tool/driver',group:'shop-fpm',source,ci};
 assert.throws(()=>runner.environment(options));assert.equal(runner.environment({...options,fpm:'/usr/sbin/php-fpm8.3'}).XTEND_SHOP_FPM_BINARY,'/usr/sbin/php-fpm8.3');
 assert.throws(()=>runner.environment({...options,group:'electron'}));assert.throws(()=>runner.environment({...options,fpm:'relative'}));
});
test('all five explicit model groups accepted without release or sandbox recognition',()=>assert(runner.validateRecord(model(),expected)));
for(const [name,change] of [
 ['missing group',r=>r.groups.pop()],['duplicate group',r=>r.groups[4]=r.groups[0]],['foreign source',r=>r.source={...r.source,demoSha:'0'.repeat(40)}],
 ['foreign run',r=>r.runId='999'],['foreign attempt',r=>r.attempt=2],['foreign Node',r=>r.node='22.0.0'],
 ['not run',r=>r.groups[0].status='not-run'],['no assertions',r=>r.groups[0].result.passes=[]],['assertion failure',r=>r.groups[0].result.failures=['failed']],
 ['green skip',r=>r.groups[0].result.skips=['unavailable']],['missing cleanup',r=>delete r.groups[0].cleanup],['unreaped child',r=>r.groups[0].cleanup.childReaped=false],
 ['nested skip',r=>r.groups[0].result.report={skipped:1}],
 ['surviving group',r=>r.groups[0].cleanup.groupGone=false],['sandbox promotion',r=>r.sandboxEnabled=true],['merge promotion',r=>r.acceptedForMerge=true],['release promotion',r=>r.acceptedForRelease=true],['no time evidence',r=>delete r.groups[0].startedAt]
])test('reject '+name,()=>{const r=model();change(r);assert.throws(()=>runner.validateRecord(r,expected));});
test('host refuses macOS, root, self-hosted runners and foreign branches',()=>{
 assert.doesNotThrow(()=>runner.host(ci,'linux',1001,'x64','24.18.0'));
 for(const [env,platform,uid] of [[ci,'darwin',501],[ci,'linux',0],[{...ci,RUNNER_ENVIRONMENT:'self-hosted'},'linux',1001],[{...ci,GITHUB_REF:'refs/heads/main'},'linux',1001]])assert.throws(()=>runner.host(env,platform,uid,'x64','24.18.0'));
});
test('workflow fixes exact branch, two lanes, read permissions and credential-free checkout',()=>{
 const text=fs.readFileSync(path.resolve(__dirname,'../../../.github/workflows/xtend-demo-functional.yml'),'utf8');
 assert(text.includes('branches: [qualification/firefox-initial-20261021]'));assert(text.includes("node: ['24.18.0', '26.5.0']"));assert(text.includes('contents: read'));
 assert.equal((text.match(/uses: actions\/checkout@/g)||[]).length,(text.match(/persist-credentials: false/g)||[]).length);
 for(const forbidden of ['secrets.','continue-on-error','pull_request_target','provision-electron','prepare-product-runtime.cjs','run-product-gates.cjs','sudo ','permissions: write'])assert(!text.includes(forbidden));
 assert(text.includes('--no-scripts --no-plugins'));assert(text.includes('provision-product-fpm.cjs 8.3'));
});
test('matrix requires both exact lanes, source and run with no substitute or duplicate',()=>{
 const a=model(),b={...model(),node:'26.5.0'},expected={...source,runId:'123',attempt:1};
 assert(runner.validateMatrix([a,b],expected).ok);
 for(const reports of [[a],[a,a],[a,{...b,source:{...source,coreSha:'0'.repeat(40)}}],[a,{...b,runId:'456'}]])assert.throws(()=>runner.validateMatrix(reports,expected));
});
test('artifact collection rejects missing, nested, duplicate and symbolic evidence',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'demo-functions-model-'));
 try{
  for(const name of ['lane24','lane26']){fs.mkdirSync(path.join(root,name));fs.writeFileSync(path.join(root,name,'demo-functional.json'),'{}');}
  assert.equal(runner.reportFiles(root).length,2);
  fs.mkdirSync(path.join(root,'lane24','nested'));fs.writeFileSync(path.join(root,'lane24','nested','demo-functional.json'),'{}');assert.throws(()=>runner.reportFiles(root));fs.rmSync(path.join(root,'lane24','nested'),{recursive:true});
  fs.symlinkSync(path.join(root,'lane24','demo-functional.json'),path.join(root,'foreign'));assert.throws(()=>runner.reportFiles(root));fs.unlinkSync(path.join(root,'foreign'));
  fs.unlinkSync(path.join(root,'lane26','demo-functional.json'));assert.throws(()=>runner.reportFiles(root));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
const demoCI={...ci,GITHUB_REPOSITORY:'konnilabs/xtend-demos',GITHUB_EVENT_NAME:'pull_request',GITHUB_REF:'refs/pull/2/merge',GITHUB_SHA:'e'.repeat(40),XTEND_DEMO_EVENT_SHA:source.demoSha,XTEND_DEMO_CONTROLLER_SHA:source.controllerSha,XTEND_DEMO_HEAD_REPOSITORY:'konnilabs/xtend-demos',XTEND_DEMO_BASE_REF:'main',XTEND_DEMO_PR_NUMBER:'2'};
test('explicit Demo PR model authenticates separate event and controller sources',()=>{
  assert.doesNotThrow(()=>runner.host(demoCI,'linux',1001,'x64','24.18.0'));
  assert(runner.assertExecutionIdentity(source.controllerSha,source.demoSha,demoCI));
  assert.throws(()=>runner.assertExecutionIdentity(demoCI.GITHUB_SHA,source.demoSha,demoCI));
  assert.throws(()=>runner.assertExecutionIdentity(source.controllerSha,demoCI.GITHUB_SHA,demoCI));
  const env=runner.environment({scratch:'/tmp/demo-pr-model',browser:'/tool/chrome',driver:'/tool/driver',group:'erp',source,ci:demoCI});
  assert.equal(env.XTEND_DEMO_EVENT_SHA,source.demoSha);assert.equal(env.XTEND_DEMO_CONTROLLER_SHA,source.controllerSha);
  for(const key of ['GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN','NODE_OPTIONS','LD_PRELOAD'])assert(!Object.hasOwn(env,key));
});
for(const [key,value] of [['GITHUB_REPOSITORY','foreign/demo'],['GITHUB_EVENT_NAME','pull_request_target'],['GITHUB_REF','refs/pull/3/merge'],['XTEND_DEMO_PR_NUMBER','3'],['XTEND_DEMO_BASE_REF','develop'],['XTEND_DEMO_HEAD_REPOSITORY','foreign/xtend-demos'],['XTEND_DEMO_EVENT_SHA','missing'],['XTEND_DEMO_CONTROLLER_SHA','missing'],['GITHUB_RUN_ATTEMPT','0'],['RUNNER_ENVIRONMENT','self-hosted']])test('Demo PR host rejects '+key,()=>assert.throws(()=>runner.host({...demoCI,[key]:value},'linux',1001,'x64','24.18.0')));
test('Demo main supports the same bounded profile without changing the Core branch restriction',()=>{
  for(const GITHUB_EVENT_NAME of ['push','schedule','workflow_dispatch'])assert.doesNotThrow(()=>runner.host({...demoCI,GITHUB_EVENT_NAME,GITHUB_REF:'refs/heads/main',GITHUB_SHA:source.demoSha},'linux',1001,'x64','26.5.0'));
  assert.throws(()=>runner.host({...demoCI,GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/main'},'linux',1001,'x64','26.5.0'));
  assert.throws(()=>runner.host({...ci,GITHUB_REF:'refs/heads/main'},'linux',1001,'x64','24.18.0'));
});
test('repository identity is mandatory in the execution CLI validation and cannot be substituted',()=>{
  const r={...model(),executionRepository:'konnilabs/xtend-demos'};
  assert(runner.validateRecord(r,{...expected,repository:'konnilabs/xtend-demos'}));
  assert.throws(()=>runner.validateRecord(r,{...expected,repository:'konnilabs/xtend'}));
  assert.throws(()=>runner.validateRecord(model(),{...expected,repository:'konnilabs/xtend-demos'}));
});
test('Demo event source and installed package Core remain independent from controller revision',()=>{
 const root=path.resolve(__dirname,'../../..'),sha=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const env={...demoCI,XTEND_DEMO_CONTROLLER_SHA:sha,XTEND_CORE_SHA:source.coreSha};
 assert.deepEqual(runner.expectedSources(root,env),{implementationCoreSha:source.coreSha,demoSha:source.demoSha});
 assert.throws(()=>runner.expectedSources(root,{...env,XTEND_CORE_SHA:'missing'}));
 assert.throws(()=>runner.expectedSources(root,{...env,XTEND_DEMO_CONTROLLER_SHA:'0'.repeat(40)}));
});
for(const attempt of [2,17])test('later attempt '+attempt+' binds the host, record and both model lanes to the same invocation',()=>{
 const invocation={runId:'123',attempt};
 for(const env of [ci,demoCI,{...demoCI,GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/main',GITHUB_SHA:source.demoSha}]) {
  for(const node of runner.nodes)assert.deepEqual(runner.host({...env,GITHUB_RUN_ATTEMPT:String(attempt)},'linux',1001,'x64',node),invocation);
 }
 const a={...model(),attempt,executionRepository:'konnilabs/xtend-demos'},b={...a,node:'26.5.0'};
 assert(runner.validateRecord(a,{...expected,...invocation,repository:'konnilabs/xtend-demos'}));
 const result=runner.validateMatrix([a,b],{...source,...invocation,repository:'konnilabs/xtend-demos'});
 assert.equal(result.attempt,attempt);assert.equal(result.runId,'123');
 assert.equal(result.sandboxEvidence,'not-provided');assert.equal(result.acceptedForMerge,false);assert.equal(result.acceptedForRelease,false);
 const env=runner.environment({scratch:'/tmp/later-attempt-model',browser:'/tool/chrome',driver:'/tool/driver',group:'erp',source,ci:{...demoCI,GITHUB_RUN_ATTEMPT:String(attempt)}});
 assert.equal(env.GITHUB_RUN_ATTEMPT,String(attempt));assert.equal(env.GITHUB_RUN_ID,'123');assert(!Object.hasOwn(env,'GITHUB_TOKEN'));
});
for(const value of [undefined,'','0','01','-1','1.0','1e2',' 2','2 ','NaN','Infinity','9007199254740992',2])test('reject malformed workflow attempt '+JSON.stringify(value),()=>{
 for(const env of [ci,demoCI])assert.throws(()=>runner.host({...env,GITHUB_RUN_ATTEMPT:value},'linux',1001,'x64','24.18.0'));
});
for(const value of [undefined,'','0','01','foreign',123])test('reject malformed workflow run '+JSON.stringify(value),()=>{
 assert.throws(()=>runner.host({...demoCI,GITHUB_RUN_ID:value,GITHUB_RUN_ATTEMPT:'2'},'linux',1001,'x64','24.18.0'));
});
for(const attempt of [undefined,0,-1,1.5,'2',NaN,Infinity,Number.MAX_SAFE_INTEGER+1])test('record validation requires an explicit valid expected attempt '+String(attempt),()=>{
 const record={...model(),attempt:2};assert.throws(()=>runner.validateRecord(record,{...expected,attempt}));
});
test('later-attempt matrix rejects mixed attempts and consistent but foreign invocation evidence',()=>{
 const a={...model(),attempt:2,executionRepository:'konnilabs/xtend-demos'},b={...a,node:'26.5.0'};
 const wanted={...source,runId:'123',attempt:2,repository:'konnilabs/xtend-demos'};
 for(const reports of [
  [a,{...b,attempt:1}],[{...a,attempt:1},{...b,attempt:1}],
  [a,{...b,attempt:3}],[{...a,attempt:3},{...b,attempt:3}],
  [a,{...b,runId:'456'}],[{...a,runId:'456'},{...b,runId:'456'}],
  [a,{...b,attempt:'2'}],[a,{...b,attempt:undefined}],
  [a,{...b,executionRepository:'foreign/demo'}],
  [a,{...b,source:{...source,controllerSha:'0'.repeat(40)}}]
 ])assert.throws(()=>runner.validateMatrix(reports,wanted));
 assert.throws(()=>runner.validateMatrix([a,b],{...wanted,attempt:undefined}));
});
