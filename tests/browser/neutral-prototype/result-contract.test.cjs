'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {profile,observe,observeFunctional,aggregate,aggregateFunctional,hash,contractDigest,nativeRequired,securityLabel} = require('./result-contract.cjs');
const fixtures = require('./fixture-contracts.json').fixtures;
const fs=require('node:fs'),path=require('node:path');
const {sha256}=require('../../../tools/browser-hypervisor');
// Entirely synthetic observations: these tests cannot certify any browser.
function sample(engine='firefox',node='24.18.0') {
  const p={id:engine+'-linux-'+node,engine,browserVersion:'158.0.1',driverVersion:'0.37.1',browserSha256:'b'.repeat(64),driverSha256:'d'.repeat(64),os:'linux',node,
    sandboxPolicy:'required',
    transport:{backend:'hypervisor-webdriver',protocol:engine==='firefox'?'webdriver-bidi':'webdriver-cdp',adapterSha256:sha256(fs.readFileSync(path.join(__dirname,'engine-adapters.cjs')))},
    capabilities:nativeRequired.map(id=>({id,implementation:'native'}))};
  const origin={repository:'konnilabs/xtend',source:{type:'committed',commit:'a'.repeat(40)},runId:'model-1',attempt:1,sessionId:engine+'-'+node,
    startedAt:'2026-10-21T17:00:00.000Z',finishedAt:'2026-10-21T17:00:01.000Z',contractSha256:contractDigest(),kind:'test-double'};
  const fixture=f=>({status:'passed',checks:f.assertions.expectedChecks.map(id=>({[f.assertions.idField]:id,[f.assertions.verdictField]:true})),errors:[]});
  const negative=fixture(fixtures[2]);negative.status='failed';negative.errors=['rmt build local http assets only'];
  Object.assign(negative.checks.at(-1),{passed:false,details:'http://127.0.0.1:9998/probe.svg'});
  const cases=Object.fromEntries(fixtures.map(f=>[f.id,{status:'passed',result:fixture(f)}]));
  Object.assign(cases,{
    'bidi-preload-order-fetch':{status:'passed',result:{status:'passed',early:true,active:0,maxActive:1,requests:[1,2,3].map(()=>({started:1,finished:2,bytes:1,sourceHash:'synthetic'})),errors:[]}},
    'bidi-context-isolation':{status:'passed',result:{absent:true,page:true}},
    'bidi-removal':{status:'passed',result:{status:'absent'}},
    'lifecycle-wrong-key':{status:'passed',result:{rejected:true,expectation:'missing result is rejected'}},
    'lifecycle-foreign-origin':{status:'passed',result:{expectation:'one specific product failure must remain visible',product:negative}}
  });
  const raw={engine,node:'v'+node,platform:'linux',acceptedForRelease:false,status:'passed',
    browserSha256:p.browserSha256,driverSha256:p.driverSha256,driverVersion:p.driverVersion,
    identity:{browserName:engine==='firefox'?'firefox':'chrome',browserVersion:p.browserVersion,platformName:'linux'},
    capabilities:Object.fromEntries(nativeRequired.map(id=>[id,true])),sandbox:{status:'passed',scope:'model-only'},
    phases:Object.fromEntries(['startup','sandbox','capabilities','product','qualification','sessionCleanup','groupCleanup'].map(id=>[id,{status:'passed'}])),
    product:{status:'passed',checks:[{label:securityLabel,passed:true}]},
    qualification:{status:'passed',acceptedForRelease:false,cases,sandboxObservations:[{status:'passed',scope:'model-only'}],sandboxObservationStatus:'passed',
      transport:{engine,protocol:engine==='firefox'?'webdriver-bidi':'webdriver-cdp'},preloadCleanup:{status:'passed',remaining:0},transportCleanup:{status:'passed',closed:true}},
    cleanup:{complete:true,groupGone:true,childReaped:true,remaining:[]}};
  return {p,origin,raw};
}
const record=s=>({raw:s.raw,observation:observe(s.raw,s.p,s.origin,s.proof),...(s.proof?{worktreeEvidence:s.proof}:{})});
function campaign() {
  const samples=['chromium','firefox'].flatMap(engine=>['24.18.0','26.5.0'].map(node=>sample(engine,node)));
  const {sessionId,startedAt,finishedAt,...expected}=samples[0].origin;
  return {profiles:samples.map(s=>s.p),expected,records:samples.map(record)};
}
for(const engine of ['chromium','firefox'])for(const node of ['24.18.0','26.5.0'])test(`${engine}/${node}: explicit MODEL coverage and no authority`,()=>{
  const s=sample(engine,node),r=observe(s.raw,s.p,s.origin);
  assert.equal(r.status,'passed');assert.deepEqual(r.coverage,{expected:45,executed:45,passed:45,failed:0,granularAssertions:39});
  assert.equal(r.layers.core.status,'not-run');assert.equal(r.acceptedForRelease,false);assert.equal(r.acceptedForMerge,false);
  assert.equal(r.recognition.status,'not-evaluated');assert.equal(r.provenance.kind,'test-double');
});
for(const [name,change] of [
  ['empty assertion pass',s=>s.raw.qualification.cases.core.result.checks=[]],
  ['partial assertion pass',s=>s.raw.qualification.cases.a11y.result.checks.pop()],
  ['duplicate assertion',s=>s.raw.qualification.cases.core.result.checks.push(s.raw.qualification.cases.core.result.checks[0])],
  ['foreign assertion',s=>s.raw.qualification.cases.core.result.checks[0].name='foreign'],
  ['skipped assertion',s=>s.raw.qualification.cases.core.result.checks[0].skipped=true],
  ['missing scenario execution',s=>delete s.raw.qualification.cases['bidi-removal'].result],
  ['wrong negative outcome',s=>s.raw.qualification.cases['lifecycle-wrong-key'].result.rejected=false],
  ['false native capability',s=>s.raw.capabilities.trustedTypes=false],
  ['missing native capability',s=>delete s.raw.capabilities.trustedTypes],
  ['claimed sandbox without observation',s=>delete s.raw.sandbox],
  ['wrong browser identity',s=>s.raw.identity.browserName='chrome'],
  ['wrong driver version',s=>s.raw.driverVersion='0.1'],
  ['wrong executable bytes',s=>s.raw.browserSha256='e'.repeat(64)],
  ['wrong Node',s=>s.raw.node='v26.5.0'],
  ['wrong OS',s=>s.raw.platform='darwin'],
  ['unknown result status',s=>s.raw.status='skipped'],
  ['unreaped cleanup',s=>s.raw.cleanup.childReaped=false],
  ['invented release acceptance',s=>s.raw.acceptedForRelease=true],
  ['obsolete source binding',s=>s.origin.contractSha256='0'.repeat(64)],
  ['empty execution interval',s=>s.origin.finishedAt=s.origin.startedAt],
  ['unknown evidence kind',s=>s.origin.kind='trusted'],
  ['unqualified backend',s=>s.p.transport.backend='playwright'],
  ['foreign transport protocol',s=>s.p.transport.protocol='webdriver-cdp'],
  ['substituted adapter bytes',s=>s.p.transport.adapterSha256='0'.repeat(64)],
  ['explicit unsandboxed model as security profile',s=>s.p.sandboxPolicy='disabled'],
  ['results after failed preflight',s=>s.raw.phases.sandbox.status='infrastructure-blocked'],
  ['hidden guard failure',s=>s.raw.qualification.sandboxObservationStatus='failed'],
])test('rejects '+name,()=>{const s=sample();change(s);assert.throws(()=>observe(s.raw,s.p,s.origin));});
test('real assertion failure stays failed and is distinct from successful cleanup',()=>{
  const s=sample();s.raw.status='failed';s.raw.phases.qualification.status='failed';s.raw.qualification.status='failed';
  s.raw.qualification.cases.core.status='failed';s.raw.qualification.cases.core.result.status='failed';s.raw.qualification.cases.core.result.checks[0].ok=false;
  const r=observe(s.raw,s.p,s.origin);assert.equal(r.status,'failed');assert.equal(r.layers.web.status,'failed');
  assert.equal(r.layers.runner.status,'passed');
  assert.equal(r.coverage.failed,1);assert.equal(r.layers.runner.phases.find(r=>r.id==='groupCleanup').status,'passed');
});
test('sandbox-start blockade leaves product not-run without fabricating execution',()=>{
  const s=sample();s.raw.status='infrastructure-blocked';s.raw.phases.sandbox.status='infrastructure-blocked';
  for(const id of ['capabilities','product','qualification'])s.raw.phases[id].status='not-run';
  delete s.raw.sandbox;delete s.raw.capabilities;delete s.raw.product;delete s.raw.qualification;
  const r=observe(s.raw,s.p,s.origin);assert.equal(r.status,'blocked');assert.equal(r.layers.web.status,'not-run');assert.equal(r.coverage.executed,0);
});
test('later null-seccomp guard never erases earlier product evidence or grants safety',()=>{
  const s=sample();s.raw.status='failed';s.raw.phases.qualification.status='failed';s.raw.qualification.status='failed';s.raw.qualification.sandboxObservationStatus='failed';
  for(const id of ['core','a11y','lifecycle','bidi-removal','lifecycle-wrong-key','lifecycle-foreign-origin'])s.raw.qualification.cases[id]={status:'not-run'};
  const r=observe(s.raw,s.p,s.origin);assert.equal(r.status,'failed');assert.equal(r.layers.runner.status,'failed');
  assert.equal(r.layers.web.status,'not-run');assert.equal(r.coverage.executed,3);assert.equal(r.acceptedForRelease,false);
});
test('profile prevents reduced security, unreviewed fallback and implicit engine choice',()=>{
  for(const change of [s=>s.p.capabilities.pop(),s=>s.p.capabilities[0].implementation='fallback',s=>delete s.p.engine,s=>s.p.engine='auto',s=>s.p.os='unknown']){
    const s=sample();change(s);assert.throws(()=>profile(s.p));
  }
});
test('completed function assertions and a later sandbox failure are separate dimensions',()=>{
  const s=sample();s.raw.status='failed';s.raw.phases.qualification.status='failed';s.raw.qualification.status='failed';s.raw.qualification.sandboxObservationStatus='failed';
  const r=observe(s.raw,s.p,s.origin);assert.equal(r.layers.web.status,'passed');assert.equal(r.layers.runner.status,'failed');
  assert.equal(r.status,'failed');assert.equal(r.acceptedForRelease,false);assert.equal(r.coverage.passed,45);
  assert.equal(r.layers.runner.namespaceIsolation,'not-established-by-this-contract');
});
test('complete four-profile model aggregates but is explicitly ineligible as browser proof',()=>{
  const result=aggregate(campaign());assert.equal(result.status,'passed');assert.equal(result.recognition.status,'blocked');
  assert.match(result.recognition.reason,/test-double/);assert.equal(result.acceptedForRelease,false);
});
for(const [name,change] of [
  ['missing lane',c=>c.records.pop()],
  ['duplicate lane',c=>c.records[1]=c.records[0]],
  ['foreign engine',c=>c.records[0].observation.profile.engine='webkit'],
  ['foreign source',c=>c.records[0].observation.provenance.source.commit='b'.repeat(40)],
  ['foreign repository',c=>c.records[0].observation.provenance.repository='foreign/repo'],
  ['foreign run',c=>c.records[0].observation.provenance.runId='other'],
  ['foreign attempt',c=>c.records[0].observation.provenance.attempt=2],
  ['reused session',c=>c.records[1].observation.provenance.sessionId=c.records[0].observation.provenance.sessionId],
  ['tampered coverage',c=>c.records[0].observation.coverage.executed++],
  ['substituted raw payload',c=>c.records[0].raw.product.checks[0].passed=false],
  ['forged acceptance',c=>c.records[0].observation.acceptedForRelease=true],
  ['mixed evidence kinds',c=>c.records[0].observation.provenance.kind='live-session'],
  ['unexpected receipt',c=>c.authenticatedBindings=[{profileId:'foreign',observationSha256:'a'.repeat(64),rawSha256:'b'.repeat(64)}]],
  ['missing plan',c=>c.profiles=[]]
])test('aggregation rejects '+name,()=>{const c=campaign();change(c);assert.throws(()=>aggregate(c));});
test('self-declared live session remains unauthenticated and cannot create authority',()=>{
  const c=campaign();c.expected.kind='live-session';for(const r of c.records)r.observation.provenance.kind='live-session';
  assert.equal(aggregate(c).recognition.status,'blocked');
  c.authenticatedBindings=c.records.map(({observation:o})=>({profileId:o.profile.id,observationSha256:hash(o),rawSha256:o.rawSha256}));
  const r=aggregate(c);assert.equal(r.recognition.status,'not-evaluated');assert.equal(r.acceptedForMerge,false);assert.equal(r.acceptedForRelease,false);
  c.authenticatedBindings.push(c.authenticatedBindings[0]);assert.throws(()=>aggregate(c));
});
test('stored artifacts cannot be promoted to fresh execution',()=>{
  const c=campaign();c.expected.kind='recorded-artifact';for(const r of c.records)r.observation=observe(r.raw,r.observation.profile,{...r.observation.provenance,kind:'recorded-artifact'});
  assert.match(aggregate(c).recognition.reason,/recorded-artifact/);
});

