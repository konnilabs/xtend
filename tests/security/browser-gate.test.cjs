'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm');
const {EventEmitter} = require('node:events'), {spawnSync} = require('node:child_process');
const {InfrastructureBlocked, startupFailure, runBrowserGate, requirePassedGate} = require('./browser-gate.cjs');
const {evaluate, required} = require('../../scripts/development-gate.cjs');
const {testFiles} = require('../../scripts/security-node-tests.cjs');
const root = path.resolve(__dirname, '../..');

test('successful preflight passes its identical live session to product assertions; cleanup is required', async () => {
  const session = {binary:'/verified/chrome', pid:123}, calls = [];
  const gate = await runBrowserGate({
    preflight:async () => {calls.push('preflight'); return session;},
    product:async actual => {assert.equal(actual, session); calls.push('product');},
    cleanup:async actual => {assert.equal(actual, session); calls.push('cleanup');}
  });
  assert.deepEqual(calls, ['preflight', 'product', 'cleanup']);
  assert.equal(gate.status, 'passed'); requirePassedGate(gate);
});
test('observed sandbox startup blockade leaves product unexecuted and cannot provide release evidence', async () => {
  let product = 0, cleanup = 0;
  const gate = await runBrowserGate({
    preflight:async () => {throw startupFailure({stderr:'FATAL: No usable sandbox!', exitCode:1, signalCode:null});},
    product:async () => product++, cleanup:async () => cleanup++
  });
  assert.equal(product, 0); assert.equal(cleanup, 1);
  assert.equal(gate.preflight.status, 'infrastructure-blocked');
  assert.equal(gate.product.status, 'not-run'); assert.equal(gate.status, 'infrastructure-blocked');
  assert.throws(() => requirePassedGate(gate));
});
for (const [name, value] of [
  ['unknown crash', {stderr:'segmentation fault', exitCode:1, signalCode:null}],
  ['live process timeout', {stderr:'No usable sandbox!', exitCode:null, signalCode:null}],
  ['successful exit', {stderr:'No usable sandbox!', exitCode:0, signalCode:null}],
  ['missing process status', {stderr:'No usable sandbox!'}]
]) test(name + ' is not relabelled as known sandbox infrastructure', () => {
  assert.equal(startupFailure(value) instanceof InfrastructureBlocked, false);
});
test('unsafe setup remains a preflight failure and product does not run', async () => {
  const gate = await runBrowserGate({preflight:async () => {throw Error('Configured official browser archive digest mismatch');},
    product:async () => assert.fail('must not run'), cleanup:async () => {}});
  assert.equal(gate.preflight.status, 'failed'); assert.equal(gate.product.status, 'not-run');
  assert.equal(gate.status, 'failed'); assert.throws(() => requirePassedGate(gate));
});
test('real product assertion failure stays failed even when its text resembles a sandbox diagnostic', async () => {
  const gate = await runBrowserGate({preflight:async () => ({}),
    product:async () => {throw new InfrastructureBlocked('No usable sandbox! in assertion payload');}, cleanup:async () => {}});
  assert.equal(gate.preflight.status, 'passed'); assert.equal(gate.product.status, 'failed');
  assert.equal(gate.status, 'failed'); assert.throws(() => requirePassedGate(gate));
});
for (const stage of ['passed', 'blocked', 'assertion']) test('cleanup failure is preserved independently of ' + stage, async () => {
  const gate = await runBrowserGate({
    preflight:async () => {if(stage === 'blocked') throw new InfrastructureBlocked('No usable sandbox!'); return {};},
    product:async () => {if(stage === 'assertion') throw Error('Trusted Types assertion failed');},
    cleanup:async () => {const e = Error('Owned group continuity lost'); e.cleanup = {complete:false, groupGone:false}; throw e;}
  });
  assert.equal(gate.preflight.status, stage === 'blocked' ? 'infrastructure-blocked' : 'passed');
  assert.equal(gate.product.status, stage === 'blocked' ? 'not-run' : stage === 'assertion' ? 'failed' : 'passed');
  assert.equal(gate.cleanup.status, 'failed'); assert.equal(gate.cleanup.details.groupGone, false);
  assert.equal(gate.status, 'failed'); assert.throws(() => requirePassedGate(gate));
  if(stage === 'assertion') assert.match(gate.product.reason, /Trusted Types/);
});
test('missing, incomplete or forged all-green summary cannot satisfy the browser gate', () => {
  for(const gate of [null, {}, {status:'passed',preflight:{status:'infrastructure-blocked'},product:{status:'not-run'},cleanup:{status:'passed'}}]) {
    assert.throws(() => requirePassedGate(gate));
  }
});

