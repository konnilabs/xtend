import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {createXtendLlmAppServer} from '../../products/xtend-llm/src/main/app-server.mjs';
import {configureAppServerSession, APP_CAPABILITY_HEADER} from '../../products/xtend-llm/src/main/app-server-session.mjs';
import {ResumeStore} from '../../products/rmt-animation-testbench/server/resume-store.mjs';
import {startServer as startAnimation} from '../../products/rmt-animation-testbench/server/index.mjs';
import {startServer as startErp} from '../../products/resumability-maraca-erp-demo/server/index.mjs';
const require = createRequire(import.meta.url);
const {createCompanionServer, TOKEN_HEADER} = require('../../tools/xtend-dev-surface/companion');
const {createNodeAppServiceHost} = require('../../xtend-maraca/node-app-service-host');
const {defineServerServices, service} = require('../../xtend-maraca/server-services');

function rawStatus(url, headers) {
  return new Promise((resolve,reject)=>{const request=http.get(url,{headers},response=>{response.resume();response.once('end',()=>resolve(response.statusCode));});request.once('error',reject);});
}

test('companion checks Host, Origin, token format, query bearer and single-use expiring tickets', async () => {
  assert.throws(() => createCompanionServer({token:'dev'}));
  let now=1000; const origin='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
  const handle=createCompanionServer({origin:'http://127.0.0.1:0',allowedOrigins:[origin],clockMs:()=>now});
  handle.listen(); await once(handle.server,'listening');
  const base=`http://127.0.0.1:${handle.server.address().port}`;
  const headers={[TOKEN_HEADER]:handle.token, origin};
  try {
    assert.equal((await fetch(base+'/gates',{headers})).status,200);
    const hostile=await fetch(base+'/gates',{headers:{...headers,origin:'https://attacker.example'}});
    assert.equal(hostile.status,403);assert.equal(hostile.headers.has('access-control-allow-origin'),false);
    assert.equal(await rawStatus(base+'/gates',{...headers,host:'attacker.example'}),403);
    assert.equal((await fetch(base+'/gates',{method:'OPTIONS',headers:{origin:'https://attacker.example'}})).status,403);
    const preflight=await fetch(base+'/gates',{method:'OPTIONS',headers:{origin,'access-control-request-method':'GET','access-control-request-headers':TOKEN_HEADER}});
    assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
    assert.match(preflight.headers.get('access-control-allow-headers'),new RegExp(TOKEN_HEADER));
    assert.equal((await fetch(base+`/gates?token=${handle.token}`)).status,401);
    const issue=async()=> (await (await fetch(base+'/stream-ticket',{method:'POST',headers})).json()).ticket;
    const ticket=await issue();const controller=new AbortController();
    const stream=await fetch(base+`/gate-runs/events?ticket=${ticket}`,{headers:{origin},signal:controller.signal});
    assert.equal(stream.status,200);controller.abort();
    assert.equal((await fetch(base+`/gate-runs/events?ticket=${ticket}`,{headers:{origin}})).status,401);
    const expired=await issue();now+=30001;
    assert.equal((await fetch(base+`/gate-runs/events?ticket=${expired}`,{headers:{origin}})).status,401);
  } finally {handle.server.closeAllConnections();await new Promise(resolve=>handle.close(resolve));}
});

test('AppService provenance checks run before body reading and state changes', async () => {
  let mutations=0; let policies=0;
  const database=new DatabaseSync(':memory:');database.exec('CREATE TABLE changes (value TEXT)');
  const count=()=>database.prepare('SELECT count(*) AS count FROM changes').get().count;
  const host=createNodeAppServiceHost({allowedOrigins:['https://approved.example'],requestPolicy:()=>{policies++;return true;},services:defineServerServices({'save':service({kind:'command',target:'server',invoke(){mutations++;database.exec("INSERT INTO changes VALUES ('saved')");return true;}})})});
  const server=http.createServer((req,res)=>host.handle(req,res));server.listen(0,'127.0.0.1');await once(server,'listening');
  const url=`http://127.0.0.1:${server.address().port}/api/xtend/services/save`;
  const body=JSON.stringify({schema:'xtend.maraca.app-service-request.v1',serviceId:'save',kind:'command',target:'server',input:{text:'attacker'}});
  try {
    assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'text/plain'},body})).status,415);assert.equal(policies,0);
    assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'application/json',origin:'https://attacker.example'},body})).status,403);assert.equal(mutations,0);
    assert.equal(count(),0);
    assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'application/json; charset=utf-8',origin:'https://approved.example'},body})).status,200);assert.equal(mutations,1);
    assert.equal(count(),1);
  } finally {await new Promise(resolve=>server.close(resolve));host.dispose();database.close();}
});