for (const engine of ['firefox','chromium']) for (const driver of ['mac','darwin']) test(`${engine}: controlled ${driver} alias preserves raw identity`,()=>{
  const s=sample(engine);s.p.os='darwin';s.raw.platform='darwin';s.raw.identity.platformName=driver;
  const original=structuredClone(s.raw),r=observe(s.raw,s.p,s.origin);
  assert.equal(r.status,'passed');assert.deepEqual(r.platformIdentity,{hostRaw:'darwin',webdriverRaw:driver,normalizedOs:'darwin'});
  assert.deepEqual(s.raw,original);
});
for (const [host,driver] of [['darwin','linux'],['linux','mac'],['linux','darwin'],['darwin','macos'],['darwin','MAC'],['darwin','Mac OS X'],['darwin',''],['darwin',null]])
  test(`rejects conflicting/unknown OS ${host}/${driver}`,()=>{
    const s=sample();s.p.os=host;s.raw.platform=host;s.raw.identity.platformName=driver;
    assert.throws(()=>observe(s.raw,s.p,s.origin),/WebDriver platform/);
  });

// Synthetic receipt/patch bytes model the verifier boundary. They are never
// claimed to be git patches, browser executions, or independently signed proof.
function worktreeSample(node='24.18.0',oldController=false) {
  const s=sample('firefox',node),root=path.resolve(__dirname,'../../..');
  const names=[...fixtures.map(f=>f.path),require('./fixture-contracts.json').hydrangea.path,
    'tools/browser-hypervisor/index.js','tests/security/browser.test.mjs',
    ...['fixture-contracts.json','fixture-server.cjs','adapter.cjs','engine-adapters.cjs','qualification.cjs','result-contract.cjs','execution-profile.cjs'].map(n=>'tests/browser/neutral-prototype/'+n)];
  const files=names.sort().map(file=>({path:file,sha256:sha256(fs.readFileSync(path.join(root,file)))}));
  if(oldController)files.find(f=>f.path.endsWith('/result-contract.cjs')).sha256='e'.repeat(64);
  const patchBytes=Buffer.from('SYNTHETIC MODEL PATCH, NOT A BROWSER EXECUTION\n');
  s.origin.source={type:'worktree',baseCommit:'a'.repeat(40),patchSha256:sha256(patchBytes),worktreeSha256:hash(files)};
  s.origin.contractSha256=contractDigest(files);
  if(oldController)s.origin.kind='recorded-artifact';
  const {baseCommit,patchSha256,worktreeSha256}=s.origin.source;
  const source={baseCommit,committedSource:false,patchSha256,worktreeSha256};
  s.raw.sourceDigests=Object.fromEntries(['adapter.cjs','engine-adapters.cjs','qualification.cjs','result-contract.cjs'].map(n=>[n,files.find(f=>f.path.endsWith('/'+n)).sha256]));
  const rawBytes=Buffer.from(JSON.stringify(s.raw)),rawReportSha256=sha256(rawBytes);
  const receipt={source,kind:'live-session',status:'terminal',acceptedForMerge:false,acceptedForRelease:false,sourceUnchanged:true,
    sessionCreationRequests:1,sessionIds:[s.origin.sessionId],startedAt:s.origin.startedAt,finishedAt:s.origin.finishedAt,node,
    browserStatus:s.raw.status,rawReportSha256};
  const receiptBytes=Buffer.from(JSON.stringify(receipt));
  s.proof={before:{...source,files},after:structuredClone({...source,files}),patchBytes,receiptBytes,rawBytes,
    expected:{source:structuredClone(s.origin.source),receiptSha256:sha256(receiptBytes),rawReportSha256}};
  return s;
}
function alterReceipt(s,change) {
  const r=JSON.parse(s.proof.receiptBytes);change(r);s.proof.receiptBytes=Buffer.from(JSON.stringify(r));
  s.proof.expected.receiptSha256=sha256(s.proof.receiptBytes);
}
function worktreeCampaign() {
  const samples=['24.18.0','26.5.0'].map(v=>worktreeSample(v));
  const {sessionId,startedAt,finishedAt,...expected}=samples[0].origin;
  return {profiles:samples.map(s=>s.p),expected,records:samples.map(record)};
}
test('verified worktree model remains local regression even with matching receipt bindings',()=>{
  const s=worktreeSample(),r=observe(s.raw,s.p,s.origin,s.proof);
  assert.equal(r.status,'passed');assert.equal(r.provenance.source.type,'worktree');assert(!('commit' in r.provenance.source));
  assert.equal(r.recognition.status,'blocked');assert.equal(r.acceptedForMerge,false);assert.equal(r.acceptedForRelease,false);
  const c=worktreeCampaign();c.expected.kind='live-session';for(const r of c.records)r.observation=observe(r.raw,r.observation.profile,{...r.observation.provenance,kind:'live-session'},r.worktreeEvidence);
  c.authenticatedBindings=c.records.map(({observation:o})=>({profileId:o.profile.id,observationSha256:hash(o),rawSha256:o.rawSha256}));
  const result=aggregate(c);assert.equal(result.status,'passed');assert.equal(result.recognition.status,'blocked');assert.match(result.recognition.reason,/local regression/);
  assert.equal(result.acceptedForMerge,false);assert.equal(result.acceptedForRelease,false);
});
test('recorded worktree keeps executed and evaluator controller bytes distinct',()=>{
  const s=worktreeSample('24.18.0',true),r=observe(s.raw,s.p,s.origin,s.proof);
  assert.equal(r.evaluation.mode,'stored-observation-re-evaluation');
  assert.equal(r.evaluation.executionContractSha256,s.origin.contractSha256);
  assert.notEqual(r.evaluation.contractSha256,r.evaluation.executionContractSha256);
  assert.equal(r.recognition.status,'blocked');
  s.origin.kind='live-session';assert.throws(()=>observe(s.raw,s.p,s.origin,s.proof),/Old controller bytes/);
});
for(const [name,change] of [
  ['missing proof',s=>s.proof=undefined],
  ['missing patch bytes',s=>delete s.proof.patchBytes],
  ['missing before manifest',s=>delete s.proof.before],
  ['missing after manifest',s=>delete s.proof.after],
  ['missing external review bindings',s=>delete s.proof.expected],
  ['patch hash mismatch',s=>s.proof.patchBytes=Buffer.from('different')],
  ['worktree hash mismatch',s=>s.proof.before.files[0].sha256='f'.repeat(64)],
  ['changed after snapshot',s=>s.proof.after.files.pop()],
  ['duplicate source file',s=>s.proof.before.files.push(s.proof.before.files[0])],
  ['manipulated base commit',s=>s.origin.source.baseCommit='b'.repeat(40)],
  ['manipulated receipt bytes',s=>s.proof.receiptBytes=Buffer.from('{}')],
  ['manipulated raw bytes',s=>s.proof.rawBytes=Buffer.from('{}')],
  ['raw object differs from actual bytes',s=>s.raw.identity.platformName='mac'],
  ['missing worktree hash',s=>delete s.origin.source.worktreeSha256],
  ['base commit as tested commit',s=>s.origin.source={type:'committed',commit:s.origin.source.baseCommit}],
  ['mixed source types',s=>s.origin.source.commit=s.origin.source.baseCommit],
  ['unknown source type',s=>s.origin.source.type='trusted'],
  ['obsolete execution contract',s=>s.origin.contractSha256='f'.repeat(64)],
  ['receipt claims committed source',s=>alterReceipt(s,r=>r.source.committedSource=true)],
  ['receipt wrong base commit',s=>alterReceipt(s,r=>r.source.baseCommit='b'.repeat(40))],
  ['receipt release recognition',s=>alterReceipt(s,r=>r.acceptedForRelease=true)],
  ['receipt merge recognition',s=>alterReceipt(s,r=>r.acceptedForMerge=true)],
  ['receipt lacks source continuity',s=>alterReceipt(s,r=>r.sourceUnchanged=false)],
  ['receipt reused session',s=>alterReceipt(s,r=>r.sessionIds=['other-session'])],
  ['receipt missing executed session',s=>alterReceipt(s,r=>r.sessionCreationRequests=0)],
  ['receipt wrong interval',s=>alterReceipt(s,r=>r.finishedAt='2026-10-21T18:00:00.000Z')],
  ['receipt wrong Node',s=>alterReceipt(s,r=>r.node='26.5.0')],
])test('worktree rejects '+name,()=>{const s=worktreeSample();change(s);assert.throws(()=>observe(s.raw,s.p,s.origin,s.proof));});
for(const [name,change] of [
  ['incomplete commit',s=>s.origin.source.commit='a'],
  ['base claim in committed type',s=>s.origin.source.baseCommit='a'.repeat(40)],
  ['legacy ambiguous sourceSha',s=>s.origin.sourceSha=s.origin.source.commit],
  ['committed type mislabeled worktree',s=>s.origin.source.type='worktree'],
  ['committed stale contract',s=>s.origin.contractSha256='0'.repeat(64)],
  ['raw merge acceptance',s=>s.raw.acceptedForMerge=true],
])test('committed provenance still rejects '+name,()=>{const s=sample();change(s);assert.throws(()=>observe(s.raw,s.p,s.origin));});
for(const [name,change] of [
  ['missing worktree evidence',c=>delete c.records[0].worktreeEvidence],
  ['mixed source types',c=>c.records[0].observation.provenance.source={type:'committed',commit:'a'.repeat(40)}],
  ['foreign base in campaign',c=>c.expected.source={...c.expected.source,baseCommit:'b'.repeat(40)}],
  ['invented observation recognition',c=>c.records[0].observation.recognition.status='accepted'],
  ['invented merge acceptance',c=>c.records[0].observation.acceptedForMerge=true],
  ['invented release acceptance',c=>c.records[0].observation.acceptedForRelease=true],
])test('worktree aggregation rejects '+name,()=>{const c=worktreeCampaign();change(c);assert.throws(()=>aggregate(c));});