// Exercise the unchanged process-identity implementation against controlled
// /proc records. No real process is signalled by these failure fixtures.
function ownedFixture({killWorks = true, diagnostics = false, zombiesOnKill = false, closeOnKill = true, onWait} = {}) {
  const child = new EventEmitter(); child.pid = 200;
  const records = new Map([[100,{pid:100,group:100,session:100,start:'10'}], [200,{pid:200,group:200,session:200,start:'20'}]]);
  const signals = []; let clock = 0, monitor;
  const proc = {platform:'linux',pid:100,kill(group, signal) {
    if(signal === 0) {if(![...records.values()].some(r => r.group === -group)){const e=Error('gone');e.code='ESRCH';throw e;}return;}
    signals.push([group,signal]);
    if(zombiesOnKill){records.get(200).state='Z';if(closeOnKill)child.emit('close');}
    else if(killWorks){records.delete(200);child.emit('close');}
  }};
  const fakeFs = {readdirSync:() => [...records.keys()].map(String),readFileSync(file) {
    if(file.endsWith('/status'))return 'Uid:\t1001\t1001\t1001\t1001\n';
    const pid=Number(/\/proc\/(\d+)\/stat/.exec(file)?.[1]), r=records.get(pid);
    if(!r){const e=Error('gone');e.code='ENOENT';throw e;}
    const fields=Array(20).fill('0');fields[0]=r.state||'S';fields[1]=String(r.parent||100);fields[2]=String(r.group);fields[3]=String(r.session);fields[19]=r.start;
    return pid+' (fixture) '+fields.join(' ');
  }};
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'owned-browser-process.cjs'),'utf8'), {
    module,require:name => name==='node:fs' ? fakeFs : name==='node:child_process' ? {spawn:(_command,_args,options)=>{assert.equal(options.detached,true);return child;}} : assert.fail(name),
    process:proc,performance:{now:()=>clock},setInterval:fn=>{monitor=fn;return 1;},clearInterval:()=>{},
    setTimeout:fn=>{clock+=25;onWait?.({records,child,clock});queueMicrotask(fn);}
  });
  const owned=module.exports.spawnOwned('controlled-child',[],{},{diagnostics});child.emit('spawn');
  return {owned,records,signals,child,monitor:()=>monitor()};
}
test('authenticated live process group can be stopped and reaped', async () => {
  const f=ownedFixture();const result=await f.owned.stop();
  assert.equal(result.complete,true);assert.equal(result.groupGone,true);assert.equal(result.childReaped,true);
  assert.deepEqual(f.signals,[[-200,'SIGTERM']]);
});
for(const reuse of [false,true]) test(reuse ? 'reused leader identity cannot authorize signals' : 'unknown survivors cannot reseed process-group ownership', async () => {
  const f=ownedFixture();
  if(reuse)f.records.set(200,{pid:200,group:200,session:200,start:'999'});
  else {f.records.delete(200);f.records.set(201,{pid:201,group:200,session:200,start:'21'});}
  f.monitor();
  await assert.rejects(f.owned.stop(),error => {assert.equal(error.cleanup.complete,false);assert.equal(error.cleanup.groupGone,false);return /reused|continuity/.test(error.message);});
  assert.deepEqual(f.signals,[]);
});
test('bounded cleanup failure stays separate and never claims a reaped group', async () => {
  const f=ownedFixture({killWorks:false});
  await assert.rejects(f.owned.stop(),error => {assert.equal(error.cleanup.complete,false);assert.equal(error.cleanup.childReaped,false);return /not gone\/reaped/.test(error.message);});
  assert.deepEqual(f.signals,[[-200,'SIGTERM'],[-200,'SIGKILL']]);
});
for(const kind of ['reuse','unknown'])test('Diagnostic ownership trace preserves safe failure: '+kind,async()=>{
  const f=ownedFixture({diagnostics:true});
  f.owned.observe('before-session-delete');
  if(kind==='reuse')f.records.get(200).start='999';
  if(kind==='unknown'){f.records.delete(200);f.records.set(201,{pid:201,parent:1,group:200,session:200,start:'21'});}
  if(kind==='zombies')f.records.get(200).state='Z';
  f.owned.observe('after-session-delete');f.monitor();
  await assert.rejects(f.owned.stop());assert.deepEqual(f.signals,[]);
  const trace=f.owned.observations,first=trace.find(r=>r.event===(kind==='reuse'?'leader-reused':'first-continuity-failure'));
  assert(first);assert.equal(first.processes[0].uids.join(','),'1001,1001,1001,1001');
  assert.equal(first.processes[0].state,'S');
  assert(trace.every(r=>Number.isFinite(r.monotonicMs)&&!Number.isNaN(Date.parse(r.observedAt))));
  assert(!/controlled-child|command|environ|argv/.test(JSON.stringify(trace)));
});
test('Persistent post-TERM zombie times out and never authorizes KILL',async()=>{
  const f=ownedFixture({diagnostics:true,zombiesOnKill:true});
  await assert.rejects(f.owned.stop(),error=>{assert.equal(error.cleanup.signals.join(','),'SIGTERM');assert.equal(error.cleanup.childReaped,true);assert.equal(error.cleanup.remaining.join(','),'200');assert.equal(error.cleanup.groupGone,false);return /not gone\/reaped/.test(error.message);});
  assert.deepEqual(f.signals,[[-200,'SIGTERM']]);
  assert.equal(f.owned.observations.filter(r=>r.event==='first-continuity-failure').length,0);
});

