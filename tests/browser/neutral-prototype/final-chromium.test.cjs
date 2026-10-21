'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {browserEndpoint,safeLog,safeStartupError,oneSession,exactContext}=require('./final-chromium.cjs');
test('final Chromium model uses only the same loopback browser endpoint',()=>{
 assert.equal(browserEndpoint('localhost:1234'),'http://127.0.0.1:1234/');
 assert.equal(browserEndpoint('127.0.0.1:1234','ws://localhost:1234/devtools/browser/abc-123'),'ws://127.0.0.1:1234/devtools/browser/abc-123');
});
for(const [address,ws] of [['remote:1234'],['127.0.0.1:99999'],['user@localhost:1234'],['localhost:1234','ws://localhost:4321/devtools/browser/abc'],
 ['localhost:1234','ws://remote:1234/devtools/browser/abc'],['localhost:1234','ws://localhost:1234/devtools/page/abc'],['localhost:1234','ws://localhost:1234/devtools/browser/abc?secret=1']])
 test('final Chromium rejects foreign debugger '+address+'/'+String(ws),()=>assert.throws(()=>browserEndpoint(address,ws)));
test('single-session boundary never sends a second creation request',async()=>{
 let sent=0,observed;const b=oneSession(async()=>{sent++;return {body:{value:{sessionId:'one'}}};},id=>observed=id);
 await b.request({},'POST','/session',{});assert.equal(observed,'one');assert.equal(b.count(),1);
 await assert.rejects(()=>b.request({},'POST','/session',{}),/budget exhausted/);assert.equal(sent,1);
});
test('failed first creation also exhausts the budget without retry',async()=>{
 let sent=0;const b=oneSession(async()=>{sent++;throw Error('startup failed');},()=>assert.fail());
 await assert.rejects(()=>b.request({},'POST','/session',{}),/startup failed/);
 await assert.rejects(()=>b.request({},'POST','/session',{}),/budget exhausted/);assert.equal(sent,1);
});
test('diagnostics retain only known booleans, never launch arguments or environment',()=>{
 const r=safeLog('private argv --user-data-dir=secret\nENV=secret\nNo usable sandbox!\nsession not created');
 assert.deepEqual(r,{noUsableSandbox:true,browserExited:true,rawLogRetained:false});assert(!JSON.stringify(r).includes('secret'));
});
test('startup errors preserve bounded cause classification without sensitive details',()=>{
 const r=safeStartupError('session not created: Chrome instance exited; --secret=value TOKEN=private');
 assert.equal(r.code,'session not created');assert.equal(r.knownCause,'Chrome instance exited');assert.match(r.detailSha256,/^[a-f0-9]{64}$/);
 assert(!/private|secret|TOKEN/.test(JSON.stringify(r)));
});
const context=()=>({GITHUB_REPOSITORY:'konnilabs/xtend',GITHUB_REF:'refs/heads/qualification/firefox-initial-20261021',GITHUB_EVENT_NAME:'push',GITHUB_SHA:'a'.repeat(40),GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1'});
test('exact first-attempt commit context accepted in model only',()=>exactContext(context(),'a'.repeat(40),''));
for(const key of ['GITHUB_REPOSITORY','GITHUB_REF','GITHUB_EVENT_NAME','GITHUB_SHA','GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'])test('rejects wrong final-run '+key,()=>{
 const e=context();e[key]=key==='GITHUB_RUN_ATTEMPT'?'2':'other';assert.throws(()=>exactContext(e,'a'.repeat(40),''));
});
test('uncommitted source cannot enter final Actions session',()=>assert.throws(()=>exactContext(context(),'a'.repeat(40),' M source.js')));
test('both driver invocations use the credential-free environment',()=>{
 const source=fs.readFileSync(path.join(__dirname,'final-chromium.cjs'),'utf8');
 assert.match(source,/execFileSync\(driver,\['--version'\],\{encoding:'utf8',timeout:5000,env:executionProfiles.childEnvironment\(tmp\)\}/);
 assert.match(source,/spawnOwned\(driver,[^\n]+env:executionProfiles.childEnvironment\(tmp\)/);
});
test('functional workflow explicitly opts in to one Node24 job without dispatch/retry',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../../../.github/workflows/xtend-firefox-qualification.yml'),'utf8');
 assert.match(source,/node: \['24\.18\.0'\]/);assert(!source.includes('26.5.0'));assert(!source.includes('campaign.cjs run'));
 assert.equal((source.match(/final-chromium\.cjs "\$QUAL_EVIDENCE"/g)||[]).length,1);
 assert(!/workflow_dispatch:|continue-on-error:|--no-sandbox|sudo |apt-get|sysctl|apparmor/.test(source));
 assert.match(source,/XTEND_CI_FUNCTIONAL_PROFILE: chromium-linux-ci-functions-no-sandbox-v1/);
 assert.match(source,/final-chromium\.cjs "\$QUAL_EVIDENCE" "\$QUAL_TOOLCHAIN" "\$XTEND_CI_FUNCTIONAL_PROFILE"/);
 assert.match(source,/name: XTend isolated Chromium functions \(sandbox disabled\)/);
 assert.equal((source.match(/^  [a-z]+:\n    if:/gm)||[]).length,1);
});