function functionalSample(node='24.18.0'){
  const s=sample('chromium',node),id=require('./execution-profile.cjs').functional;
  Object.assign(s.p,{id,purpose:'ci-functional-only',sandboxPolicy:'disabled'});
  Object.assign(s.raw,{executionProfile:id,sandboxEnabled:false,acceptedForSecurity:false,sandboxEvidence:{status:'not-provided'}});
  delete s.raw.sandbox;s.raw.phases.sandbox.status='not-run';s.raw.qualification.sandboxObservationStatus='not-run';s.raw.qualification.sandboxObservations=[];
  return s;
}
test('functional MODEL covers identical product assertions while sandbox evidence stays absent',()=>{
  const s=functionalSample(),r=observeFunctional(s.raw,s.p,s.origin);
  assert.equal(r.status,'passed');assert.equal(r.coverage.passed,45);assert.equal(r.layers.productSecurity.status,'passed');
  assert.equal(r.sandboxEnabled,false);assert.equal(r.layers.browserSandbox.status,'not-run');assert.equal(r.layers.browserSandbox.evidence,'not-provided');
  assert.equal(r.recognition.status,'blocked');for(const key of ['acceptedForSecurity','acceptedForMerge','acceptedForRelease'])assert.equal(r[key],false);
  assert.throws(()=>observe(s.raw,s.p,s.origin));
  const securityProfile={...s.p,id:'chromium-security',sandboxPolicy:'required'};delete securityProfile.purpose;
  assert.throws(()=>observe(s.raw,securityProfile,s.origin),/Disabled sandbox/);
  assert.throws(()=>aggregate({profiles:[s.p],expected:{},records:[{raw:s.raw,observation:r}]}));
});
test('functional MODEL does not hide an actual product assertion failure',()=>{
  const s=functionalSample();s.raw.status='failed';s.raw.phases.qualification.status='failed';s.raw.qualification.status='failed';
  const f=s.raw.qualification.cases.core;f.status='failed';f.result.status='failed';f.result.checks[0].ok=false;
  const r=observeFunctional(s.raw,s.p,s.origin);assert.equal(r.status,'failed');assert.equal(r.coverage.failed,1);assert.equal(r.layers.runner.status,'passed');
});
for(const [name,change] of [
  ['security purpose',s=>s.p.purpose='security'],['missing opt-in',s=>delete s.raw.executionProfile],
  ['wrong OS',s=>s.p.os='darwin'],['wrong engine',s=>s.p.engine='firefox'],['wrong Node',s=>s.p.node='22.0.0'],
  ['claimed sandbox enabled',s=>s.raw.sandboxEnabled=true],['sandbox pass',s=>s.raw.phases.sandbox.status='passed'],
  ['fabricated sandbox evidence',s=>s.raw.sandbox={status:'passed'}],['fabricated later sandbox sample',s=>s.raw.qualification.sandboxObservations=[{status:'passed'}]],
  ['security acceptance',s=>s.raw.acceptedForSecurity=true],['release acceptance',s=>s.raw.acceptedForRelease=true],
  ['merge acceptance',s=>s.raw.acceptedForMerge=true],['silent skip',s=>s.raw.qualification.cases.core.result.checks[0].skipped=true],
  ['partial coverage',s=>s.raw.qualification.cases.a11y.result.checks.pop()],['missing cleanup',s=>s.raw.cleanup.complete=false]
])test('functional contract rejects '+name,()=>{const s=functionalSample();change(s);assert.throws(()=>observeFunctional(s.raw,s.p,s.origin));});