test('development aggregation can pass its complete subset while browser evidence remains explicitly outside scope', () => {
  const needs=Object.fromEntries(required.map(id=>[id,{result:'success'}]));
  needs['core-security-browser']={result:'failure'};
  const result=evaluate(needs);assert.equal(result.status,'passed');
  assert.equal(result.browserSecurityEvidence,'not-evaluated');assert.equal(result.releaseDecision,'not-evaluated');
});
for(const status of ['failure','cancelled','skipped','missing']) test('development aggregation rejects '+status+' in every required dependency', () => {
  for(const id of required){
    const needs=Object.fromEntries(required.map(name=>[name,{result:'success'}]));
    if(status==='missing')delete needs[id];else needs[id].result=status;
    assert.equal(evaluate(needs).status,'failed',id);
  }
});
test('Node-only discovery excludes exactly the separately required real browser test', () => {
  const all=fs.readdirSync(__dirname).filter(name=>/\.test\.(?:cjs|mjs|js)$/.test(name)).map(name=>'tests/security/'+name).sort();
  assert.deepEqual([...testFiles(root),'tests/security/browser.test.mjs'].sort(),all);
  assert.ok(testFiles(root).includes('tests/security/browser-gate.test.cjs'));
});
test('summary CLI never exits successfully for blocked or missing coverage', t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'browser-gate-summary-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'gate.json'),cli=path.join(__dirname,'browser-gate.cjs');
  const env={...process.env};delete env.GITHUB_STEP_SUMMARY;
  const run=()=>spawnSync(process.execPath,[cli,'--gate',file],{env,encoding:'utf8'});
  assert.equal(run().status,1);
  fs.writeFileSync(file,JSON.stringify({status:'infrastructure-blocked',preflight:{status:'infrastructure-blocked'},product:{status:'not-run'},cleanup:{status:'passed'}}));
  const blocked=run();assert.equal(blocked.status,1);assert.match(blocked.stdout,/product: not-run/);
});
test('workflow keeps strict security aggregation and release browser dependencies without broad error suppression', () => {
  const security=fs.readFileSync(path.join(root,'.github/workflows/security-scan-regressions.yml'),'utf8');
  assert.match(security,/needs: \[node-security, browser-security\]/);
  assert.match(security,/test "\$NODE_RESULT" = success/);assert.match(security,/test "\$BROWSER_RESULT" = success/);
  assert.doesNotMatch(security,/continue-on-error|--no-sandbox/);
  assert.match(security,/node scripts\/security-node-tests\.cjs/);
  assert.match(security,/node --test --test-reporter=tap tests\/security\/browser\.test\.mjs/);
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/xtend-default-gates.yml'),'utf8');
  const job=name=>workflow.split('\n  '+name+':\n')[1]?.split(/\n  [a-z][\w-]*:\n/)[0] || '';
  const development=job('development-core-node-rmt');
  assert.doesNotMatch(development,/core-security-browser|continue-on-error/);
  assert.match(development,/github\.event_name == 'pull_request'/);
  for(const id of required)assert.ok(development.includes(id));
  for(const id of ['release-seal','npm-publish-latest'])assert.match(job(id),/needs\['core-security-browser'\]\.result == 'success'/);
  for(const id of ['pr-fast-gates','full-release-gates'])assert.match(job(id),/node --test --test-reporter=tap tests\/security\/browser-gate\.test\.cjs/);
  const core=fs.readFileSync(path.join(root,'scripts/release/core-security.cjs'),'utf8');
  assert.equal(core.split('requirePassedGate(report.browserGate);').length,3);
  assert.match(core,/report\.cleanup\.groupGone===true/);
});

