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
function ownedFixture({killWorks = true, diagnostics = false, zombiesOnKill = false} = {}) {
  const child = new EventEmitter(); child.pid = 200;
  const records = new Map([[100,{pid:100,group:100,session:100,start:'10'}], [200,{pid:200,group:200,session:200,start:'20'}]]);
  const signals = []; let clock = 0, monitor;
  const proc = {platform:'linux',pid:100,kill(group, signal) {
    if(signal === 0) {if(![...records.values()].some(r => r.group === -group)){const e=Error('gone');e.code='ESRCH';throw e;}return;}
    signals.push([group,signal]);
    if(zombiesOnKill){records.get(200).state='Z';child.emit('close');}
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
    setTimeout:fn=>{clock+=25;queueMicrotask(fn);}
  });
  const owned=module.exports.spawnOwned('controlled-child',[],{},{diagnostics});child.emit('spawn');
  return {owned,records,signals,monitor:()=>monitor()};
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
for(const kind of ['reuse','unknown','zombies'])test('Diagnostic ownership trace preserves safe failure: '+kind,async()=>{
  const f=ownedFixture({diagnostics:true});
  f.owned.observe('before-session-delete');
  if(kind==='reuse')f.records.get(200).start='999';
  if(kind==='unknown'){f.records.delete(200);f.records.set(201,{pid:201,parent:1,group:200,session:200,start:'21'});}
  if(kind==='zombies')f.records.get(200).state='Z';
  f.owned.observe('after-session-delete');f.monitor();
  await assert.rejects(f.owned.stop());assert.deepEqual(f.signals,[]);
  const trace=f.owned.observations,first=trace.find(r=>r.event===(kind==='reuse'?'leader-reused':'first-continuity-failure'));
  assert(first);assert.equal(first.processes[0].uids.join(','),'1001,1001,1001,1001');
  assert.equal(first.processes[0].state,kind==='zombies'?'Z':'S');
  assert(trace.every(r=>Number.isFinite(r.monotonicMs)&&!Number.isNaN(Date.parse(r.observedAt))));
  assert(!/controlled-child|command|environ|argv/.test(JSON.stringify(trace)));
});
test('Post-TERM zombie transition retains first failure and never authorizes KILL',async()=>{
  const f=ownedFixture({diagnostics:true,zombiesOnKill:true});
  await assert.rejects(f.owned.stop(),error=>{assert.equal(error.cleanup.signals.join(','),'SIGTERM');assert.equal(error.cleanup.childReaped,true);return /continuity/.test(error.message);});
  assert.deepEqual(f.signals,[[-200,'SIGTERM']]);
  assert.equal(f.owned.observations.filter(r=>r.event==='first-continuity-failure').length,1);
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
