'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {capabilities,localUrl,acceptProduct,run,InfrastructureBlocked} = require('./adapter.cjs');
const {start, maintainedScript,csp} = require('./fixture-server.cjs');
const assertions = {verdictField:'passed',idField:'label',expectedChecks:['fixture assertion']};

// These are protocol test doubles, not a Firefox/Chromium browser result.
async function scenario(options = {}) {
  const calls = []; let stopCount = 0, sandboxCount = 0;
  const engine = options.engine || 'firefox';
  const server = http.createServer(async(req,res)=>{
    let input = ''; for await (const chunk of req) input += chunk;
    const payload = input ? JSON.parse(input) : null;
    calls.push({method:req.method,url:req.url,payload});
    res.setHeader('content-type','application/json');
    let value = null;
    if (req.url === '/status') value = {ready:options.ready !== false};
    else if (req.url === '/session') value = {sessionId:'owned-session', capabilities:{
      browserName:options.wrongEngine ? 'unexpected-browser' : engine === 'firefox' ? 'firefox' : 'chrome',
      browserVersion:options.wrongVersion ? '0.1' : '151.0', platformName:'test-double', acceptInsecureCerts:false}};
    else if (req.method === 'DELETE') {
      if (options.deleteError) {res.writeHead(500);res.end(JSON.stringify({value:{error:'unknown error',message:'session cleanup failed'}}));return;}
    } else if (req.url.endsWith('/execute/sync')) {
      value = payload.script.includes('nativeSanitizer:') ?
        {dom:true,customElements:true,shadowDom:true,trustedTypes:true,trustedTypesEnforced:true,policyAllowlistEnforced:true,...options.features} :
        options.product || {status:'passed',checks:[{label:'fixture assertion',passed:true}]};
    }
    res.end(JSON.stringify({value}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const owner = {assertCurrent(){},observeTransition(event){options.transitions?.push(event);},async stop(){stopCount++;if(options.groupError){const error=Error('Owned group continuity lost');if(options.cleanupDetails)error.cleanup=options.cleanupDetails;throw error;}return {complete:true,evidenceKind:'test-double'};}};
  const sandbox = {async verify(){sandboxCount++;if(options.lateSandboxError && sandboxCount === 2)throw new InfrastructureBlocked('late sandbox loss');if(options.sandboxError)throw options.sandboxError;return {status:options.sandboxStatus || 'passed',evidenceKind:'test-double'};}};
  try {
    const report = await run({engine,version:'151.0',binary:'/test-only/browser',endpointUrl:origin,
      probeUrl:origin+'/probe',fixtureUrl:origin+'/fixture',resultKey:'__fixture',timeoutMs:options.timeoutMs || 1000,
      required:options.required || ['dom','customElements','shadowDom'],assertions,owner,sandbox:options.noSandboxObserver ? undefined : sandbox});
    return {report,calls,stopCount,sandboxCount};
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

for (const engine of ['firefox','chromium']) test(`${engine}: standard WebDriver commands, same owned session, independent cleanup`,async()=>{
  const {report,calls,stopCount,sandboxCount} = await scenario({engine});
  assert.equal(report.status,'passed');assert.equal(report.acceptedForRelease,false);
  assert.equal(report.evidenceKind,'prototype-controller-only');
  assert.equal(stopCount,1);assert.equal(sandboxCount,2);
  assert.equal(calls.filter(c=>c.url === '/session').length,1);
  assert.deepEqual(calls.filter(c=>c.url.endsWith('/url')).map(c=>new URL(c.payload.url).pathname),['/probe','/fixture']);
  assert(calls.every(c=>!c.url.includes('cdp')));
  assert.equal(calls.at(-1).method,'DELETE');
});
test('launch configuration never inherits unsafe Chromium defaults or Firefox preferences',()=>{
  for(const engine of ['firefox','chromium']) {
    const value = capabilities({engine,binary:'/browser',version:'151.0',args:['--no-sandbox'],prefs:{'security.sandbox.content.level':0}});
    const text = JSON.stringify(value);assert(!/no-sandbox|prefs|disable|allow-system-access/.test(text));
    assert.equal(value.capabilities.alwaysMatch.acceptInsecureCerts,false);
  }
  assert.throws(()=>capabilities({engine:'webkit',binary:'/browser',version:'151.0'}));
  assert.throws(()=>capabilities({engine:'firefox',binary:'firefox',version:'151.0'}));
});
test('remote endpoints, credentials and file URLs are rejected',()=>{
  for(const url of ['https://127.0.0.1','http://example.com','http://u:p@127.0.0.1','file:///tmp/file','http://0.0.0.0']) assert.throws(()=>localUrl(url));
});
test('missing native capability is explicit and product does not run',async()=>{
  const {report,calls}=await scenario({features:{trustedTypes:false},required:['trustedTypes','trustedTypesEnforced']});
  assert.equal(report.status,'capability-missing');assert.equal(report.phases.product.status,'not-run');
  assert.equal(calls.filter(c=>c.url.endsWith('/url')).length,1);
});
test('Trusted Types API without CSP enforcement cannot satisfy the security profile',async()=>{
  const {report}=await scenario({features:{trustedTypesEnforced:false},required:['trustedTypes','trustedTypesEnforced','policyAllowlistEnforced']});
  assert.equal(report.status,'capability-missing');
});
for(const extra of [{noSandboxObserver:true},{sandboxStatus:'not-provided'},{sandboxError:new InfrastructureBlocked('observed sandbox startup blockade')}]) {
  test('missing/blocked sandbox proof prevents product execution and cleans up',async()=>{
    const {report,stopCount}=await scenario(extra);assert.equal(report.status,'infrastructure-blocked');
    assert.equal(report.phases.product.status,'not-run');assert.equal(stopCount,1);
  });
}
test('unexpected sandbox observer failure is not reclassified as infrastructure',async()=>{
  const {report}=await scenario({sandboxError:Error('observer assertion')});assert.equal(report.status,'failed');
});
test('sandbox loss after product execution is a failure, never a startup blockade',async()=>{
  const {report}=await scenario({lateSandboxError:true});assert.equal(report.status,'failed');
  assert.equal(report.phases.sandbox.status,'passed');assert.equal(report.phases.product.status,'failed');
});
for(const extra of [{wrongEngine:true},{wrongVersion:true}]) test('browser identity mismatches fail and delete the created session',async()=>{
  const {report,calls}=await scenario(extra);assert.equal(report.status,'failed');
  assert.equal(report.phases.product.status,'not-run');assert.equal(calls.at(-1).method,'DELETE');
});
test('real product assertion failure is not infrastructure',async()=>{
  const {report}=await scenario({product:{status:'failed',checks:[{passed:false}]}});
  assert.equal(report.status,'failed');assert.equal(report.phases.product.status,'failed');
});
test('pending fixture times out as a product failure',async()=>{
  const {report}=await scenario({product:{status:'pending'},timeoutMs:120});
  assert.equal(report.status,'failed');assert.equal(report.phases.product.status,'failed');
});
test('empty, malformed or skipped assertions never satisfy a product proof',()=>{
  for(const result of [null,{status:'passed',checks:[]},{status:'passed',checks:[{passed:true,skipped:true}]},
    {status:'passed',checks:[{passed:true,status:'skipped'}]},{status:'passed',checks:[{passed:true}],summary:{skipped:1}}]) assert.equal(acceptProduct(result,assertions),false);
});
test('exact fixture check IDs prevent partial, duplicate, foreign or absent evidence',()=>{
  const result = {status:'passed',checks:[{label:'fixture assertion',passed:true}]};
  assert.equal(acceptProduct(result,assertions),true);
  assert.equal(acceptProduct(result),false);
  assert.equal(acceptProduct(result,{...assertions,expectedChecks:['fixture assertion','missing']}),false);
  assert.equal(acceptProduct({...result,checks:[...result.checks,...result.checks]},assertions),false);
  assert.equal(acceptProduct({...result,checks:[{label:'foreign',passed:true}]},assertions),false);
  assert.equal(acceptProduct({...result,errors:['unhandled rejection']},assertions),false);
  assert.equal(acceptProduct({status:'passed',checks:[{name:'DOM assertion',ok:true}]},
    {idField:'name',verdictField:'ok',expectedChecks:['DOM assertion']}),true);
});
test('product, session cleanup and owned-group continuity errors remain separately visible',async()=>{
  const {report}=await scenario({product:{status:'failed',checks:[{passed:false}]},deleteError:true,groupError:true});
  for(const phase of ['product','sessionCleanup','groupCleanup']) assert.equal(report.phases[phase].status,'failed');
  assert.match(report.phases.groupCleanup.reason,/continuity/);
});
test('cleanup failure overrides a blocked preflight without hiding either outcome',async()=>{
  const {report}=await scenario({noSandboxObserver:true,groupError:true});
  assert.equal(report.status,'failed');assert.equal(report.phases.sandbox.status,'infrastructure-blocked');
});
test('Session transitions are observed on failure and structured cleanup failure is retained',async()=>{
  const transitions=[],cleanupDetails={complete:false,groupGone:false,childReaped:true,signals:['SIGTERM'],remaining:null};
  const {report}=await scenario({deleteError:true,groupError:true,cleanupDetails,transitions});
  assert.deepEqual(transitions,['before-session-delete','after-session-delete']);
  assert.deepEqual(report.cleanup,cleanupDetails);assert.equal(report.phases.groupCleanup.status,'failed');
  assert.equal(report.phases.sessionCleanup.status,'failed');assert.equal(report.acceptedForRelease,false);
});
test('fixture service preserves production sanitizer assertions and strict CSP',async()=>{
  const server = await start();
  try {
    const response = await fetch(server.origin+'/__neutral/preflight');
    assert.equal(response.headers.get('content-security-policy'),csp);
    const security = await fetch(server.origin+'/__neutral/security');
    assert.equal(security.headers.get('content-security-policy'),csp);
    assert.match(await security.text(),/SSR safe/);
    const script = await (await fetch(server.origin+'/__neutral/security.mjs')).text();
    assert.equal(script,maintainedScript());assert.match(script,/trustedTypes.isHTML\(result.html\)/);
    assert.match(script,/verdict\?\.commitAllowed/);
    assert.equal((await fetch(server.origin+'/xtendrmt/html-sanitizer.mjs')).status,200);
    assert.equal((await fetch(server.origin+'/missing-file')).status,404);
    assert.equal((await fetch(server.origin+'/.git/config')).status,404);
    assert.equal((await fetch(server.origin+'/package.json')).status,404);
  } finally {await server.stop();}
});