for(const initiallyZombie of [false,true])test('Known zombie is observed until group disappearance AND child close: '+initiallyZombie,async()=>{
  const f=ownedFixture({diagnostics:true,zombiesOnKill:true,closeOnKill:false,onWait:({records,child,clock})=>{
    if(clock===50)records.delete(200);if(clock===100)child.emit('close');
  }});
  if(initiallyZombie){f.records.get(200).state='Z';f.monitor();}
  const result=await f.owned.stop();assert.equal(result.complete,true);assert.equal(result.childReaped,true);assert.equal(result.groupGone,true);
  assert.deepEqual(f.signals,initiallyZombie?[]:[[-200,'SIGTERM']]);
});
test('Group disappearance without child close is not a reaping proof',async()=>{
  const f=ownedFixture({zombiesOnKill:true,closeOnKill:false,onWait:({records})=>records.delete(200)});
  await assert.rejects(f.owned.stop(),error=>{assert.equal(error.cleanup.groupGone,true);assert.equal(error.cleanup.childReaped,false);return /not gone\/reaped/.test(error.message);});
  assert.deepEqual(f.signals,[[-200,'SIGTERM']]);
});
for(const kind of ['reused-zombie','unknown-zombie','unknown-live','wrong-session'])test('Read-only zombie wait fails on identity ambiguity: '+kind,async()=>{
  const f=ownedFixture({diagnostics:true,zombiesOnKill:true,closeOnKill:false,onWait:({records,clock})=>{
    if(clock!==25)return;
    if(kind==='reused-zombie')records.get(200).start='999';
    if(kind==='wrong-session')records.get(200).session=123;
    if(kind==='unknown-zombie'||kind==='unknown-live')records.set(201,{pid:201,parent:1,group:200,session:200,start:'21',state:kind==='unknown-live'?'S':'Z'});
  }});
  await assert.rejects(f.owned.stop(),error=>{assert.equal(error.cleanup.complete,false);return /reused|continuity|mismatch/.test(error.message);});
  assert.deepEqual(f.signals,[[-200,'SIGTERM']]);
});

