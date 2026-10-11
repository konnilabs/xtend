import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
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