function functionalCampaign(){
 const samples=require('./execution-profile.cjs').nodes.map(node=>functionalSample(node));
 const {sessionId,startedAt,finishedAt,...expected}=samples[0].origin;
 return {profiles:samples.map(s=>s.p),expected,records:samples.map(s=>({raw:s.raw,observation:observeFunctional(s.raw,s.p,s.origin)}))};
}
test('functional two-lane MODEL aggregates at one exact source without security/release authority',()=>{
 const r=aggregateFunctional(functionalCampaign());assert.equal(r.status,'passed');assert.equal(r.profiles.length,2);
 assert.equal(r.sandboxEnabled,false);assert.equal(r.sandboxEvidence,'not-provided');assert.equal(r.recognition.status,'blocked');
 for(const k of ['acceptedForSecurity','acceptedForMerge','acceptedForRelease'])assert.equal(r[k],false);
});
for(const [name,mutate] of [
 ['missing lane',c=>c.records.pop()],['duplicate lane',c=>c.records[1]=c.records[0]],
 ['wrong head',c=>c.records[1].observation.provenance.source.commit='f'.repeat(40)],
 ['wrong run',c=>c.records[1].observation.provenance.runId='other'],['wrong attempt',c=>c.records[1].observation.provenance.attempt=2],
 ['reused session',c=>c.records[1].observation.provenance.sessionId=c.records[0].observation.provenance.sessionId],
 ['false coverage',c=>c.records[1].observation.coverage.executed++],['reduced plan',c=>c.profiles.pop()],
 ['release claim',c=>c.records[0].observation.acceptedForRelease=true]
])test('functional matrix rejects '+name,()=>{const c=functionalCampaign();mutate(c);assert.throws(()=>aggregateFunctional(c));});
function matrixFiles(t){
 const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'xtend-functional-matrix-model-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const pin=require('../../security/sandboxed-browser.cjs').pin;
 const samples=require('./execution-profile.cjs').nodes.map(node=>{const s=functionalSample(node);s.origin.kind='live-session';s.origin.runId='12345';
  s.p.browserVersion=pin.version;s.p.driverVersion=pin.version;s.raw.identity.browserVersion=pin.version;s.raw.driverVersion=pin.version;return s;});
 const {sessionId,startedAt,finishedAt,...expected}=samples[0].origin;
 const dirs=[];
 for(const s of samples){const dir=path.join(root,`chromium-functional-12345-1-${s.p.node}`);fs.mkdirSync(dir);dirs.push(dir);
  const observation=observeFunctional(s.raw,s.p,s.origin);
  const summary={node:s.p.node,source:s.origin.source,runId:s.origin.runId,attempt:1,sessionId:s.origin.sessionId,sessionCreationRequests:1,observation,status:'passed',mapping:{status:'passed'},sandboxEnabled:false,acceptedForMerge:false,acceptedForRelease:false};
  const terminal={node:s.p.node,mode:'ci-functional-only',sandboxEnabled:false,sandboxEvidence:'not-provided',acceptedForMerge:false,acceptedForRelease:false,outcomes:Object.fromEntries(['install','runtime','controls','provision','browser'].map(id=>[id,'success']))};
  const provision={version:pin.version,archives:pin.archives,executables:{'chrome-linux64/chrome':s.p.browserSha256,'chromedriver-linux64/chromedriver':s.p.driverSha256}};
  for(const [name,value] of Object.entries({'summary.json':summary,'report.json':s.raw,'job-terminal.json':terminal,'provisioning.json':provision}))fs.writeFileSync(path.join(dir,name),JSON.stringify(value));
 }
 return {root,expected,dirs,change(file,fn){const p=path.join(dirs[1],file),v=JSON.parse(fs.readFileSync(p));fn(v);fs.writeFileSync(p,JSON.stringify(v));}};
}
test('same-run artifact MODEL reconstructs both functional lanes without granting release',t=>{
 const f=matrixFiles(t),r=require('./functional-matrix.cjs').load(f.root,f.expected);assert.equal(r.status,'passed');assert.equal(r.acceptedForMerge,false);assert.equal(r.acceptedForRelease,false);
});
for(const [name,change] of [
 ['missing artifact',f=>fs.rmSync(f.dirs[1],{recursive:true})],['foreign artifact',f=>fs.mkdirSync(path.join(f.root,'foreign'))],
 ['wrong session budget',f=>f.change('summary.json',v=>v.sessionCreationRequests=2)],['false job success',f=>f.change('job-terminal.json',v=>v.outcomes.browser='skipped')],
 ['foreign archive',f=>f.change('provisioning.json',v=>v.archives['chrome-linux64.zip']='e'.repeat(64))],
 ['foreign binary',f=>f.change('provisioning.json',v=>v.executables['chrome-linux64/chrome']='e'.repeat(64))],
 ['wrong source',f=>f.expected.source.commit='f'.repeat(40)],['wrong run',f=>f.expected.runId='54321'],['wrong attempt',f=>f.expected.attempt=2],
 ['symlink evidence',f=>{const p=path.join(f.dirs[1],'report.json');fs.renameSync(p,p+'.real');fs.symlinkSync(p+'.real',p);}],
 ['sandbox claim',f=>f.change('summary.json',v=>v.sandboxEnabled=true)]
])test('artifact matrix rejects '+name,t=>{const f=matrixFiles(t);change(f);assert.throws(()=>require('./functional-matrix.cjs').load(f.root,f.expected));});