const policy=require('./browser-gate.cjs'),securityProducer=require('../../scripts/release/core-security.cjs');
const catalog=require('../../scripts/test-runner/catalog'),executionSchema=require('../../scripts/test-runner/executor').SCHEMA;
function policyFixture(mode='gate'){
  const now=Date.now(),startedAt=new Date(now-1000).toISOString(),finishedAt=new Date(now).toISOString();
  const cleanup={complete:true,childReaped:true,groupGone:true,remaining:[],group:100,leaderStart:'100',signals:[],termMs:2000,killMs:2000};
  const stderr='[200:200:1026/120000.000000:FATAL:content/browser/zygote_host/zygote_host_impl_linux.cc:128] No usable sandbox!';
  const gate={status:'infrastructure-blocked',preflight:{status:'infrastructure-blocked',reason:stderr,startup:{stderr,exitCode:null,signalCode:'SIGABRT'}},
    product:{status:'not-run'},cleanup:{status:'passed'},preflightProof:null,invocation:'a'.repeat(64),
    launch:{browser:{binary:'/verified/chrome',sha256:'b'.repeat(64),size:100,uid:1001,gid:1001,
      version:require('./sandboxed-browser.cjs').pin.version,archiveSha256:require('./sandboxed-browser.cjs').pin.archives['chrome-linux64.zip']},
      argv:require('./sandboxed-browser.cjs').browserArguments('/private/profile'),pid:200,startedAt,finishedAt,
      devTools:false,spawnError:null,exitCode:null,signalCode:'SIGABRT'}};
  const stdout="not ok 1 - Chromium reparses production sanitizer output and preserves TrustedHTML through the runtime sink\n  failureType: 'testCodeFailure'\n  code: 'ERR_ASSERTION'\n  expected: 'passed'\n  actual: 'infrastructure-blocked'\n"+'# tests 1\n# pass 0\n# fail 1\n# cancelled 0\n# skipped 0\n# todo 0\n';
  const receipt={policy:'pull-request',mode,configuredBrowser:structuredClone(gate.launch.browser),invocation:gate.invocation,startedAt,finishedAt,
    source:{commit:'a'.repeat(40),sourceFingerprint:catalog.hash(Buffer.alloc(0)),catalogFingerprint:catalog.fingerprint(),sourceHashes:securityProducer.sourceHashes(root)},
    context:{run:'442:1',node:'v24.18.0',platform:'linux',arch:'x64',nodeOptions:''},
    producer:{kind:mode==='gate'?'process':'runner',status:1,signal:null,abortCause:null,cleanupError:null,cleanup,stdout,stderr:''}};
  const report={command:['node','--test','--test-reporter=tap','tests/security/browser.test.mjs'],node:'24.18.0',startedAt,finishedAt,
    sourceIntegrity:'passed',sourceHashes:receipt.source.sourceHashes,exitCode:1,signal:null,abortCause:null,cleanupError:null,
    cleanup,browserGate:gate,browserProof:null,stdout,stderr:''};
  const result={id:securityProducer.id,status:'failed',exitCode:1,passCount:0,failureCount:1,failures:[policy.blockedFailure],skipCount:0,skips:[],report};
  const entry={id:securityProducer.id,executionId:securityProducer.id,startedAt,completedAt:finishedAt,abortCause:null,result};
  const execution={schema:executionSchema,profile:securityProducer.id,complete:true,status:'failed',executionId:'controlled',
    commit:receipt.source.commit,sourceFingerprint:receipt.source.sourceFingerprint,catalogFingerprint:receipt.source.catalogFingerprint,
    run:receipt.context.run,runtime:{node:'v24.18.0',platform:'linux',arch:'x64',nodeOptions:''},expected:[securityProducer.id],
    startedAt,completedAt:finishedAt,results:[entry],executions:[{...entry,result:undefined}],infrastructureErrors:[]};
  return {raw:mode==='gate'?gate:execution,gate,receipt,report,result,execution};
}
for(const mode of ['gate','execution']){
  test(mode+' PR policy accepts only explicit unavailable coverage without changing raw failure',()=>{
    const f=policyFixture(mode),before=JSON.stringify(f.raw);
    assert.deepEqual(policy.evaluatePolicy(f.raw,f.receipt),{outcome:'infrastructure-not-executed',browserSecurityCoverage:'unavailable',releaseEligible:false});
    assert.equal(JSON.stringify(f.raw),before);assert.throws(()=>requirePassedGate(f.gate));
  });
  const cases=[
    ['configuration substitution',f=>f.receipt.configuredBrowser.sha256='0'.repeat(64)],
    ['unexpected test failure',f=>{f.receipt.producer.stdout=f.report.stdout=f.report.stdout.replace('ERR_ASSERTION','OTHER_ERROR');}],
    ['missing gate',f=>delete f.gate.preflight],['product ran',f=>f.gate.product.status='passed'],
    ['product failed',f=>f.gate.product.status='failed'],['cleanup failed',f=>f.gate.cleanup.status='failed'],
    ['post-launch sandbox failure',f=>f.gate.launch.devTools=true],['spawn error',f=>f.gate.launch.spawnError='EACCES'],
    ['unknown crash',f=>f.gate.preflight.startup.stderr=f.gate.preflight.reason='segmentation fault'],
    ['live timeout',f=>f.gate.launch.signalCode=f.gate.preflight.startup.signalCode=null],
    ['cancellation',f=>f.gate.launch.signalCode=f.gate.preflight.startup.signalCode='SIGTERM'],
    ['successful startup exit',f=>{f.gate.launch.signalCode=f.gate.preflight.startup.signalCode=null;f.gate.launch.exitCode=f.gate.preflight.startup.exitCode=0;}],
    ['wrong pin',f=>f.gate.launch.browser.archiveSha256='0'.repeat(64)],['root browser',f=>f.gate.launch.browser.uid=0],
    ['unsafe flags',f=>f.gate.launch.argv.push('--no-sandbox')],['missing launch',f=>delete f.gate.launch],
    ['unbound invocation',f=>f.gate.invocation='f'.repeat(64)],['stale launch',f=>f.gate.launch.startedAt='2020-01-01T00:00:00Z'],
    ['supervisor timeout',f=>f.receipt.producer.abortCause='timeout'],['supervisor signal',f=>f.receipt.producer.signal='SIGTERM'],
    ['supervisor spawn failure',f=>f.receipt.producer.abortCause='spawn-error'],['extra producer exit',f=>f.receipt.producer.status=2],
    ['supervisor cleanup error',f=>f.receipt.producer.cleanupError='failed'],['group survives',f=>f.receipt.producer.cleanup.remaining=[101]],
    ['unreaped child',f=>f.receipt.producer.cleanup.childReaped=false],
    ['unexpected stderr',f=>{f.receipt.producer.stderr=f.report.stderr='unexpected execution error';}],
    ['extra TAP failure',f=>{f.receipt.producer.stdout=f.report.stdout=f.report.stdout.replace('# fail 1','# fail 2');}],
    ['cancelled TAP',f=>{f.receipt.producer.stdout=f.report.stdout=f.report.stdout.replace('# cancelled 0','# cancelled 1');}]
  ];
  for(const [name,mutate]of cases)test(mode+' PR policy rejects '+name,()=>{const f=policyFixture(mode);mutate(f);assert.throws(()=>policy.evaluatePolicy(f.raw,f.receipt));});
}
for(const [name,mutate]of [
  ['extra runner failure',f=>{f.result.failures.push('other');f.result.failureCount++;}],
  ['wrong source',f=>f.execution.commit='b'.repeat(40)],['changed source files',f=>f.report.sourceHashes={}],
  ['source check not completed',f=>delete f.report.sourceIntegrity],['wrong attempt',f=>f.execution.run='442:2'],
  ['incomplete execution',f=>f.execution.complete=false],['duplicate suite',f=>f.execution.results.push(f.execution.results[0])],
  ['extra execution',f=>f.execution.executions.push(f.execution.executions[0])],['runner cleanup failure',f=>f.execution.infrastructureErrors=['cleanup']],
  ['worker aborted',f=>f.execution.results[0].abortCause='timeout'],['browser supervisor aborted',f=>f.report.abortCause='timeout'],
  ['unverified toolchain',f=>f.execution.runtime.toolchain={browser:{binary:{command:'chrome',available:false}}}],
  ['stale execution',f=>f.execution.startedAt='2020-01-01T00:00:00Z'],['missing phase report',f=>f.report.browserGate=null]
])test('Core policy rejects '+name,()=>{const f=policyFixture('execution');mutate(f);assert.throws(()=>policy.evaluatePolicy(f.raw,f.receipt));});
function policyEnv(mode){return {...process.env,GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'pull_request',GITHUB_REPOSITORY:'konnilabs/xtend',
  GITHUB_REF:'refs/pull/123/merge',GITHUB_WORKFLOW_REF:'konnilabs/xtend/.github/workflows/'+(mode==='gate'?'security-scan-regressions.yml':'xtend-default-gates.yml')+'@refs/pull/123/merge',
  GITHUB_RUN_ID:'442',GITHUB_RUN_ATTEMPT:'1',XTEND_POLICY_SOURCE_SHA:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()};}