test('Electron capability protects every route and proxy limits bound actual bytes, cache, concurrency and deduplication', async () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-proxy-'));let upstream=0;
  const handle=createXtendLlmAppServer({cacheRoot:temp,proxyLimits:{maxObjectBytes:32,maxCacheBytes:40,maxApiBytes:8,maxConcurrent:2,timeoutMs:1000},fetch:async (url)=>{upstream++;return new Response(url.includes('oversize')?'x'.repeat(33):url.includes('/api/')?'x'.repeat(9):'x'.repeat(24));}});
  const base=await handle.listen();const headers={[APP_CAPABILITY_HEADER]:handle.capability};
  try {
    for (const route of ['/','/repo/package.json','/src/main/app-server.mjs','/hf/model/file','/hf-api/models']) assert.equal((await fetch(new URL(route,base))).status,403);
    assert.equal(await rawStatus(base,{...headers,host:'rebound.example'}),403);
    assert.equal((await fetch(base,{headers:{...headers,origin:'https://attacker.example'}})).status,403);
    assert.equal((await fetch(new URL('/repo/package.json',base),{headers})).status,404);
    const urls=['/hf/model/a','/hf/model/a'];const responses=await Promise.all(urls.map(url=>fetch(new URL(url,base),{headers})));
    assert.ok(responses.every(r=>r.status===200));assert.equal(upstream,1);await Promise.all(responses.map(r=>r.arrayBuffer()));
    assert.equal((await fetch(new URL('/hf/model/oversize',base),{headers})).status,502);
    assert.equal(fs.existsSync(path.join(temp,'model/oversize')),false);
    assert.equal((await fetch(new URL('/hf-api/models',base),{headers})).status,502);
    assert.equal((await fetch(new URL('/hf/model/b',base),{headers})).status,200);
    assert.equal(fs.existsSync(path.join(temp,'model/a')),false);
    assert.equal(fs.readdirSync(path.join(temp,'model')).some(n=>n.includes('.tmp-')),false);
    let listener;configureAppServerSession({webRequest:{onBeforeSendHeaders(_filter,callback){listener=callback;}}},base,handle.capability);
    listener({url:new URL('/worker.mjs',base).href,requestHeaders:{}},({requestHeaders})=>assert.equal(requestHeaders[APP_CAPABILITY_HEADER],handle.capability));
    listener({url:'https://other.example/',requestHeaders:{}},({requestHeaders})=>assert.equal(requestHeaders[APP_CAPABILITY_HEADER],undefined));
  } finally {await handle.close();fs.rmSync(temp,{recursive:true,force:true});}
});

test('ResumeStore expires, consumes and bounds entries and retained bytes', () => {
  let now=0;const store=new ResumeStore({ttlMs:10,maxEntries:2,maxBytes:40,clock:()=>now});
  store.set('a',{value:'a'});store.set('b',{value:'b'});store.set('c',{value:'c'});
  assert.equal(store.consume('a'),undefined);assert.deepEqual(store.consume('b'),{value:'b'});assert.equal(store.consume('b'),undefined);
  now=11;assert.equal(store.consume('c'),undefined);assert.equal(store.bytes,0);
  for(let i=0;i<1000;i++) store.set(String(i),{value:'payload'});
  assert.ok(store.records.size<=2);assert.ok(store.bytes<=40);
  assert.throws(()=>store.set('oversize',{value:'x'.repeat(100)}));
});

