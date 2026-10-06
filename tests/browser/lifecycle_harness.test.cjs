'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {runFixture}=require('../../tools/browser-hypervisor');
const {listenXtendDevServer}=require('../../scripts/serve_xtend_dev');
const rootDir=path.resolve(__dirname,'../..');
// Read the actual registered fixture contract, not a duplicate expected key.
function lifecycleFixture() {
  const {BROWSER_FIXTURES}=require('./browser_smoke_suite');
  return BROWSER_FIXTURES.find(f=>f.path==='demos/xtendrmt/examples/lifecycle/browser-smoke.html');
}
test('Lifecycle browser harness accepts same-origin assets and rejects wrong keys / foreign origins',async()=>{
  const fixture=lifecycleFixture();
  const handle=await listenXtendDevServer({rootDir,port:0});
  const foreign=http.createServer((_q,r)=>{r.writeHead(200,{'content-type':'image/svg+xml'});r.end('<svg xmlns="http://www.w3.org/2000/svg"/>');});
  await new Promise(r=>foreign.listen(0,'127.0.0.1',r));
  const run=extra=>runFixture({rootDir,engine:'chromium',fixturePath:fixture.path,url:handle.origin+'/'+fixture.path,resultKey:fixture.resultKey,timeoutMs:10000,...extra});
  try {
    const positive=await run();
    assert.equal(positive.result.status,'passed',JSON.stringify(positive.result));
    assert(positive.result.checks.every(check=>check.passed));
    await assert.rejects(run({resultKey:'__xtendWp1DeliberatelyWrongResultKey'}),/deadline|did not publish/i);
    // Only add a passive, foreign-origin asset before the fixture evaluates it.
    const foreignUrl=`http://127.0.0.1:${foreign.address().port}/probe.svg`;
    const negative=await run({preloadScript:`document.addEventListener('DOMContentLoaded',()=>{const img=document.createElement('img');img.hidden=true;img.src=${JSON.stringify(foreignUrl)};document.body.append(img);},{once:true});`});
    assert.equal(negative.result.status,'failed');
    const failed=negative.result.checks.filter(check=>!check.passed);
    assert.equal(failed.length,1,JSON.stringify(negative.result));
    assert.equal(failed[0].label,'rmt build local http assets only');
    assert(failed[0].details.includes(foreignUrl));
  } finally {
    for(const server of [handle.server,foreign]){server.closeAllConnections();await new Promise(r=>server.close(r));}
  }
});