for(const mode of ['gate','execution'])test(mode+' policy requires PR scope and exact workflow identity',()=>{
  const env=policyEnv(mode),source={commit:env.XTEND_POLICY_SOURCE_SHA};assert.equal(policy.policyContext(env,mode,source).run,'442:1');
  for(const [key,value]of [['GITHUB_EVENT_NAME','push'],['GITHUB_EVENT_NAME','workflow_dispatch'],['GITHUB_EVENT_NAME','schedule'],
    ['GITHUB_EVENT_NAME','pull_request_target'],['GITHUB_ACTIONS','false'],['GITHUB_REPOSITORY','elsewhere/repo'],['GITHUB_REF','refs/heads/main'],
    ['GITHUB_WORKFLOW_REF','other'],['GITHUB_RUN_ID',''],['GITHUB_RUN_ATTEMPT',''],['XTEND_POLICY_SOURCE_SHA','b'.repeat(40)]])
    assert.throws(()=>policy.policyContext({...env,[key]:value},mode,source),key);
});
test('workflow routes only pull_request through policy and keeps raw release archive unchanged',()=>{
  for(const [file,mode]of [['security-scan-regressions.yml','gate'],['xtend-default-gates.yml','execution']]){
    const text=fs.readFileSync(path.join(root,'.github/workflows',file),'utf8');
    assert.match(text,new RegExp("if: github.event_name == 'pull_request'[\\s\\S]*?run: node tests/security/browser-gate.cjs --run-pr "+mode));
    assert.match(text,/if: always\(\) && github.event_name == 'pull_request'\n        env:\n          NODE_OPTIONS: [^\n]+\n        run: node tests\/security\/browser-gate\.cjs --policy/);
    assert.match(text,/if: github.event_name != 'pull_request'[\s\S]*?node (?:--test|scripts\/run_xtend_tests\.js)/);
    assert.match(text,/if: always\(\) && github.event_name != 'pull_request'[\s\S]*?--(?:gate|execution)/);
    const browserJob=text.split("\n  "+(mode==='gate'?'browser-security':'core-security-browser')+":\n")[1].split(/\n  [a-z][\w-]*:\n/)[0];
    assert.doesNotMatch(browserJob,/continue-on-error/);
  }
  const core=fs.readFileSync(path.join(root,'scripts/release/core-security.cjs'),'utf8');
  assert.ok(core.indexOf("report.sourceIntegrity='passed'")<core.indexOf('throw Error(blockedFailure)'));
});