test('local upstream fixture enforces proxy concurrency, timeouts and failed-download cleanup', async () => {
  let started;
  const ready=new Promise(resolve=>{started=resolve;});
  const upstream=http.createServer((request,response)=>{
    if(request.url.includes('stall')) {response.writeHead(200);response.write('a');started();return;}
    response.end('fixture');
  });
  upstream.listen(0,'127.0.0.1');await once(upstream,'listening');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-upstream-'));
  const handle=createXtendLlmAppServer({cacheRoot:temp,proxyLimits:{maxConcurrent:1,timeoutMs:100,maxObjectBytes:16,maxCacheBytes:32},fetch:(url,options)=>fetch(`http://127.0.0.1:${upstream.address().port}${new URL(url).pathname}`,options)});
  const base=await handle.listen();const headers={[APP_CAPABILITY_HEADER]:handle.capability};
  try {
    const blocked=fetch(new URL('/hf/model/stall',base),{headers});await ready;
    assert.equal((await fetch(new URL('/hf/model/other',base),{headers})).status,502);
    assert.equal((await blocked).status,502);
    assert.deepEqual(fs.readdirSync(path.join(temp,'model')),[]);
    assert.equal((await fetch(new URL('/hf/model/recovered.tmp-valid',base),{headers})).status,200);
    assert.equal(fs.statSync(path.join(temp,'model/recovered.tmp-valid')).size,7);
  } finally {await handle.close();upstream.closeAllConnections();await new Promise(resolve=>upstream.close(resolve));fs.rmSync(temp,{recursive:true,force:true});}
});

test('zero-byte model objects obey the cache entry quota', async () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xtend-cache-count-'));
  const handle=createXtendLlmAppServer({cacheRoot:temp,proxyLimits:{maxCacheEntries:2},fetch:async()=>new Response('')});
  const base=await handle.listen();const headers={[APP_CAPABILITY_HEADER]:handle.capability};
  try {
    for(const name of ['a','b','c']) {const response=await fetch(new URL(`/hf/model/${name}`,base),{headers});assert.equal(response.status,200);await response.text();}
    assert.equal(fs.readdirSync(path.join(temp,'model')).length,2);
  } finally {await handle.close();fs.rmSync(temp,{recursive:true,force:true});}
});

test('ERP and animation directory/encoded traversal requests leave servers alive; resume requires and consumes its token', async () => {
  for (const start of [startAnimation,startErp]) {
    const handle=await start({port:0,silent:true});const base=handle.url || `http://${handle.host}:${handle.port}/`;
    try {
      for(const route of ['/src/','/src/client/','/dist/','/dist/..%2fpackage.json']) {
        const response=await fetch(new URL(route,base));assert.notEqual(response.status,200);await response.text();
      }
      const page=await fetch(start===startAnimation ? base : new URL('/src/client/demo-client.mjs',base));
      const html=await page.text();
      if(start===startAnimation) assert.equal(page.status,200);
      else { const response=await fetch(new URL('/src/client/',base));assert.equal(response.status,404); }

      if(start===startAnimation) {
        assert.equal((await fetch(new URL('/api/resume',base))).status,404);
        const token=html.match(/data-resume-token="([^"]+)"/)[1];
        const url=new URL(`/api/resume?token=${token}`,base);
        assert.equal((await fetch(url)).status,200);assert.equal((await fetch(url)).status,404);
      }
    } finally {await handle.close();}
  }
});

test('animation server rejects excess parallel renders and recovers when work completes', async () => {
  let release;const work=new Promise(resolve=>{release=resolve;});let started=0;let ready;
  const allStarted=new Promise(resolve=>{ready=resolve;});
  const handle=await startAnimation({port:0,silent:true,renderPage:async()=>{if(++started===4)ready();await work;return '<p>fixture</p>';}});
  try {
    const pending=Array.from({length:4},()=>fetch(handle.url));await allStarted;
    assert.equal((await fetch(handle.url)).status,503);
    release();assert.ok((await Promise.all(pending)).every(response=>response.status===200));
    assert.equal((await fetch(handle.url)).status,200);
  } finally {release();await handle.close();}
});