// Controlled producer only: exercise the real wrapper, file freshness/digests,
// summaries and event checks without launching a substitute browser.
for(const mode of ['gate','execution'])for(const scenario of ['blocked','passed','existing','existing-symlink','missing','malformed','symlink','nonce','source-change','pin-change','cleanup','extra-failure'])
 test(mode+' wrapper '+scenario,async t=>{
  // Keep generated evidence in the runner's ignored results directory.
  fs.mkdirSync(path.join(root,'.xtend-test-results'),{recursive:true});
  const destination=fs.mkdtempSync(path.join(root,'.xtend-test-results/policy-fixture-'));
  t.after(()=>fs.rmSync(destination,{recursive:true,force:true}));const file=path.join(destination,'raw.json');
  const env=policyEnv(mode);delete env.GITHUB_STEP_SUMMARY;env.NODE_OPTIONS ||= '';
  let calls=0,changed=false,configuredCalls=0,loaded;
  const browser=policyFixture(mode).gate.launch.browser;
  const core={...securityProducer,sourceHashes(directory){const value=securityProducer.sourceHashes(directory);if(changed)value.changed='bad';return value;},
   async runPolicyProducer({mode:actual,file:output,environment}){
    calls++;assert.equal(actual,mode);assert.equal(output,file);assert.match(environment.XTEND_BROWSER_POLICY_INVOCATION,/^[a-f0-9]{64}$/);
    const f=policyFixture(mode),now=new Date().toISOString(),source=loaded.sourceIdentity(root);
    f.gate.invocation=environment.XTEND_BROWSER_POLICY_INVOCATION;f.gate.launch.startedAt=f.gate.launch.finishedAt=now;
    Object.assign(f.execution,{...source,run:'442:1',startedAt:now,completedAt:now});delete f.execution.sourceHashes;
    f.execution.runtime.node=mode==='execution'?'v24.18.0':process.version;f.execution.runtime.nodeOptions=env.NODE_OPTIONS;
    for(const row of [f.report,...f.execution.results,...f.execution.executions]){row.startedAt=now;if(row===f.report)row.finishedAt=now;else row.completedAt=now;}
    f.report.sourceHashes=source.sourceHashes;
    if(scenario==='passed'){
      f.gate.status=f.gate.preflight.status=f.gate.product.status='passed';
      f.receipt.producer.status=f.report.exitCode=f.result.exitCode=0;
      f.receipt.producer.stdout=f.report.stdout='# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
      f.result.status=f.execution.status='passed';f.result.failureCount=0;f.result.failures=[];
    }
    if(scenario==='nonce')f.gate.invocation='0'.repeat(64);
    if(scenario==='source-change')changed=true;
    if(scenario==='cleanup')f.receipt.producer.cleanupError='owned cleanup failed';
    if(scenario==='extra-failure')f.receipt.producer.status=2;
    if(scenario==='symlink'){fs.writeFileSync(output+'.target',JSON.stringify(f.raw));fs.symlinkSync(output+'.target',output);}
    else if(scenario!=='missing')fs.writeFileSync(output,scenario==='malformed'?'{':JSON.stringify(f.raw));
    return f.receipt.producer;
   }};
  const realRequire=require('node:module').createRequire(path.join(__dirname,'browser-gate.cjs'));
  const localRequire=name=>name==='../../scripts/release/core-security.cjs'?core:name==='./sandboxed-browser.cjs'?
    {...realRequire(name),configuredBrowser(){configuredCalls++;return {...browser,...(scenario==='pin-change'&&configuredCalls>1?{sha256:'0'.repeat(64)}:{})};}}:realRequire(name);
  const Module=require('node:module'),fixtureModule=new Module(path.join(__dirname,'browser-gate.cjs'),module);
  fixtureModule.filename=path.join(__dirname,'browser-gate.cjs');fixtureModule.require=localRequire;
  fixtureModule.policyProcess={...process,env,version:mode==='execution'?'v24.18.0':process.version};
  fixtureModule.policyConsole={log(){},error(){}};
  fixtureModule._compile("'use strict';const process=module.policyProcess,console=module.policyConsole;\n"+
    fs.readFileSync(fixtureModule.filename,'utf8')+'\nmodule.exports.sourceIdentity=sourceIdentity;',fixtureModule.filename);loaded=fixtureModule.exports;
  if(scenario==='existing')fs.writeFileSync(file,'stale');
  if(scenario==='existing-symlink')fs.symlinkSync(file+'.absent',file);
  if(['blocked','passed'].includes(scenario)){
    await loaded.runPolicy(mode,file);assert.equal(calls,1);loaded.summarizePolicy(file);
    const receiptFile=file+'.policy.json',receipt=JSON.parse(fs.readFileSync(receiptFile)),bytes=fs.readFileSync(file);
    assert.equal(receipt.decision.outcome,scenario==='blocked'?'infrastructure-not-executed':'passed');assert.equal(receipt.decision.releaseEligible,false);
    fs.appendFileSync(file,' ');assert.throws(()=>loaded.summarizePolicy(file),/Substituted raw/);fs.writeFileSync(file,bytes);
    receipt.startedAt='2020-01-01T00:00:00Z';fs.writeFileSync(receiptFile,JSON.stringify(receipt));assert.throws(()=>loaded.summarizePolicy(file),/Stale/);
  }else{
    await assert.rejects(loaded.runPolicy(mode,file));assert.equal(calls,scenario.startsWith('existing')?0:1);
    if(!scenario.startsWith('existing')){assert.equal(JSON.parse(fs.readFileSync(file+'.policy.json')).decision.outcome,'failed');assert.throws(()=>loaded.summarizePolicy(file));}
  }
 });

for(const scenario of ['passed','blocked','throw','SIGINT','SIGTERM','SIGHUP','disconnect'])test('Core policy uses the maintained runner and preserves interruption/cleanup: '+scenario,async()=>{
  const Module=require('node:module'),file=path.join(root,'scripts/release/core-security.cjs'),fixture=new Module(file,module);
  fixture.filename=file;const proc=new EventEmitter();proc.env={XTEND_BROWSER_POLICY_INVOCATION:'previous'};
  let calls=0;const real=require('node:module').createRequire(file);
  fixture.require=name=>name==='../test-runner/catalog'?{select(options){assert.deepEqual(options,{profile:'core-security-browser'});return ['fixed'];}}:
    name==='../test-runner/executor'?{async execute(selected,options){calls++;assert.deepEqual(selected,['fixed']);
      assert.deepEqual(options,{profile:'core-security-browser',execution:'/controlled/report.json',jobs:1});
      assert.equal(proc.env.XTEND_BROWSER_POLICY_INVOCATION,'current');
      if(scenario==='throw')throw Error('runner cleanup failed');
      if(['SIGINT','SIGTERM','SIGHUP','disconnect'].includes(scenario))proc.emit(scenario);
      return {status:scenario==='passed'?'passed':'failed'};}}:real(name);
  fixture.policyProcess=proc;fixture._compile("'use strict';const process=module.policyProcess;\n"+fs.readFileSync(file,'utf8'),file);
  const promise=fixture.exports.runPolicyProducer({rootDir:root,mode:'execution',file:'/controlled/report.json',environment:{XTEND_BROWSER_POLICY_INVOCATION:'current'}});
  if(scenario==='throw')await assert.rejects(promise,/runner cleanup failed/);
  else{const result=await promise;assert.equal(result.kind,'runner');assert.equal(result.status,scenario==='passed'?0:1);
    assert.equal(result.abortCause,['passed','blocked'].includes(scenario)?null:scenario);}
  assert.equal(calls,1);assert.equal(proc.env.XTEND_BROWSER_POLICY_INVOCATION,'previous');assert.deepEqual(proc.eventNames(),[]);
});
